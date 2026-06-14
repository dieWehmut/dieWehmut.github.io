import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import ini from 'highlight.js/lib/languages/ini'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import powershell from 'highlight.js/lib/languages/powershell'
import r from 'highlight.js/lib/languages/r'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import katex from 'katex'
import markedKatex from 'marked-katex-extension'
import { openImagePreviewGallery } from './imagePreview'
import { getPublicAssetUrlCandidates, resolvePublicAssetUrl, retryPublicAssetImage } from './publicAssets'
import { runCode, type RunProgressStatus, type RunResult, type RunStatus } from './codeRunner'
import { ensureGiscusLogin } from './giscusAuth'

const ALLOWED_TAGS = new Set([
  'a', 'blockquote', 'br', 'button', 'code', 'del', 'details', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'input', 'ins', 'kbd',
  'li', 'mark', 'ol', 'p', 'path', 'pre', 's', 'section', 'small', 'span', 'strong', 'svg',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'th', 'thead', 'tr', 'ul',
])

const GLOBAL_ALLOWED_ATTRS = new Set([
  'class', 'id', 'title', 'lang', 'dir', 'role', 'hidden',
  'aria-hidden', 'aria-label', 'aria-describedby', 'aria-expanded',
])
const PER_TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  button: new Set(['type', 'data-copy-code']),
  input: new Set(['type', 'checked', 'disabled', 'readonly']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
  li: new Set(['value']),
  ol: new Set(['start', 'reversed', 'type']),
  path: new Set(['d']),
  span: new Set(['style']),
  svg: new Set(['xmlns', 'width', 'height', 'viewbox', 'preserveaspectratio']),
  textarea: new Set(['rows', 'spellcheck']),
  td: new Set(['align', 'colspan', 'rowspan']),
  th: new Set(['align', 'colspan', 'rowspan']),
}
const MARKDOWN_CACHE_LIMIT = 24
const MARKDOWN_PREVIEW_CACHE_LIMIT = 80
const MARKDOWN_PROGRESSIVE_MIN_LENGTH = 12000
const MARKDOWN_CHUNK_MIN_LENGTH = 3600
const MARKDOWN_CHUNK_TARGET_LENGTH = 7200
const MARKDOWN_CHUNK_MAX_LENGTH = 12000
const SOURCE_IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const renderedMarkdownCache = new Map<string, string>()
const renderedMarkdownPreviewCache = new Map<string, string>()

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('go', go)
hljs.registerLanguage('golang', go)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('powershell', powershell)
hljs.registerLanguage('ps1', powershell)
hljs.registerLanguage('r', r)
hljs.registerLanguage('rscript', r)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('toml', ini)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stripUnsafeAttributes(rawAttrs: string, tagName: string): string {
  const attrPattern = /([:@a-zA-Z_][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'`=<>]+))?/g
  const allowedAttrs = PER_TAG_ALLOWED_ATTRS[tagName] || new Set<string>()
  const collected: string[] = []
  let match: RegExpExecArray | null

  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const name = match[1]
    const value = match[2]
    const lowerName = name.toLowerCase()

    if (lowerName.startsWith('on')) continue
    if (!isAllowedAttribute(lowerName, allowedAttrs)) continue

    if (!value) {
      collected.push(lowerName)
      continue
    }

    const normalized = value.trim().replace(/^['"]|['"]$/g, '')
    if ((lowerName === 'href' || lowerName === 'src') && !isSafeUrl(normalized)) continue
    if (lowerName === 'style' && !isSafeStyle(normalized)) continue

    const safeValue = lowerName === 'src' && tagName === 'img'
      ? resolvePublicAssetUrl(normalized)
      : normalized

    collected.push(`${normalizeAttributeName(lowerName, tagName)}="${escapeHtml(safeValue)}"`)
  }

  return collected.length ? ` ${collected.join(' ')}` : ''
}

function normalizeAttributeName(lowerName: string, tagName: string): string {
  if (tagName === 'svg') {
    if (lowerName === 'viewbox') return 'viewBox'
    if (lowerName === 'preserveaspectratio') return 'preserveAspectRatio'
  }

  return lowerName
}

function isAllowedAttribute(lowerName: string, allowedAttrs: Set<string>): boolean {
  if (lowerName.startsWith('data-md-')) return true
  if (GLOBAL_ALLOWED_ATTRS.has(lowerName)) return true
  return allowedAttrs.has(lowerName)
}

function isSafeUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.startsWith('javascript:')) return false
  if (normalized.startsWith('data:text/html')) return false
  return true
}

function isSafeStyle(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.includes('url(')) return false
  if (normalized.includes('expression(')) return false
  if (normalized.includes('javascript:')) return false
  return /^[\w\s.,:%#()+\-;]*$/.test(value)
}

function sanitizeHtml(html: string): string {
  if (!html) return ''

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (full, tagName: string, rawAttrs: string) => {
      const lowerTag = tagName.toLowerCase()
      const isClosing = full.startsWith('</')
      if (!ALLOWED_TAGS.has(lowerTag)) return ''
      if (isClosing) return `</${lowerTag}>`
      const attrs = stripUnsafeAttributes(rawAttrs, lowerTag)
      const selfClosing = /\/\s*>$/.test(full) ? ' /' : ''
      return `<${lowerTag}${attrs}${selfClosing}>`
    })
}

function deferClosedSourcePageImages(html: string): string {
  return html.replace(/<details\b([^>]*)>([\s\S]*?)<\/details>/gi, (full, attrs: string, body: string) => {
    if (!/\bclass="[^"]*\bmd-source-page\b[^"]*"/i.test(attrs)) return full
    if (/\bopen\b/i.test(attrs)) return full

    const deferredBody = body.replace(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/gi, (
      imageFull: string,
      beforeSrc: string,
      src: string,
      afterSrc: string
    ) => {
      if (/\bdata-md-lazy-src=/i.test(imageFull)) return imageFull
      return `<img${beforeSrc}src="${SOURCE_IMAGE_PLACEHOLDER}" data-md-lazy-src="${src}"${afterSrc}>`
    })

    return `<details${attrs}>${deferredBody}</details>`
  })
}

