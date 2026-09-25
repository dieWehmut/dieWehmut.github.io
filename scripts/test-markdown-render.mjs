import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

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
const headingNavigation = fs.existsSync(path.join(root, 'src/utils/headingNavigation.ts'))
  ? read('src/utils/headingNavigation.ts')
  : ''
const router = read('src/router.ts')
const scrollSpy = read('src/components/system/ScrollSpySidebar.vue')
const markdownContent = read('src/components/content/MarkdownContent.vue')
const cognitiveScience = read('src/data/docs/notes/CognitiveScience.md')
let normalizeMermaidSource = null
try {
  ;({ normalizeMermaidSource } = await import(
    pathToFileURL(path.join(root, 'src/utils/mermaidSource.mjs')).href
  ))
} catch {
  // The behavior check below reports the missing implementation as a failure.
}
const mermaidSubgraphFixture = `graph TD
    subgraph 中枢神经系统 (CNS)
        Brain[脑] --> Spinal[脊髓]
    end`
const normalizedMermaidSubgraph = `graph TD
    subgraph "中枢神经系统 (CNS)"
        Brain[脑] --> Spinal[脊髓]
    end`
const allowedTags = markdown.match(/const ALLOWED_TAGS = new Set\(\[[\s\S]*?\n\]\)/)?.[0] || ''
const whaleMetaStart = note.indexOf('## 九、准确率超90%！AI能翻译鲸鱼的语言了')
const whaleMetaEnd = note.indexOf('## 十、人生下半场', whaleMetaStart)
const whaleMeta = note.slice(whaleMetaStart, whaleMetaEnd < 0 ? undefined : whaleMetaEnd)
const vocabularyLinePattern = /^\s*[-*+]\s+\*\*[^*]+\*\*\s+英\s+\[[^\]]+\]\s*\/\s*美\s+\[[^\]]+\].*$/gmu
const vocabularyLines = note.match(vocabularyLinePattern) || []
const editableToolbar = markdown.match(/function renderEditableToolbar\([\s\S]*?\n\}/)?.[0] || ''
const toolbarOrder = ['run', 'fullscreen', 'edit'].map((action) => editableToolbar.indexOf(`data-md-action="${action}"`))
const narrowStyles = styles.slice(styles.indexOf('@media (max-width: 900px)'), styles.indexOf('@media (max-width: 640px)'))

// A heading the reader cannot tell apart from the paragraph under it has, for
// that reader, not been rendered: the article views pinned the ladder down to
// h4 and let h5/h6 fall through to the shared scale, where 0.875em measured
// *below* the body size. Both surfaces must keep every level above the prose
// and strictly descending, so the check reads the declared numbers rather than
// trusting one stylesheet to stay in step with the other.
function articleHeadingLadder(source, label) {
  const ladder = {}
  for (const match of source.matchAll(/:deep\(h([1-6])\) \{ font-size: (\d+(?:\.\d+)?)px; \}/g)) {
    ladder[Number(match[1])] = Number(match[2])
  }
  const bodySize = Number(source.match(/__(?:body|view__body) \{[^}]*font-size: (\d+(?:\.\d+)?)px/)?.[1])
  if (!bodySize || Object.keys(ladder).length !== 6) {
    return [`${label} declares all six heading sizes`]
  }
  const failures = []
  for (const level of [1, 2, 3, 4, 5, 6]) {
    if (!(ladder[level] > bodySize)) failures.push(`${label} h${level} rises above the body size`)
    if (level > 1 && !(ladder[level] < ladder[level - 1])) failures.push(`${label} h${level} stays under h${level - 1}`)
  }
  return failures
}

function sharedHeadingScale(source) {
  const scale = {}
  for (const match of source.matchAll(/\.markdown-body h([4-6]) \{[^}]*font-size: (\d+(?:\.\d+)?)em; \}/g)) {
    scale[Number(match[1])] = Number(match[2])
  }
  const failures = []
  for (const level of [4, 5, 6]) {
    if (!(scale[level] > 1)) failures.push(`shared h${level} rises above the prose it sits in`)
    if (level > 4 && !(scale[level] < scale[level - 1])) failures.push(`shared h${level} stays under h${level - 1}`)
  }
  return failures
}

const headingLadderFailures = [
  ...articleHeadingLadder(postView, 'post view'),
  ...articleHeadingLadder(noteView, 'note view'),
  ...sharedHeadingScale(styles),
]

