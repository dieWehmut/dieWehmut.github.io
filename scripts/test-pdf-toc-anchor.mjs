import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { attachHeadingAnchor } from '../src/utils/pdfHeadingAnchor.mjs'

const root = path.resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const pdfMake = require('pdfmake/build/pdfmake')
const pdfFonts = require('pdfmake/build/vfs_fonts')
try { pdfMake.addVirtualFileSystem(pdfFonts) } catch { pdfMake.vfs = pdfFonts }

const pdfSource = fs.readFileSync(path.join(root, 'src/utils/exportPdf.ts'), 'utf8')
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10" width="20" height="10"><rect width="20" height="10" fill="#000"/></svg>'
// The worker replaces each nexusMath marker with rendered SVG before pdfmake
// runs, so the stack a heading produces holds text segments plus svg nodes.
const mathSegment = { svg, fit: [20, 10] }

// A real article heading mixes prose with inline math ("三转角方程（$m$ 形式）"),
// so the heading reaches pdfmake as a stack instead of a single text node.
function buildDefinition(anchoredSegments) {
  const tocEntry = { text: '三转角方程（m 形式）' }
  const pageRef = { width: 'auto', pageReference: 'pdf-toc-1', text: '0' }
  return {
    definition: {
      content: [
        { stack: [tocEntry, { columns: [tocEntry, pageRef] }] },
        { text: 'filler', pageBreak: 'after' },
        { stack: anchoredSegments, style: 'h4' },
        { text: 'trailing paragraph' },
      ],
    },
    pageRef,
  }
}

let passed = 0
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`)
  if (condition) passed += 1
  else process.exitCode = 1
}

// The regression itself: an id on the stack is dropped, so pdfmake used to
// abandon the whole export. The helper must move it onto a text segment.
const segments = [
  { text: '三转角方程（', margin: [0, 0, 0, 0] },
  mathSegment,
  { text: ' 形式）', margin: [0, 0, 0, 0] },
]
const anchored = attachHeadingAnchor(segments, 'pdf-toc-1')
check('anchor rides on a text segment, not the stack', (
  'id' in anchored[0] && anchored[0].id === 'pdf-toc-1'
  && !('id' in mathSegment)
  && !segments.some((segment) => segment.id === 'pdf-toc-1')
))
check('helper returns a copy instead of mutating its input', segments[0].id === undefined)

const mathFirst = [mathSegment, { text: ' 形式）' }]
check('anchor still lands on text when math leads', attachHeadingAnchor(mathFirst, 'pdf-toc-1')[1].id === 'pdf-toc-1')

const mathOnly = [mathSegment]
const emptyCarrier = attachHeadingAnchor(mathOnly, 'pdf-toc-1')
check('math-only heading gets an empty carrier segment', (
  emptyCarrier.length === 2 && emptyCarrier[0].text === '' && emptyCarrier[0].id === 'pdf-toc-1'
))

// End-to-end through pdfmake: the page number must resolve.
const { definition, pageRef } = buildDefinition(anchored)
let buffer = null
try {
  buffer = await pdfMake.createPdf(definition).getBuffer()
} catch (error) {
  console.log('  export failed:', String(error))
}
check('pdfmake completes the export', Boolean(buffer) && Buffer.from(buffer).subarray(0, 5).toString() === '%PDF-')
// pdfmake records the resolved page on the anchor node it actually read.
check('contents page resolved a real page number', anchored[0].positions?.[0]?.pageNumber === 2)

// The old shape must still fail, which keeps this test honest about the cause.
const broken = buildDefinition(segments).definition
broken.content[2].id = 'pdf-toc-1'
let brokenFailed = false
try {
  await pdfMake.createPdf(broken).getBuffer()
} catch (error) {
  brokenFailed = /Page reference id not found/.test(String(error))
}
check('an id on the stack alone remains unsupported by pdfmake', brokenFailed)

// The production heading path must use the inline anchor argument.
check('heading converter passes the toc id into the inline converter', (
  /return \[inlineNodesToContent\(nodes, palette, tag, tocId\)\]/.test(pdfSource)
))
check('heading no longer assigns an id to the returned stack', (
  !/\(heading as Content & \{ id: string \}\)\.id = tocId/.test(pdfSource)
))

console.log(`\n${passed} checks passed`)