function isCodeFenceLine(line: string): boolean {
  return /^(```|~~~)/.test(line.trim())
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length || 0
}

function countUnescapedDisplayDollars(value: string): number {
  let count = 0
  for (let index = 0; index < value.length - 1; index += 1) {
    if (value[index] !== '$' || value[index + 1] !== '$') continue
    if (value[index - 1] === '\\') continue
    count += 1
    index += 1
  }
  return count
}

function isChunkBoundaryStable(state: MarkdownSplitState): boolean {
  return !state.inCodeFence && !state.inDollarMath && !state.inBracketMath && state.detailsDepth <= 0
}

type MarkdownSplitState = {
  detailsDepth: number
  inBracketMath: boolean
  inCodeFence: boolean
  inDollarMath: boolean
}

function updateMarkdownSplitState(line: string, state: MarkdownSplitState) {
  if (isCodeFenceLine(line)) {
    state.inCodeFence = !state.inCodeFence
    return
  }

  if (state.inCodeFence) return

  const lowerLine = line.toLowerCase()
  state.detailsDepth += countMatches(lowerLine, /<details\b/g)
  state.detailsDepth -= countMatches(lowerLine, /<\/details>/g)
  state.detailsDepth = Math.max(0, state.detailsDepth)

  if (countUnescapedDisplayDollars(line) % 2 === 1) {
    state.inDollarMath = !state.inDollarMath
  }

  const bracketOpenCount = countMatches(line, /\\\[/g)
  const bracketCloseCount = countMatches(line, /\\\]/g)
  for (let index = 0; index < bracketOpenCount; index += 1) state.inBracketMath = true
  for (let index = 0; index < bracketCloseCount; index += 1) state.inBracketMath = false
}

function splitMarkdownIntoChunks(source: string): string[] {
  const normalized = source.replace(/\r\n/g, '\n')
  if (normalized.length < MARKDOWN_PROGRESSIVE_MIN_LENGTH) return [normalized]

  const lines = normalized.split('\n')
  const chunks: string[] = []
  const current: string[] = []
  const state: MarkdownSplitState = {
    detailsDepth: 0,
    inBracketMath: false,
    inCodeFence: false,
    inDollarMath: false,
  }
  let currentLength = 0

  const flush = () => {
    const chunk = current.join('\n').trim()
    if (chunk) chunks.push(chunk)
    current.length = 0
    currentLength = 0
  }

  for (const line of lines) {
    const stableBeforeLine = isChunkBoundaryStable(state)
    const isHeading = /^#{2,6}\s+/.test(line)
    if (stableBeforeLine && isHeading && currentLength >= MARKDOWN_CHUNK_MIN_LENGTH) {
      flush()
    }

    current.push(line)
    currentLength += line.length + 1
    updateMarkdownSplitState(line, state)

    const stableAfterLine = isChunkBoundaryStable(state)
    const isBlank = line.trim() === ''
    const endsDetails = /<\/details>\s*$/i.test(line)
    if (
      stableAfterLine &&
      (
        (currentLength >= MARKDOWN_CHUNK_TARGET_LENGTH && (isBlank || endsDetails)) ||
        (currentLength >= MARKDOWN_CHUNK_MAX_LENGTH && isBlank)
      )
    ) {
      flush()
    }
  }

  flush()
  return chunks.length ? chunks : [normalized]
}

type MindmapNode = {
  label: string
  children: MindmapNode[]
}

function cleanMindmapLabel(value: string): string {
  let label = value.trim().replace(/^root\s*/i, '').trim()
  const bracketMatch = label.match(/^(?:[A-Za-z0-9_-]+\s*)?(\(\((.+)\)\)|\((.+)\)|\[(.+)\]|\{\{(.+)\}\})$/)
  if (bracketMatch) {
    label = (bracketMatch[2] || bracketMatch[3] || bracketMatch[4] || bracketMatch[5] || '').trim()
  }
  return label || value.trim()
}

function renderMindmapNodes(nodes: MindmapNode[], depth = 0): string {
  if (!nodes.length) return ''
  const items = nodes.map((node) => {
    const depthClass = ` md-mindmap__node--depth-${Math.min(depth, 4)}`
    return `<li><span class="md-mindmap__node${depthClass}">${escapeHtml(node.label)}</span>${renderMindmapNodes(node.children, depth + 1)}</li>`
  }).join('')
  return `<ul>${items}</ul>`
}

function renderMermaidMindmap(lines: string[]): string {
  const root: MindmapNode = { label: 'Mind map', children: [] }
  const stack: Array<{ indent: number; node: MindmapNode }> = [{ indent: -1, node: root }]

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('%%')) continue
    const indent = rawLine.match(/^\s*/)?.[0].length || 0
    const node: MindmapNode = { label: cleanMindmapLabel(rawLine), children: [] }

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    stack[stack.length - 1].node.children.push(node)
    stack.push({ indent, node })
  }

  return `<figure class="md-mindmap"><figcaption>Mind map</figcaption>${renderMindmapNodes(root.children)}</figure>`
}

function renderMermaidDiagram(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const firstMeaningfulLine = lines.find((line) => line.trim())
  const diagramType = firstMeaningfulLine?.trim().toLowerCase() || ''

  if (diagramType === 'mindmap') {
    const firstIndex = lines.findIndex((line) => line.trim())
    return renderMermaidMindmap(lines.slice(firstIndex + 1))
  }

  const escaped = escapeHtml(text)
  return `<figure class="md-diagram"><figcaption>Mermaid diagram</figcaption><pre><code>${escaped}</code></pre></figure>`
}

type EditableBlockKind = 'code' | 'math'

type CodeLanguageInfo = {
  langClass: string
  langLabel: string
  validLang: string
}

type CodeFenceInfo = {
  lang: string
  fileName: string
}

function encodeSource(value: string): string {
  return encodeURIComponent(value).replace(/'/g, '%27')
}

function decodeSource(value: string | undefined): string {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function resolveCodeLanguage(lang: string | undefined): CodeLanguageInfo {
  const requestedLang = (lang || '').trim().split(/\s+/)[0]
  const validLang = requestedLang && hljs.getLanguage(requestedLang) ? requestedLang : ''
  return {
    langClass: validLang ? ` language-${validLang}` : '',
    langLabel: validLang || '',
    validLang,
  }
}

const RUNNER_ALIASES: Record<string, string> = {
  'golang': 'go',
  'rscript': 'r',
  'c++': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'hpp': 'cpp',
  'c#': 'csharp', 'cs': 'csharp',
  'f#': 'fsharp', 'fs': 'fsharp', 'fsx': 'fsharp',
  'js': 'javascript', 'node': 'javascript',
  'ts': 'typescript',
  'py': 'python', 'python3': 'python',
  'rb': 'ruby',
  'sh': 'bash', 'shell': 'bash',
  'asm': 'assembly', 'gas': 'assembly',
  'md': 'markdown',
  'dot': 'graphviz',
  'typ': 'typst',
  'vue': 'vue3', 'vuejs': 'vue3',
  'next': 'nextjs', 'next.js': 'nextjs',
  'kt': 'kotlin', 'kts': 'kotlin',
  'jl': 'julia',
  'ex': 'elixir', 'exs': 'elixir',
  'erl': 'erlang',
  'rkt': 'racket',
  'pl': 'prolog',
  'perl5': 'perl',
  'clj': 'clojure', 'cljs': 'clojure',
  'ml': 'ocaml',
  'sqlite': 'sql', 'sqlite3': 'sql',
  'v': 'vlang',
  'tailwind': 'tailwindcss', 'tailwind-css': 'tailwindcss',
  'gd': 'gdscript', 'godot': 'gdscript',
}

const KNOWN_RUNNERS = new Set([
  'go', 'assembly', 'c', 'cpp', 'rust', 'zig', 'vlang', 'nim', 'pascal', 'fortran',
  'python', 'javascript', 'typescript', 'ruby', 'perl', 'php', 'lua', 'r', 'julia', 'dart', 'crystal', 'bash',
  'java', 'kotlin', 'scala', 'clojure', 'gleam',
  'csharp', 'fsharp',
  'haskell', 'ocaml', 'elixir', 'erlang', 'racket', 'lean4', 'coq', 'prolog',
  'html', 'css', 'scss', 'tsx', 'vue3', 'qml', 'nextjs',
  'tailwindcss',
  'markdown', 'mdx', 'latex', 'typst', 'graphviz',
  'octave',
  'sql',
  'gdscript', 'nextflow', 'wdl',
  'mojo', 'cangjie', 'swift',
])

const RENDERABLE_RUNNERS = new Set([
  'html',
  'css', 'scss', 'tailwindcss',
  'markdown', 'md', 'mdx',
  'tsx', 'vue3', 'vue', 'nextjs', 'next',
  'latex', 'graphviz', 'dot', 'typst', 'typ',
])
const STYLE_RENDERABLE_RUNNERS = new Set(['css', 'scss', 'tailwindcss'])
const RUN_ALL_CONCURRENCY = 16

function resolveCodeRunner(lang: string | undefined): string {
  const requestedLang = (lang || '').trim().split(/\s+/)[0].toLowerCase()
  const canonical = RUNNER_ALIASES[requestedLang] || requestedLang
  return KNOWN_RUNNERS.has(canonical) ? canonical : ''
}

function isRenderableRunner(runner: string): boolean {
  return RENDERABLE_RUNNERS.has(runner)
}

function runnerActionLabel(runner: string): string {
  return isRenderableRunner(runner) ? '渲染' : '运行'
}

function runnerBusyLabel(runner: string): string {
  return isRenderableRunner(runner) ? '渲染中' : '运行中'
}

function stripFenceMetaQuotes(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function languageFromFileName(fileName: string): string {
  const basename = fileName.trim().split('/').pop() || ''
  const extension = basename.includes('.') ? basename.split('.').pop()?.toLowerCase() || '' : ''
  switch (extension) {
    case 'c':
      return 'c'
    case 'cc':
    case 'cpp':
    case 'cxx':
    case 'h':
    case 'hpp':
      return 'cpp'
    case 'go':
      return 'go'
    case 'js':
      return 'javascript'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'ps1':
      return 'powershell'
    case 'r':
      return 'r'
    case 'ts':
      return 'typescript'
    case 'xml':
    case 'html':
      return 'xml'
    case 'yaml':
    case 'yml':
      return 'yaml'
    default:
      return extension && hljs.getLanguage(extension) ? extension : ''
  }
}

function parseCodeFenceInfo(info: string | undefined): CodeFenceInfo {
  const tokens = (info || '').trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return { lang: '', fileName: '' }

  const firstToken = tokens[0]
  const firstLower = firstToken.toLowerCase()
  if (firstLower === 'file') {
    const fileName = stripFenceMetaQuotes(tokens[1] || '')
    const explicitLang = tokens
      .slice(2)
      .map((token) => token.match(/^(?:lang|language)=(.+)$/i)?.[1] || '')
      .find(Boolean)
    return {
      lang: explicitLang ? stripFenceMetaQuotes(explicitLang) : languageFromFileName(fileName),
      fileName,
    }
  }

  const fileToken = tokens
    .slice(1)
    .map((token) => token.match(/^(?:file|filename|path)=(.+)$/i)?.[1] || '')
    .find(Boolean)

  return {
    lang: firstToken,
    fileName: fileToken ? stripFenceMetaQuotes(fileToken) : '',
  }
}

function renderHighlightedCode(source: string, lang: string | undefined): string {
  const { langClass, validLang } = resolveCodeLanguage(lang)
  const highlighted = validLang
    ? hljs.highlight(source, { language: validLang }).value
    : escapeHtml(source)
  return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`
}

function escapeStyleEndTag(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style')
}

function injectStyleIntoHtml(html: string, css: string): string {
  const style = `<style>${escapeStyleEndTag(css)}</style>`
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${style}</head>`)
  if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`)
  return `<!doctype html><html><head>${style}</head><body>${html}</body></html>`
}

