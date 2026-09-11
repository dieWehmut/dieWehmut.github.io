import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const pdf = read('src/utils/exportPdf.ts')
const hook = read('src/composables/useArticlePdfExport.ts')
const packageJson = JSON.parse(read('package.json'))

const checks = [
  [
    'PDF bytes can be prepared without navigating a window',
    /export\s+async\s+function\s+prepareArticlePdf/.test(pdf)
      && /Promise<ArrayBuffer>/.test(pdf),
  ],
  [
    'prepared PDF bytes can be delivered to a preview window',
    /export\s+function\s+deliverArticlePdfBytes/.test(pdf)
      && /URL\.createObjectURL/.test(pdf),
  ],
  [
    'article pages start full-PDF pre-render as soon as Markdown is complete',
    /prewarmArticlePdf|prepareArticlePdf/.test(hook)
      && /waitForMarkdownRenderComplete/.test(hook)
      && /setTimeout\(warm,\s*(?:[0-9_]{1,3})\)/.test(hook),
  ],
  [
    'cached bytes are invalidated by a source fingerprint',
    /fingerprint|cacheKey/i.test(hook)
      && /innerHTML/.test(hook),
  ],
  [
    'the cache path remains available for download and preview',
    /deliverArticlePdfBytes/.test(hook)
      && /previewArticlePdf/.test(hook)
      && /exportArticlePdf/.test(hook),
  ],
  [
    'the cache regression test is exposed through package scripts',
    packageJson.scripts?.['test:pdf-cache'] === 'node scripts/test-pdf-cache.mjs',
  ],
  [
    'user export can cancel the short startup timer before it enters the queue',
    /pdfWarmupTimer/.test(hook)
      && /clearTimeout\(pdfWarmupTimer\)/.test(hook)
      && /setTimeout\(warm,\s*(?:[0-9_]{1,3})\)/.test(hook),
  ],
  [
    'idle preparation does not duplicate formula and image warm-up before generation',
    !/collectArticlePdfImageSources|collectArticlePdfMathFormulas/.test(hook),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
