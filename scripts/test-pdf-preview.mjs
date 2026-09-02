import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const readOptional = (file) => {
  const fullPath = path.join(root, file)
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''
}

const hook = read('src/composables/useArticlePdfExport.ts')
const button = read('src/components/content/ArticleExportButton.vue')
const pdf = read('src/utils/exportPdf.ts')
const fallback = readOptional('src/utils/pdfMainFallback.ts')
const cursor = read('src/components/system/BounceCursor.vue')
const pointerEffects = readOptional('src/utils/pointerEffects.ts')

const previewStart = hook.indexOf('async function previewArticlePdf()')
const exportStart = hook.indexOf('  async function exportArticlePdf()', previewStart)
const previewFunction = previewStart >= 0
  ? hook.slice(previewStart, exportStart >= 0 ? exportStart : hook.length)
  : ''
const openIndex = previewFunction.indexOf("window.open('', '_blank')")
const firstAwaitIndex = previewFunction.indexOf('await ')
const resetIndex = previewFunction.indexOf('resetPointerEffects()')
const sourceIndex = previewFunction.indexOf('buildPdfSource(route.path)')
const forbiddenPageLocks = /body\.style\.overflow|documentElement\.style\.overflow|setPointerCapture\(|pointerEvents\s*=/

const checks = [
  [
    'the top article control is a PDF preview command',
    /@click=["']previewArticlePdf["']/.test(button)
      && /PDF\s*Preview|PDF\s*预览/i.test(button)
      && /Preview article as PDF/i.test(button),
  ],
  [
    'the preview window opens synchronously before any asynchronous work',
    openIndex >= 0 && firstAwaitIndex >= 0 && openIndex < firstAwaitIndex,
  ],
  [
    'preview window severs the opener relationship before PDF navigation',
    /previewWindow\.opener\s*=\s*null/.test(previewFunction),
  ],
  [
    'pointer effects reset synchronously before the new window opens',
    resetIndex >= 0 && resetIndex < openIndex
      && /POINTER_EFFECTS_RESET_EVENT/.test(pointerEffects)
      && /POINTER_EFFECTS_RESET_EVENT/.test(cursor),
  ],
  [
    'the click handler yields before cloning the rendered article',
    firstAwaitIndex >= 0 && sourceIndex >= 0 && firstAwaitIndex < sourceIndex,
  ],
  [
    'preview generation targets the pre-opened window',
      /generateArticlePdf\([\s\S]*?mode:\s*['"]preview['"][\s\S]*?targetWindow:\s*previewWindow/.test(previewFunction)
      && /mode\s*===\s*['"]preview['"][\s\S]*?\.open\(options\.targetWindow\)/.test(fallback),
  ],
  [
    'preview failures close the blank window and release busy state',
    /previewWindow\.close\(\)/.test(previewFunction)
      && /finally[\s\S]*?exporting\.value\s*=\s*false/.test(previewFunction),
  ],
  [
    'popup blocking is handled without starting PDF work',
    /if\s*\(!previewWindow\)\s*return false/.test(previewFunction),
  ],
  [
    'the console download path remains the default output',
      /async function exportArticlePdf/.test(hook)
      && /generateArticlePdf\(source, siteProfile\.title \|\| ['"]Nexus['"]\)/.test(hook)
      && /\.download\(/.test(fallback),
  ],
  [
    'the preview path does not lock scroll or capture the pointer',
    !forbiddenPageLocks.test(previewFunction)
      && !forbiddenPageLocks.test(button)
      && !forbiddenPageLocks.test(pointerEffects),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