const checks = [
  ['sanitizer keeps u', /['"]u['"]/.test(allowedTags)],
  ['dark underline is white', /--md-underline-color:\s*#fff\b/i.test(styles)],
  ['light underline is black', /--md-underline-color:\s*#000\b/i.test(styles)],
  ['purple uses pink companion', /purple:[\s\S]*secondary:\s*['"]#ff69b4['"]/i.test(theme)],
  ['green uses purple companion', /green:[\s\S]*secondary:\s*['"]#9b3dff['"]/i.test(theme)],
  ['pdf maps underline', /tag\s*===\s*['"]u['"][\s\S]*decoration\s*=\s*['"]underline['"]/i.test(pdf)],
  ['pdf underline is black', /PDF_UNDERLINE_COLOR\s*=\s*['"]#000['"]/i.test(pdf)],
  ['scoped views keep underline styling', /:deep\(u\)[\s\S]*?md-underline-color/.test(postView) && /:deep\(u\)[\s\S]*?md-underline-color/.test(noteView) && /:deep\(u\)[\s\S]*?md-underline-color/.test(noteCard)],
  [`levels 4-6 render above the prose in every markdown surface${
    headingLadderFailures.length ? `\n       ${headingLadderFailures.join('\n       ')}` : ''
  }`, headingLadderFailures.length === 0],
  ['metadata breaks are normalized', /function normalizeMarkdownMetadataBreaks\([\s\S]*?metadataLinePattern/.test(markdown) && /split\(codeFencePattern\)/.test(markdown) && /normalizeMarkdownMetadataBreaks\(source\)/.test(markdown)],
  ['whale metadata remains structured', /原文标题[^\r\n]*\r?\n\*\*作者[^\r\n]*\r?\n\*\*发布日期/.test(whaleMeta)],
  ['all vocabulary lines are recognized', vocabularyLines.length === 164],
  ['vocabulary renderer keeps nested definitions', /md-vocabulary-entry/.test(markdown) && /tokens\.slice\(1\)/.test(markdown)],
  ['vocabulary renderer emits three rows', /md-vocabulary-entry__word/.test(markdown) && /md-vocabulary-entry__row/.test(markdown) && /data-md-audio-lang/.test(markdown)],
  ['vocabulary suffix is preserved', /watershed/.test(note) && /suffix/.test(markdown)],
  ['speech synthesis uses regional languages', /SpeechSynthesisUtterance/.test(markdown) && /en-GB/.test(markdown) && /en-US/.test(markdown)],
  ['audio action is delegated', /data-md-action=["']audio["']/.test(markdown) && /action\s*===\s*["']audio["']/.test(markdown)],
  ['audio pressed state is sanitized', /aria-pressed/.test(markdown) && /md-vocabulary-entry/.test(styles)],
  ['pdf preserves vocabulary rows', /md-vocabulary-entry/.test(pdf) && /palette\.secondary/.test(pdf) && /palette\.tertiary/.test(pdf)],
  ['heading navigation helper exists', /slugifyHeadingText/.test(headingNavigation) && /resolveHeading/.test(headingNavigation)],
  ['sanitizer decodes attributes before validation', /decodeHtmlEntities\(value\.trim\(\)/.test(markdown)],
  ['heading renderer uses shared slug', /headingNavigation/.test(markdown) && /slugifyHeadingText/.test(markdown) && /data-md-heading-title/.test(markdown)],
  ['progressive render shares heading registry', /headingIds/.test(markdownContent) && /headingIds/.test(markdown)],
  ['router defers hash scrolling', !/return\s+\{\s*el:\s*to\.hash/.test(router) && /to\.hash/.test(router)],
  ['sidebar retries route hashes', /route\.hash/.test(scrollSpy) && /MutationObserver/.test(scrollSpy) && /resolveHeading/.test(scrollSpy)],
  ['fullscreen sits between run and edit', toolbarOrder.every((index) => index >= 0) && toolbarOrder[0] < toolbarOrder[1] && toolbarOrder[1] < toolbarOrder[2]],
  ['fullscreen action is delegated', /action\s*===\s*['"]fullscreen['"]/.test(markdown) && /is-fullscreen/.test(markdown)],
  ['fullscreen releases the page it locked', /body\.style\.overflow/.test(markdown) && /removeEventListener\(['"]keydown['"], onFullscreenKeydown\)/.test(markdown) && /cleanupHandlers\.push\(releaseFullscreen\)/.test(markdown)],
  ['fullscreen overrides the editor height clamp', /\.md-editable-block\.is-fullscreen[\s\S]*?height:\s*auto\s*!important/.test(styles) && /\.md-editable-block\.is-fullscreen \.md-code-preview\s*\{\s*max-height:\s*none/.test(styles)],
  ['fullscreen button is desktop only but never traps', /\.md-editable-action--fullscreen\s*\{\s*display:\s*none/.test(narrowStyles) && /\.is-fullscreen \.md-editable-action--fullscreen\s*\{\s*display:\s*inline-flex/.test(narrowStyles)],
  ['mermaid fences emit async hydration placeholders', /data-md-mermaid-source/.test(markdown) && /ensureMermaidRendered/.test(markdown) && /import\(['"]mermaid['"]\)/.test(markdown)],
  ['mermaid graphs are rendered by the Mermaid runtime', /mermaid\.render/.test(markdown) && /md-mermaid__svg/.test(styles)],
  ['mermaid quotes subgraph titles with parentheses before parsing', typeof normalizeMermaidSource === 'function' && normalizeMermaidSource(mermaidSubgraphFixture) === normalizedMermaidSubgraph],
  ['cognitive science fixture contains graph diagrams for the renderer', /```mermaid\s*\r?\ngraph\s+(?:LR|TD)/.test(cognitiveScience)],
  ['math delimiters are protected before Marked parses markdown', /protectMathDelimiters/.test(markdown) && /restoreMathDelimiters/.test(markdown)],
  ['all supported display and inline delimiters are registered', /\\\[/.test(markdown) && /\\\]/.test(markdown) && /\\\(/.test(markdown) && /\\\)/.test(markdown) && /\$\$/.test(markdown)],
  ['cognitive science fixture contains display and inline latex', /\$\$[\s\S]+?\$\$/.test(cognitiveScience) && /\$[^$\r\n]+\$/.test(cognitiveScience)],
  ['mermaid hydration preserves an explicit source fallback', /md-mermaid__source/.test(markdown) && /md-mermaid--error/.test(markdown)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label] of checks) {
  console.log(`${failures.some(([name]) => name === label) ? 'FAIL' : 'PASS'} ${label}`)
}
if (failures.length) process.exitCode = 1