function defaultStylePreviewHtml(css: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    `<style>${escapeStyleEndTag(css)}</style>`,
    '</head>',
    '<body>',
    '<main class="greeting">hello from style preview</main>',
    '</body>',
    '</html>',
  ].join('')
}

function composeRenderableSrcdoc(runner: string, stdout: string, files: Array<{ name: string; content: string }>): string {
  if (!STYLE_RENDERABLE_RUNNERS.has(runner)) return stdout

  const htmlFile = files.find((file) => /\.html?$/i.test(file.name))
  if (htmlFile) return injectStyleIntoHtml(htmlFile.content, stdout)
  return defaultStylePreviewHtml(stdout)
}

function renderLatex(text: string, displayMode: boolean): string {
  const formula = text.trim()
  if (!formula) return ''

  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      output: 'html',
    })
  } catch {
    return `<span class="katex-error">${escapeHtml(formula)}</span>`
  }
}

function renderInlineLatex(text: string): string {
  return renderLatex(text, false)
}

function renderEditableToolbar(kind: EditableBlockKind, label: string, runner: string): string {
  const toolbarLabel = kind === 'math' ? 'LaTeX' : label
  const runLabel = runner ? runnerActionLabel(runner) : ''
  const runButton = runner
    ? `<button class="md-editable-action md-editable-action--run" type="button" data-md-action="run">${runLabel}</button>`
    : ''
  const sourceButton = kind === 'math'
    ? '<button class="md-editable-action" type="button" data-md-action="source" aria-expanded="false">显示源码</button>'
    : ''

  return [
    '<div class="md-code-header md-editable-toolbar">',
    `<span class="md-code-lang">${escapeHtml(toolbarLabel)}</span>`,
    '<div class="md-editable-actions">',
    '<button class="md-editable-action md-editable-action--restore" type="button" data-md-action="restore" hidden>复原</button>',
    runButton,
    '<button class="md-editable-action" type="button" data-md-action="edit" aria-expanded="false">修改</button>',
    sourceButton,
    '<button class="md-editable-action md-code-copy" type="button" data-copy-code data-md-action="copy">复制</button>',
    '</div>',
    '</div>',
  ].join('')
}

