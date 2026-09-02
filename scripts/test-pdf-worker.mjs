import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const pdf = read('src/utils/exportPdf.ts')
const client = read('src/utils/pdfWorkerClient.ts')
const fallback = read('src/utils/pdfMainFallback.ts')
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
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
