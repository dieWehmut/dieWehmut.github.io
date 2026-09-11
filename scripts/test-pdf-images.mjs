import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const pdf = read('src/utils/exportPdf.ts')
const client = read('src/utils/pdfWorkerClient.ts')
const fallback = read('src/utils/pdfMainFallback.ts')
const worker = read('src/workers/articlePdf.worker.ts')
const protocol = read('src/utils/pdfWorkerProtocol.ts')
const hook = read('src/composables/useArticlePdfExport.ts')

const checks = [
  [
    'PDF image nodes use stable dictionary references',
    /nexusImage/.test(pdf)
      && /imageToContent[\s\S]*?nexusImage/.test(pdf),
  ],
  [
    'image embedding deduplicates repeated source URLs',
    /function\s+embedImages[\s\S]*?new\s+Map/.test(pdf)
      && /bySource|sourcePromises|imageCache/.test(pdf),
  ],
  [
    'image data is reused across repeated previews with a bounded cache',
    /pdfImageAssetCache/.test(pdf)
      && /pdfImageAssetCache\.get\(src\)/.test(pdf)
      && /pdfImageAssetCache\.size/.test(pdf),
  ],
  [
    'document definitions contain one pdfmake image dictionary',
    /images\s*[:=]/.test(pdf)
      && /dataUrl/.test(pdf),
  ],
  [
    'worker resolves image markers through the dictionary key',
    /nexusImage/.test(worker)
      && /image\s*:\s*[^,]+key/.test(worker),
  ],
  [
    'main-thread fallback resolves image markers through the dictionary key',
    /nexusImage/.test(fallback)
      && /image\s*:\s*[^,]+key/.test(fallback),
  ],
  [
    'large image data is not copied into every DOM dataset entry',
    !/image\.dataset\.pdfImage\s*=\s*dataUrl/.test(pdf),
  ],
  [
    'worker payloads carry image sources instead of main-thread data URLs',
    /PdfWorkerImageSource/.test(protocol)
      && /images\??\s*:\s*PdfWorkerImageSources/.test(protocol)
      && /collectArticlePdfImageSources/.test(pdf),
  ],
  [
    'worker compresses large raster images off the main thread',
    /createImageBitmap/.test(worker)
      && /OffscreenCanvas/.test(worker)
      && /convertToBlob/.test(worker),
  ],
  [
    'worker image assets are cached and included in the final dictionary',
    /pdfImageAssetCache|imageAssetCache/.test(worker)
      && /preparePdfImages/.test(worker)
      && /images:\s*imageAssets/.test(worker),
  ],
  [
    'idle preparation does not enqueue a duplicate image warm-up',
    !/collectArticlePdfImageSources/.test(hook)
      && !/warmPdfWorker\([\s\S]*images/.test(hook),
  ],
  [
    'lazy images do not inherit the placeholder width',
    /naturalWidth\s*>\s*1/.test(pdf)
      && /IMAGE_MAX_WIDTH_PT/.test(pdf),
  ],
  [
    'failed worker image loads can be retried',
    /if\s*\(!asset\)\s*pdfImageAssetCache\.delete\(source\)/.test(worker),
  ],
  [
    'paragraph images remain image content instead of alt-only text',
    /PdfInlineImageSegment/.test(pdf)
      && /kind:\s*['"]image['"]/.test(pdf)
      && /const\s+hasImage/.test(pdf)
      && /!hasMath\s*&&\s*!hasImage/.test(pdf)
      && /stack:\s*segments/.test(pdf),
  ],
  [
    'missing worker image keys degrade without invalid pdfmake references',
    /imageMarker\.alt/.test(worker)
      && /availableImages|imageAssets/.test(worker)
      && /text:\s*`\[\$\{.*alt/.test(worker),
  ],
  [
    'image bitmap decode failures still fall back to the original blob',
    /createImageBitmap/.test(worker)
      && /blob\.arrayBuffer\(\)/.test(worker)
      && /catch\s*\{[\s\S]*?bitmap/.test(worker),
  ],
  [
    'user PDF generation takes priority over queued warm-up work',
    /priorit|cancelWarm|warm.*superseded/i.test(client)
      && /generatePdfInWorker[\s\S]*enqueue\([\s\S]*true/.test(client),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