function renderEditableBlock(kind: EditableBlockKind, source: string, lang = '', fileName = ''): string {
  const encodedSource = escapeHtml(encodeSource(source))
  const { langLabel, validLang } = resolveCodeLanguage(lang)
  const runner = kind === 'code' && !fileName ? resolveCodeRunner(lang) : ''
  const content = kind === 'code'
    ? renderHighlightedCode(source, validLang)
    : renderLatex(source, true)
  const sourceView = kind === 'math'
    ? `<pre class="md-editable-source" hidden><code>${escapeHtml(source)}</code></pre>`
    : ''
  const runnerAttr = runner ? ` data-md-runner="${escapeHtml(runner)}"` : ''
  const fileNameAttr = fileName ? ` data-md-file-name="${escapeHtml(fileName)}"` : ''
  const fileClass = fileName ? ' md-file-block' : ''
  const label = fileName ? `file: ${fileName}` : langLabel

  return [
    `<div class="md-editable-block md-${kind}-block${fileClass}" data-md-kind="${kind}" data-md-original="${encodedSource}" data-md-current="${encodedSource}" data-md-lang="${escapeHtml(validLang)}"${runnerAttr}${fileNameAttr}>`,
    renderEditableToolbar(kind, label, runner),
    sourceView,
    `<div class="md-editable-content md-${kind}-content">${content}</div>`,
    '</div>',
  ].join('')
}

function renderDisplayLatexBlock(text: string): string {
  return `\n\n${renderEditableBlock('math', text.trim())}\n\n`
}

function preprocessMarkdownMath(source: string): string {
  const codeFencePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g

  return source
    .split(codeFencePattern)
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('~~~')) return part

      return part
        .replace(/\\\[([\s\S]+?)\\\]/g, (_match, formula: string) => renderDisplayLatexBlock(formula))
        .replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula: string) => renderDisplayLatexBlock(formula))
        .replace(/\\\(([\s\S]+?)\\\)/g, (_match, formula: string) => renderInlineLatex(formula))
    })
    .join('')
}

