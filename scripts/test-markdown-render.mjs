import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const markdown = read('src/utils/markdown.ts')
const theme = read('src/data/site/theme.ts')
const styles = read('src/styles/markdown/index.scss')
const pdf = read('src/utils/exportPdf.ts')
const postView = read('src/views/PostView.vue')
const noteView = read('src/views/NoteView.vue')
const noteCard = read('src/components/content/NoteCard.vue')
const note = read('src/data/docs/notes/CurrentAffairsReading.md')
const allowedTags = markdown.match(/const ALLOWED_TAGS = new Set\(\[[\s\S]*?\n\]\)/)?.[0] || ''
const whaleMetaStart = note.indexOf('## 九、准确率超90%！AI能翻译鲸鱼的语言了')
const whaleMetaEnd = note.indexOf('## 十、人生下半场', whaleMetaStart)
const whaleMeta = note.slice(whaleMetaStart, whaleMetaEnd < 0 ? undefined : whaleMetaEnd)

const checks = [
  ['sanitizer keeps u', /['"]u['"]/.test(allowedTags)],
  ['dark underline is white', /--md-underline-color:\s*#fff\b/i.test(styles)],
  ['light underline is black', /--md-underline-color:\s*#000\b/i.test(styles)],
  ['purple uses pink companion', /purple:[\s\S]*secondary:\s*['"]#ff69b4['"]/i.test(theme)],
  ['green uses purple companion', /green:[\s\S]*secondary:\s*['"]#9b3dff['"]/i.test(theme)],
  ['pdf maps underline', /tag\s*===\s*['"]u['"][\s\S]*decoration\s*=\s*['"]underline['"]/i.test(pdf)],
  ['pdf underline is black', /PDF_UNDERLINE_COLOR\s*=\s*['"]#000['"]/i.test(pdf)],
  ['scoped views keep underline styling', /:deep\(u\)[\s\S]*?md-underline-color/.test(postView) && /:deep\(u\)[\s\S]*?md-underline-color/.test(noteView) && /:deep\(u\)[\s\S]*?md-underline-color/.test(noteCard)],
  ['metadata breaks are normalized', /function normalizeMarkdownMetadataBreaks\([\s\S]*?metadataLinePattern/.test(markdown) && /split\(codeFencePattern\)/.test(markdown) && /normalizeMarkdownMetadataBreaks\(source\)/.test(markdown)],
  ['whale metadata remains structured', /原文标题[^\r\n]*\r?\n\*\*作者[^\r\n]*\r?\n\*\*发布日期/.test(whaleMeta)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label] of checks) {
  console.log(`${failures.some(([name]) => name === label) ? 'FAIL' : 'PASS'} ${label}`)
}
if (failures.length) process.exitCode = 1
