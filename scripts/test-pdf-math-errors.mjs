import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const pdfMake = require('pdfmake/build/pdfmake')
const invalidFormula = String.raw`\badcommand{a&b}`
const validFormula = String.raw`\frac{x^2}{2}`
const fontBytes = fs.readFileSync(path.join(root, 'src/assets/fonts/LXGWWenKai-Regular.ttf'))

// Execute both production entry points. Only browser transport (font fetch,
// Worker messages and download) is replaced; MathJax and pdfmake run normally.
for (const entry of ['src/workers/articlePdf.worker.ts', 'src/utils/pdfMainFallback.ts']) {
  let pdfBytes
  let resolvedDefinition
  let response
  const pdfAdapter = {
    addVirtualFileSystem: (...args) => pdfMake.addVirtualFileSystem(...args),
    get fonts() { return pdfMake.fonts },
    set fonts(value) { pdfMake.fonts = value },
    createPdf(definition) {
      resolvedDefinition = definition
      const document = pdfMake.createPdf(definition)
      return {
        getBuffer: () => document.getBuffer(),
        async download() { pdfBytes = await document.getBuffer() },
      }
    },
  }
  const scope = { postMessage(message) { response = message } }
  const exports = {}
  const source = fs.readFileSync(path.join(root, entry), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    fileName: entry,
  })
  const load = (id) => {
    if (id === 'pdfmake/build/pdfmake') return pdfAdapter
    if (id.endsWith('.ttf')) return 'test-font'
    return require(id)
  }
  const fetchFont = async () => ({
    ok: true,
    arrayBuffer: async () => fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength),
  })
  new Function('require', 'exports', 'self', 'fetch', outputText)(load, exports, scope, fetchFont)
  const definition = {
    defaultStyle: { font: 'LXGW' },
    styles: { mathBlock: { fontSize: 11 } },
    content: [
      { text: 'Text before math' },
      { nexusMath: { formula: validFormula, display: true } },
      { nexusMath: { formula: invalidFormula, display: true } },
      { nexusMath: { formula: invalidFormula, display: false } },
      { text: 'Text after math' },
    ],
  }
  if (entry.includes('/workers/')) {
    await scope.onmessage({ data: { type: 'generate', id: 1, payload: {
      definition, title: 'Formula regression', siteTitle: 'Nexus',
      palette: { accent: '#000000', secondary: '#000000', tertiary: '#000000' },
    } } })
    assert.equal(response?.type, 'success', response?.message)
    pdfBytes = response.buffer
  } else {
    await exports.generatePdfOnMain(definition, 'Formula regression', { mode: 'download' })
  }
  const content = resolvedDefinition.content
  assert.match(content[1].svg, /<svg\b/, 'valid formulas retain vector output')
  assert.equal(content[2].text, invalidFormula, 'invalid display formula remains readable')
  assert.equal(content[3].text, invalidFormula, 'invalid inline formula remains readable')
  assert.equal(content[4].text, 'Text after math', 'content after an invalid formula survives')
  const bytes = Buffer.from(pdfBytes)
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
  assert.match(bytes.subarray(-32).toString(), /%%EOF/)
  console.log(`PASS ${entry}: valid vector math and invalid-formula fallbacks produce a complete PDF (${bytes.length} bytes)`)
}