const marked = new Marked({
  async: false,
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const { lang: requestedLang, fileName } = parseCodeFenceInfo(lang)
      if (requestedLang.toLowerCase() === 'mermaid') {
        return renderMermaidDiagram(text)
      }
      return renderEditableBlock('code', text, requestedLang, fileName)
    },
    image({ href, title, text }) {
      const src = escapeHtml(resolvePublicAssetUrl(href || ''))
      const alt = escapeHtml(text || '')
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      return `<img src="${src}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens)
      const slug = text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fff-]/g, '')
        .toLowerCase()
      return `<h${depth} id="${slug}">${text}</h${depth}>\n`
    },
    list({ items, ordered, start }) {
      const tag = ordered ? 'ol' : 'ul'
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : ''
      const body = items.map((item) => this.listitem(item)).join('')
      return `<${tag}${startAttr}>\n${body}</${tag}>\n`
    },
    listitem({ tokens, task, checked }) {
      const text = this.parser.parse(tokens)
      if (!task) return `<li>${text}</li>\n`
      const checkedAttr = checked ? ' checked' : ''
      return `<li class="task-list-item"><input type="checkbox" disabled${checkedAttr}> ${text}</li>\n`
    },
  },
})

marked.use(markedKatex({
  nonStandard: true,
  throwOnError: false,
  output: 'html',
}))

function withRunAllToolbar(html: string): string {
  if (!html.includes('data-md-runner=')) return html
  return [
    '<div class="md-run-all-toolbar" role="group" aria-label="代码块批量操作">',
    '<button class="md-editable-action md-editable-action--run-all" type="button" data-md-global-action="run-all">全部运行/渲染</button>',
    '<span class="md-run-all-toolbar__status" data-md-run-all-status aria-live="polite"></span>',
    '</div>',
    html,
  ].join('')
}

export function renderMarkdown(source: string): string {
  if (!source) return ''
  const cached = renderedMarkdownCache.get(source)
  if (cached !== undefined) return cached

  const rendered = withRunAllToolbar(deferClosedSourcePageImages(sanitizeHtml(marked.parse(preprocessMarkdownMath(source)) as string)))
  renderedMarkdownCache.set(source, rendered)

  if (renderedMarkdownCache.size > MARKDOWN_CACHE_LIMIT) {
    const oldestKey = renderedMarkdownCache.keys().next().value
    if (oldestKey !== undefined) renderedMarkdownCache.delete(oldestKey)
  }

  return rendered
}

export function splitMarkdownForProgressiveRender(source: string): string[] {
  return splitMarkdownIntoChunks(source)
}

function rememberCached(cache: Map<string, string>, key: string, value: string, limit: number): string {
  cache.set(key, value)

  if (cache.size > limit) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) cache.delete(oldestKey)
  }

  return value
}

function normalizeMarkdownPreviewSource(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<summary[^>]*>[\s\S]*?<\/summary>/gi, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?(?:details|summary|big|b|br|hr|img)[^>]*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s*[>|]\s?/gm, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\\\[([\s\S]+?)\\\]/g, '\\($1\\)')
    .replace(/\$\$([\s\S]+?)\$\$/g, '\\($1\\)')
    .replace(/\s+/g, ' ')
    .trim()
}

export function renderMarkdownPreview(source: string): string {
  if (!source) return ''
  const normalized = normalizeMarkdownPreviewSource(source)
  if (!normalized) return ''

  const cached = renderedMarkdownPreviewCache.get(normalized)
  if (cached !== undefined) return cached

  const rendered = sanitizeHtml(marked.parseInline(preprocessMarkdownMath(normalized)) as string)
  return rememberCached(renderedMarkdownPreviewCache, normalized, rendered, MARKDOWN_PREVIEW_CACHE_LIMIT)
}

export function bindMarkdownInteractions(root: ParentNode | null | undefined): () => void {
  if (!root) return () => {}
  const resetTimers = new WeakMap<HTMLElement, number>()
  const activeTimers = new Set<number>()
  const cleanupHandlers: Array<() => void> = []
  let toastTimer: number | null = null

  const imagePreviewSrc = (image: HTMLImageElement): string => {
    const original = image.dataset.originalSrc || image.dataset.mdLazySrc || image.getAttribute('src') || ''
    return getPublicAssetUrlCandidates(original)[0] || image.src
  }

  const loadSourcePageImages = (details: HTMLDetailsElement) => {
    details.querySelectorAll<HTMLImageElement>('img[data-md-lazy-src]').forEach((image) => {
      const src = image.dataset.mdLazySrc || ''
      if (!src) return
      image.src = getPublicAssetUrlCandidates(src)[0] || src
    })
  }

  const bindImage = (image: HTMLImageElement) => {
    const originalSrc = image.getAttribute('src') || ''
    if (!originalSrc) return
    if (image.dataset.mdBound === 'true') return
    image.dataset.mdBound = 'true'

    image.dataset.originalSrc = image.dataset.mdLazySrc || originalSrc
    const sourcePage = image.closest<HTMLDetailsElement>('details.md-source-page')
    if (sourcePage && !sourcePage.open && !image.dataset.mdLazySrc) {
      image.dataset.mdLazySrc = originalSrc
      image.src = SOURCE_IMAGE_PLACEHOLDER
    }

    const onError = () => {
      retryPublicAssetImage(image, image.dataset.originalSrc || originalSrc)
    }

    image.addEventListener('error', onError)
    cleanupHandlers.push(() => image.removeEventListener('error', onError))

    if (!sourcePage && image.complete && image.naturalWidth === 0) {
      queueMicrotask(onError)
    }
  }

  const bindSourcePage = (details: HTMLDetailsElement) => {
    if (details.dataset.mdBound === 'true') return
    details.dataset.mdBound = 'true'

    if (details.open) loadSourcePageImages(details)

    const onToggle = () => {
      if (details.open) loadSourcePageImages(details)
    }

    details.addEventListener('toggle', onToggle)
    cleanupHandlers.push(() => details.removeEventListener('toggle', onToggle))
  }

  const bindStaticMarkdownNodes = (scope: ParentNode | Element) => {
    if (scope instanceof HTMLImageElement) bindImage(scope)
    if (scope instanceof HTMLDetailsElement && scope.classList.contains('md-source-page')) {
      bindSourcePage(scope)
    }

    scope.querySelectorAll<HTMLImageElement>('img').forEach(bindImage)
    scope.querySelectorAll<HTMLDetailsElement>('details.md-source-page').forEach(bindSourcePage)
  }

  bindStaticMarkdownNodes(root)

  if (window.MutationObserver && root instanceof Node) {
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) bindStaticMarkdownNodes(node)
        })
      })
    })
    observer.observe(root, { childList: true, subtree: true })
    cleanupHandlers.push(() => observer.disconnect())
  }

  const scheduleReset = (button: HTMLElement, label: string, state?: 'is-copied' | 'is-failed') => {
    const existingTimer = resetTimers.get(button)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
      activeTimers.delete(existingTimer)
    }

    const timer = window.setTimeout(() => {
      button.textContent = label
      if (state) button.classList.remove(state)
      resetTimers.delete(button)
      activeTimers.delete(timer)
    }, 2000)

    activeTimers.add(timer)
    resetTimers.set(button, timer)
  }

  const getBlockKind = (block: HTMLElement): EditableBlockKind => (
    block.dataset.mdKind === 'math' ? 'math' : 'code'
  )

  const getOriginalSource = (block: HTMLElement): string => decodeSource(block.dataset.mdOriginal)

  const getCurrentSource = (block: HTMLElement): string => (
    block.dataset.mdCurrent !== undefined
      ? decodeSource(block.dataset.mdCurrent)
      : getOriginalSource(block)
  )

  const isRunFileBlock = (element: Element | null): element is HTMLElement => (
    element instanceof HTMLElement &&
    element.classList.contains('md-editable-block') &&
    Boolean(element.dataset.mdFileName)
  )

  const collectAdjacentRunFiles = (block: HTMLElement) => {
    const files: Array<{ name: string; content: string }> = []

    let previous = block.previousElementSibling
    while (isRunFileBlock(previous)) {
      files.unshift({
        name: previous.dataset.mdFileName || '',
        content: getCurrentSource(previous),
      })
      previous = previous.previousElementSibling
    }

    let next = block.nextElementSibling
    while (isRunFileBlock(next)) {
      files.push({
        name: next.dataset.mdFileName || '',
        content: getCurrentSource(next),
      })
      next = next.nextElementSibling
    }

    return files.filter((file) => file.name)
  }

  const updateSourceView = (block: HTMLElement, source: string) => {
    const sourceView = block.querySelector<HTMLElement>('.md-editable-source')
    const code = sourceView?.querySelector('code')
    if (code) code.textContent = source
  }

  const updateModifiedState = (block: HTMLElement) => {
    const isModified = getCurrentSource(block) !== getOriginalSource(block)
    block.classList.toggle('is-modified', isModified)
    const restoreButton = block.querySelector<HTMLButtonElement>('[data-md-action="restore"]')
    if (restoreButton) restoreButton.hidden = !isModified
  }

  const renderBlockContent = (block: HTMLElement, source: string) => {
    const content = block.querySelector<HTMLElement>('.md-editable-content')
    if (!content) return

    if (getBlockKind(block) === 'math') {
      content.innerHTML = renderLatex(source, true)
      return
    }

    content.innerHTML = renderHighlightedCode(source, block.dataset.mdLang || '')
  }

  const setCurrentSource = (block: HTMLElement, source: string) => {
    block.dataset.mdCurrent = encodeSource(source)
    renderBlockContent(block, source)
    updateSourceView(block, source)
    updateModifiedState(block)
  }

  const ensureSourceView = (block: HTMLElement): HTMLElement => {
    const existing = block.querySelector<HTMLElement>('.md-editable-source')
    if (existing) return existing

    const sourceView = document.createElement('pre')
    sourceView.className = 'md-editable-source'
    sourceView.hidden = true
    const code = document.createElement('code')
    sourceView.append(code)

    const toolbar = block.querySelector('.md-editable-toolbar')
    if (toolbar) toolbar.after(sourceView)
    else block.prepend(sourceView)

    return sourceView
  }

  const resizeEditor = (editor: HTMLTextAreaElement) => {
    editor.style.height = 'auto'
    editor.style.height = `${Math.min(Math.max(editor.scrollHeight, 120), 520)}px`
  }

  const ensureEditor = (block: HTMLElement): HTMLTextAreaElement => {
    const existing = block.querySelector<HTMLTextAreaElement>('.md-editable-editor')
    if (existing) return existing

    const editor = document.createElement('textarea')
    editor.className = 'md-editable-editor'
    editor.spellcheck = false
    editor.hidden = true
    editor.rows = Math.max(4, getCurrentSource(block).split('\n').length)

    const sourceView = block.querySelector('.md-editable-source')
    const toolbar = block.querySelector('.md-editable-toolbar')
    if (sourceView) sourceView.after(editor)
    else if (toolbar) toolbar.after(editor)
    else block.prepend(editor)

    return editor
  }

  const setSourceVisible = (block: HTMLElement, visible: boolean) => {
    const sourceView = ensureSourceView(block)
    sourceView.hidden = !visible
    block.classList.toggle('is-source-visible', visible)
    updateSourceView(block, getCurrentSource(block))

    const sourceButton = block.querySelector<HTMLButtonElement>('[data-md-action="source"]')
    if (sourceButton) {
      sourceButton.textContent = visible ? '隐藏源码' : '显示源码'
      sourceButton.setAttribute('aria-expanded', visible ? 'true' : 'false')
    }
  }

  const setEditing = (block: HTMLElement, editing: boolean) => {
    const editor = ensureEditor(block)
    const editButton = block.querySelector<HTMLButtonElement>('[data-md-action="edit"]')

    block.classList.toggle('is-editing', editing)
    editor.hidden = !editing

    if (editButton) {
      editButton.textContent = editing ? '完成' : '修改'
      editButton.setAttribute('aria-expanded', editing ? 'true' : 'false')
    }

    if (!editing) return

    setSourceVisible(block, false)
    editor.value = getCurrentSource(block)
    resizeEditor(editor)
    editor.focus()
    editor.setSelectionRange(editor.value.length, editor.value.length)
  }

  const restoreBlock = (block: HTMLElement) => {
    const originalSource = getOriginalSource(block)
    const editor = block.querySelector<HTMLTextAreaElement>('.md-editable-editor')
    if (editor) {
      editor.value = originalSource
      resizeEditor(editor)
    }
    setCurrentSource(block, originalSource)
    setSourceVisible(block, false)
    setEditing(block, false)
  }

  const showCopyToast = (message: string, failed = false) => {
    let toast = document.querySelector<HTMLElement>('.md-copy-toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.className = 'md-copy-toast'
      toast.setAttribute('role', 'status')
      toast.setAttribute('aria-live', 'polite')
      document.body.append(toast)
    }

    toast.textContent = message
    toast.classList.toggle('md-copy-toast--failed', failed)
    toast.classList.toggle('md-copy-toast--success', !failed)
    toast.classList.add('is-visible')

    if (toastTimer) {
      window.clearTimeout(toastTimer)
      activeTimers.delete(toastTimer)
    }

    toastTimer = window.setTimeout(() => {
      toast?.classList.remove('is-visible')
      if (toastTimer) activeTimers.delete(toastTimer)
      toastTimer = null
    }, 1600)
    activeTimers.add(toastTimer)
  }

  const writeClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return
      } catch {
        // Fall through to the selection-based fallback when browser permissions deny Clipboard API.
      }
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.append(textarea)
    textarea.focus()
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    if (!copied) throw new Error('Clipboard copy failed')
  }

  const runStatusLabel = (runner: string, status: RunStatus | RunProgressStatus | 'preparing' | 'authenticating'): string => {
    const renderable = isRenderableRunner(runner)
    switch (status) {
      case 'authenticating':
        return 'GitHub 登录中'
      case 'preparing':
        return renderable ? '准备渲染' : '准备运行'
      case 'queued':
        return renderable ? '已提交渲染' : '已提交运行'
      case 'validating':
        return '校验中'
      case 'compiling':
        return '编译中'
      case 'running':
        return runnerBusyLabel(runner)
      case 'success':
        return renderable ? '渲染成功' : '运行成功'
      case 'compile_error':
        return renderable ? '渲染错误' : '编译错误'
      case 'runtime_error':
        return renderable ? '渲染失败' : '运行错误'
      case 'timeout':
        return '超时'
      case 'unsupported':
        return '不支持'
      default:
        return ''
    }
  }

  const ensureRunStream = (panel: HTMLElement, streamName: 'stdout' | 'stderr'): HTMLElement => {
    const existing = panel.querySelector<HTMLElement>(`[data-md-run-stream="${streamName}"]`)
    if (existing) return existing

    const stream = document.createElement('div')
    stream.className = 'md-run-output__stream'
    stream.dataset.mdRunStream = streamName

    const label = document.createElement('div')
    label.className = 'md-run-output__stream-label'
    label.textContent = streamName

    const pre = document.createElement('pre')
    pre.className = 'md-run-output__pre'

    stream.append(label, pre)
    panel.append(stream)
    return stream
  }

  const ensureRunOutput = (block: HTMLElement): HTMLElement => {
    const existing = block.querySelector<HTMLElement>('.md-run-output')
    if (existing) return existing

    const panel = document.createElement('div')
    panel.className = 'md-run-output'
    panel.setAttribute('role', 'status')
    panel.setAttribute('aria-live', 'polite')

    const header = document.createElement('div')
    header.className = 'md-run-output__header'

    const status = document.createElement('span')
    status.className = 'md-run-output__status'

    const duration = document.createElement('span')
    duration.className = 'md-run-output__duration'

    const message = document.createElement('div')
    message.className = 'md-run-output__message'
    message.hidden = true

    const empty = document.createElement('div')
    empty.className = 'md-run-output__empty'
    empty.textContent = '无输出'
    empty.hidden = true

    header.append(status, duration)
    panel.append(header, message, empty)
    ensureRunStream(panel, 'stdout')
    ensureRunStream(panel, 'stderr')

    const renderContainer = document.createElement('div')
    renderContainer.className = 'md-run-output__render'
    renderContainer.hidden = true
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', '')
    iframe.setAttribute('title', '渲染输出预览')
    renderContainer.append(iframe)
    panel.append(renderContainer)

    block.append(panel)

    return panel
  }

  const setRunOutputPending = (block: HTMLElement, state: RunProgressStatus | 'preparing' | 'authenticating') => {
    const panel = ensureRunOutput(block)
    const runner = block.dataset.mdRunner || ''
    panel.dataset.status = state
    panel.classList.remove('is-stale')

    const status = panel.querySelector<HTMLElement>('.md-run-output__status')
    const duration = panel.querySelector<HTMLElement>('.md-run-output__duration')
    const message = panel.querySelector<HTMLElement>('.md-run-output__message')
    const empty = panel.querySelector<HTMLElement>('.md-run-output__empty')
    const stdout = ensureRunStream(panel, 'stdout')
    const stderr = ensureRunStream(panel, 'stderr')

    if (status) status.textContent = runStatusLabel(runner, state)
    if (duration) duration.textContent = ''
    if (message) {
      message.textContent = ''
      message.hidden = true
    }
    if (empty) empty.hidden = true
    stdout.hidden = true
    stderr.hidden = true

    const renderContainer = panel.querySelector<HTMLElement>('.md-run-output__render')
    if (renderContainer) renderContainer.hidden = true
  }

  const ensureGiscusLoginForRun = async (block: HTMLElement) => {
    setRunOutputPending(block, 'authenticating')
    await ensureGiscusLogin()
  }

  const scrollRunOutputIntoView = (block: HTMLElement) => {
    const panel = ensureRunOutput(block)
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior, block: 'center', inline: 'nearest' })
    })
  }

  const setRunOutputResult = (block: HTMLElement, result: RunResult, files: Array<{ name: string; content: string }> = []) => {
    const panel = ensureRunOutput(block)
    panel.dataset.status = result.status

    const status = panel.querySelector<HTMLElement>('.md-run-output__status')
    const duration = panel.querySelector<HTMLElement>('.md-run-output__duration')
    const message = panel.querySelector<HTMLElement>('.md-run-output__message')
    const empty = panel.querySelector<HTMLElement>('.md-run-output__empty')
    const stdout = ensureRunStream(panel, 'stdout')
    const stderr = ensureRunStream(panel, 'stderr')
    const stdoutPre = stdout.querySelector<HTMLElement>('pre')
    const stderrPre = stderr.querySelector<HTMLElement>('pre')
    const hasStdout = Boolean(result.stdout)
    const hasStderr = Boolean(result.stderr)

    const runner = block.dataset.mdRunner || ''
    const isRenderable = RENDERABLE_RUNNERS.has(runner)
    const renderContainer = panel.querySelector<HTMLElement>('.md-run-output__render')

    if (status) status.textContent = runStatusLabel(runner, result.status)
    if (duration) duration.textContent = `${Math.max(0, Math.round(result.durationMs))} ms`
    if (message) {
      message.textContent = result.message
      message.hidden = !result.message
    }

    if (isRenderable && result.status === 'success' && hasStdout && renderContainer) {
      const iframe = renderContainer.querySelector('iframe')
      if (iframe) iframe.srcdoc = composeRenderableSrcdoc(runner, result.stdout, files)
      renderContainer.hidden = false
      stdout.hidden = true
      if (stderrPre) stderrPre.textContent = result.stderr
      stderr.hidden = !hasStderr
    } else {
      if (renderContainer) renderContainer.hidden = true
      if (stdoutPre) stdoutPre.textContent = result.stdout
      if (stderrPre) stderrPre.textContent = result.stderr
      stdout.hidden = !hasStdout
      stderr.hidden = !hasStderr
    }
    if (empty) empty.hidden = hasStdout || hasStderr || Boolean(result.message)
  }

  const setRunButtonLoading = (button: HTMLElement, running: boolean, runner: string) => {
    button.classList.toggle('is-running', running)
    button.setAttribute('aria-busy', running ? 'true' : 'false')
    button.textContent = running ? runnerBusyLabel(runner) : runnerActionLabel(runner)
    if (button instanceof HTMLButtonElement) button.disabled = running
  }

  const runBlockSource = async (button: HTMLElement, block: HTMLElement) => {
    if (block.classList.contains('is-running')) return

    const runner = block.dataset.mdRunner || ''
    block.classList.add('is-running')
    setRunButtonLoading(button, true, runner)
    setRunOutputPending(block, 'preparing')

    try {
      await ensureGiscusLoginForRun(block)
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
      const files = collectAdjacentRunFiles(block)
      const result = await runCode({
        language: runner,
        source: getCurrentSource(block),
        files,
        onProgress: ({ status }) => setRunOutputPending(block, status),
      })
      setRunOutputResult(block, result, files)
      scrollRunOutputIntoView(block)
    } catch (error) {
      setRunOutputResult(block, {
        status: 'runtime_error',
        stdout: '',
        stderr: '',
        durationMs: 0,
        message: error instanceof Error ? error.message : String(error),
      })
      scrollRunOutputIntoView(block)
    } finally {
      block.classList.remove('is-running')
      setRunButtonLoading(button, false, runner)
    }
  }

  const runnableBlocks = (): HTMLElement[] => (
    Array.from(root.querySelectorAll<HTMLElement>('.md-editable-block[data-md-runner]'))
      .filter((block) => !block.dataset.mdFileName)
  )

  const setRunAllStatus = (text: string) => {
    const status = root.querySelector<HTMLElement>('[data-md-run-all-status]')
    if (status) status.textContent = text
  }

  const setRunAllButtonLoading = (button: HTMLElement, running: boolean) => {
    button.classList.toggle('is-running', running)
    button.setAttribute('aria-busy', running ? 'true' : 'false')
    button.textContent = running ? '运行/渲染中' : '全部运行/渲染'
    if (button instanceof HTMLButtonElement) button.disabled = running
  }

  const runOneBlockFromQueue = async (block: HTMLElement) => {
    if (block.classList.contains('is-running')) return
    const runner = block.dataset.mdRunner || ''
    const button = block.querySelector<HTMLElement>('[data-md-action="run"]')

    block.classList.add('is-running')
    if (button) setRunButtonLoading(button, true, runner)
    setRunOutputPending(block, 'preparing')

    try {
      const files = collectAdjacentRunFiles(block)
      const result = await runCode({
        language: runner,
        source: getCurrentSource(block),
        files,
        onProgress: ({ status }) => setRunOutputPending(block, status),
      })
      setRunOutputResult(block, result, files)
    } catch (error) {
      setRunOutputResult(block, {
        status: 'runtime_error',
        stdout: '',
        stderr: '',
        durationMs: 0,
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      block.classList.remove('is-running')
      if (button) setRunButtonLoading(button, false, runner)
    }
  }

  const runAllBlocks = async (button: HTMLElement) => {
    if (button.classList.contains('is-running')) return

    const blocks = runnableBlocks()
    if (!blocks.length) {
      setRunAllStatus('没有可运行/渲染的代码块')
      return
    }

    let completed = 0
    let nextIndex = 0
    setRunAllButtonLoading(button, true)
    setRunAllStatus(`已提交 ${blocks.length} 个`)
    blocks.forEach((block) => setRunOutputPending(block, 'queued'))

    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
      if (blocks[0]) await ensureGiscusLoginForRun(blocks[0])
      const workerCount = Math.min(RUN_ALL_CONCURRENCY, blocks.length)
      const workers = Array.from({ length: workerCount }, async () => {
        while (nextIndex < blocks.length) {
          const block = blocks[nextIndex]
          nextIndex += 1
          await runOneBlockFromQueue(block)
          completed += 1
          setRunAllStatus(`${completed}/${blocks.length} 完成`)
        }
      })
      await Promise.all(workers)
      setRunAllStatus(`${blocks.length}/${blocks.length} 完成`)
    } catch (error) {
      blocks.forEach((block) => {
        if (!block.classList.contains('is-running')) {
          setRunOutputResult(block, {
            status: 'runtime_error',
            stdout: '',
            stderr: '',
            durationMs: 0,
            message: error instanceof Error ? error.message : String(error),
          })
        }
      })
      setRunAllStatus('运行/渲染未完成')
    } finally {
      setRunAllButtonLoading(button, false)
    }
  }

  const copyBlockSource = async (button: HTMLElement) => {
    const block = button.closest<HTMLElement>('.md-editable-block')
    const fallbackCode = button.closest('.md-code-block')?.querySelector('code')
    const text = block ? getCurrentSource(block) : fallbackCode?.textContent || ''
    const originalLabel = button.textContent || '复制'

    try {
      await writeClipboard(text)
      button.classList.remove('is-failed')
      button.classList.add('is-copied')
      button.textContent = '已复制'
      scheduleReset(button, originalLabel, 'is-copied')
      showCopyToast('已复制')
    } catch {
      button.classList.remove('is-copied')
      button.classList.add('is-failed')
      button.textContent = '复制失败'
      scheduleReset(button, originalLabel, 'is-failed')
      showCopyToast('复制失败', true)
    }
  }

  const onClick = async (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const image = target.closest<HTMLImageElement>('img')
    if (image?.src) {
      event.preventDefault()
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'))
        .map((item) => ({ src: imagePreviewSrc(item), alt: item.alt }))
        .filter((item) => item.src && item.src !== SOURCE_IMAGE_PLACEHOLDER)
      openImagePreviewGallery(images, images.findIndex((item) => item.src === imagePreviewSrc(image)))
      return
    }

    const globalActionButton = target.closest<HTMLElement>('[data-md-global-action]')
    if (globalActionButton) {
      const action = globalActionButton.dataset.mdGlobalAction || ''
      if (action === 'run-all') {
        await runAllBlocks(globalActionButton)
      }
      return
    }

    const actionButton = target.closest<HTMLElement>('[data-md-action], [data-copy-code]')
    if (!actionButton) return

    const action = actionButton.dataset.mdAction || (actionButton.hasAttribute('data-copy-code') ? 'copy' : '')
    const block = actionButton.closest<HTMLElement>('.md-editable-block')

    if (action === 'copy') {
      await copyBlockSource(actionButton)
      return
    }

    if (!block) return

    if (action === 'run') {
      await runBlockSource(actionButton, block)
      return
    }

    if (action === 'edit') {
      setEditing(block, !block.classList.contains('is-editing'))
      return
    }

    if (action === 'source') {
      setEditing(block, false)
      setSourceVisible(block, !block.classList.contains('is-source-visible'))
      return
    }

    if (action === 'restore') {
      restoreBlock(block)
    }
  }

  const onInput = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLTextAreaElement)) return
    if (!target.classList.contains('md-editable-editor')) return

    const block = target.closest<HTMLElement>('.md-editable-block')
    if (!block) return

    setCurrentSource(block, target.value)
    resizeEditor(target)
  }

  root.addEventListener('click', onClick)
  root.addEventListener('input', onInput)
  return () => {
    root.removeEventListener('click', onClick)
    root.removeEventListener('input', onInput)
    cleanupHandlers.forEach((cleanupHandler) => cleanupHandler())
    activeTimers.forEach((timer) => window.clearTimeout(timer))
    activeTimers.clear()
  }
}

type MathSpan = {
  start: number
  end: number
}

function findClosingDollar(value: string, start: number): number {
  for (let index = start; index < value.length; index += 1) {
    if (value[index] !== '$') continue
    if (value[index - 1] === '\\') continue
    if (value[index + 1] === '$') continue
    return index
  }
  return -1
}

function readMathSpan(value: string, start: number): MathSpan | null {
  if (value.startsWith('$$', start)) {
    const close = value.indexOf('$$', start + 2)
    return close === -1 ? null : { start, end: close + 2 }
  }

  if (value.startsWith('\\[', start)) {
    const close = value.indexOf('\\]', start + 2)
    return close === -1 ? null : { start, end: close + 2 }
  }

  if (value.startsWith('\\(', start)) {
    const close = value.indexOf('\\)', start + 2)
    return close === -1 ? null : { start, end: close + 2 }
  }

  if (value[start] === '$' && value[start - 1] !== '\\' && value[start + 1] !== '$') {
    const close = findClosingDollar(value, start + 1)
    return close === -1 ? null : { start, end: close + 1 }
  }

  return null
}

function adjustExcerptCutForMath(value: string, cut: number, maxExtension: number): number {
  let index = 0

  while (index < cut) {
    const span = readMathSpan(value, index)
    if (!span) {
      index += 1
      continue
    }

    if (span.end > cut) {
      return span.end <= maxExtension ? span.end : span.start
    }

    index = span.end
  }

  return cut
}

function trimExcerptEnd(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[\s,.;:，。；：、|-]+$/g, '')
    .trim()
}

export function excerptFromMarkdown(source: string, maxLength = 120): string {
  if (!source) return ''
  const plain = normalizeMarkdownPreviewSource(source)
  if (plain.length <= maxLength) return plain

  const targetCut = Math.max(1, maxLength - 3)
  const maxMathExtension = Math.min(plain.length, maxLength + 240)
  const adjustedCut = adjustExcerptCutForMath(plain, targetCut, maxMathExtension)
  const excerpt = trimExcerptEnd(plain.slice(0, adjustedCut))

  if (!excerpt) return `${trimExcerptEnd(plain.slice(0, targetCut)).replace(/[$]+$/g, '')}...`
  return `${excerpt}...`
}
