import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const pdf = read('src/utils/exportPdf.ts')
const client = read('src/utils/pdfWorkerClient.ts')
const fallback = read('src/utils/pdfMainFallback.ts')
const protocol = read('src/utils/pdfWorkerProtocol.ts')
const exportHook = read('src/composables/useArticlePdfExport.ts')
const workerPath = path.join(root, 'src/workers/articlePdf.worker.ts')
const worker = fs.existsSync(workerPath) ? read('src/workers/articlePdf.worker.ts') : ''

const checks = [
  [
    'PDF generation has a dedicated worker entry',
    /articlePdf\.worker\?worker/.test(client) && /generatePdfInWorker/.test(pdf) && worker.length > 0,
  ],
  [
    'worker owns pdfmake buffer generation',
    /pdfMake\.createPdf\(.*\)/s.test(worker) && /getBuffer\(\)/.test(worker),
  ],
  [
    'worker owns MathJax conversion for deferred formulas',
    /mathjax\.document/.test(worker) && /nexusMath/.test(worker),
  ],
  [
    'worker returns transferable PDF bytes',
    /postMessage\([^;]+\[\s*buffer\s*\]/s.test(worker)
      && /transfer|ArrayBuffer/.test(worker),
  ],
  [
    'main thread does not synchronously render MathJax during DOM conversion',
      /renderMathSvg\(formula,\s*false\)/.test(pdf) === false
      && /renderMathSvg\(formula,\s*true\)/.test(pdf) === false,
  ],
  [
    'main PDF module keeps heavy libraries out of the first-click chunk',
    !/^import\s+(?!type\b)[^\n]*from ['"](?:pdfmake|mathjax-full)\//m.test(pdf)
      && /import\(['"]\.\/pdfMainFallback['"]\)/.test(pdf)
      && /pdfMake\.createPdf/.test(fallback),
  ],
  [
    'worker client cleans up synchronous and message-level failures',
    /try\s*\{\s*worker\.postMessage/.test(client)
      && /onmessageerror/.test(client)
      && /worker\.terminate\(\)/.test(client),
  ],
  [
    'worker protocol supports an explicit warm-up request',
    /type:\s*['"]warm['"]/.test(protocol)
      && /type:\s*['"]ready['"]/.test(protocol)
      && /warmPdfWorker/.test(client)
      && /ensureFonts\(\)/.test(worker)
      && /getMathJaxContext\(\)/.test(worker),
  ],
  [
    'worker client reuses one live worker across requests',
    /let\s+(?:shared|singleton|persistent)Worker\s*:\s*Worker\s*\|\s*null/.test(client)
      && /new\s+ArticlePdfWorker\(\)/.test(client)
      && /queue|pending/i.test(client)
      && !/finish\([\s\S]{0,500}?worker\.terminate\(\)/.test(client),
  ],
  [
    'worker requests carry ids so concurrent callers remain isolated',
    /id\s*:\s*number/.test(protocol)
      && /const\s+requestId\s*=\s*\+\+nextRequestId/.test(client)
      && /id:\s*requestId/.test(client)
      && /response\.id/.test(client),
  ],
  [
    'worker resets after fatal transport errors and can be recreated',
    /reset|dispose|terminate/i.test(client)
      && /shared|singleton|persistent/i.test(client)
      && /onerror/.test(client)
      && /onmessageerror/.test(client),
  ],
  [
    'article pages schedule a lazy worker warm-up while idle',
    /warmPdfWorker/.test(exportHook)
      && /requestIdleCallback|setTimeout/.test(exportHook)
      && /import\(['"]\.\.\/utils\/pdfWorkerClient['"]\)/.test(exportHook),
  ],
  [
    'article warm-up does not duplicate formula conversion before full pre-render',
    /formulas\??:\s*.*\[/.test(protocol)
      && !/collectArticlePdfMathFormulas/.test(exportHook)
      && /renderMathSvg\([^\n]*formula/.test(worker),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
