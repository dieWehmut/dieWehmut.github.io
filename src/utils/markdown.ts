import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import clojure from 'highlight.js/lib/languages/clojure'
import coq from 'highlight.js/lib/languages/coq'
import cpp from 'highlight.js/lib/languages/cpp'
import css from 'highlight.js/lib/languages/css'
import crystal from 'highlight.js/lib/languages/crystal'
import csharp from 'highlight.js/lib/languages/csharp'
import dart from 'highlight.js/lib/languages/dart'
import delphi from 'highlight.js/lib/languages/delphi'
import elixir from 'highlight.js/lib/languages/elixir'
import erlang from 'highlight.js/lib/languages/erlang'
import fortran from 'highlight.js/lib/languages/fortran'
import fsharp from 'highlight.js/lib/languages/fsharp'
import go from 'highlight.js/lib/languages/go'
import groovy from 'highlight.js/lib/languages/groovy'
import haskell from 'highlight.js/lib/languages/haskell'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import julia from 'highlight.js/lib/languages/julia'
import kotlin from 'highlight.js/lib/languages/kotlin'
import latex from 'highlight.js/lib/languages/latex'
import lua from 'highlight.js/lib/languages/lua'
import markdown from 'highlight.js/lib/languages/markdown'
import matlab from 'highlight.js/lib/languages/matlab'
import nim from 'highlight.js/lib/languages/nim'
import ocaml from 'highlight.js/lib/languages/ocaml'
import perl from 'highlight.js/lib/languages/perl'
import php from 'highlight.js/lib/languages/php'
import powershell from 'highlight.js/lib/languages/powershell'
import prolog from 'highlight.js/lib/languages/prolog'
import pgsql from 'highlight.js/lib/languages/pgsql'
import python from 'highlight.js/lib/languages/python'
import qml from 'highlight.js/lib/languages/qml'
import r from 'highlight.js/lib/languages/r'
import rust from 'highlight.js/lib/languages/rust'
import ruby from 'highlight.js/lib/languages/ruby'
import scala from 'highlight.js/lib/languages/scala'
import scheme from 'highlight.js/lib/languages/scheme'
import sql from 'highlight.js/lib/languages/sql'
import swift from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import x86asm from 'highlight.js/lib/languages/x86asm'
import yaml from 'highlight.js/lib/languages/yaml'
import katex from 'katex'
import markedKatex from 'marked-katex-extension'
import { openImagePreviewGallery } from './imagePreview'
import { getPublicAssetUrlCandidates, resolvePublicAssetUrl, retryPublicAssetImage } from './publicAssets'
import { runCode, type RunProgressStatus, type RunResult, type RunStatus } from './codeRunner'
import { ensureGiscusLogin, getGiscusAuthState } from './giscusAuth'
import type { MarkdownMonacoEditor } from './monacoMarkdownEditor'

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
  path: new Set(['d', 'fill']),
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
const BLOCKED_PAGE_KEYS = new Set(['d', 'g', 'h', 'j', 'k', 'l', 'r', 'u'])
let markdownShortcutGuardRefCount = 0
let markdownShortcutGuardHandler: ((event: KeyboardEvent) => void) | null = null

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('c', c)
hljs.registerLanguage('clojure', clojure)
hljs.registerLanguage('clj', clojure)
hljs.registerLanguage('coq', coq)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('cxx', cpp)
hljs.registerLanguage('css', css)
hljs.registerLanguage('crystal', crystal)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('cs', csharp)
hljs.registerLanguage('dart', dart)
hljs.registerLanguage('delphi', delphi)
hljs.registerLanguage('pascal', delphi)
hljs.registerLanguage('elixir', elixir)
hljs.registerLanguage('erlang', erlang)
hljs.registerLanguage('erl', erlang)
hljs.registerLanguage('fortran', fortran)
hljs.registerLanguage('fsharp', fsharp)
hljs.registerLanguage('fs', fsharp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('golang', go)
hljs.registerLanguage('groovy', groovy)
hljs.registerLanguage('haskell', haskell)
hljs.registerLanguage('hs', haskell)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('julia', julia)
hljs.registerLanguage('jl', julia)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('kt', kotlin)
hljs.registerLanguage('latex', latex)
hljs.registerLanguage('tex', latex)
hljs.registerLanguage('lua', lua)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('matlab', matlab)
hljs.registerLanguage('nim', nim)
hljs.registerLanguage('octave', matlab)
hljs.registerLanguage('ocaml', ocaml)
hljs.registerLanguage('perl', perl)
hljs.registerLanguage('php', php)
hljs.registerLanguage('powershell', powershell)
hljs.registerLanguage('ps1', powershell)
hljs.registerLanguage('prolog', prolog)
hljs.registerLanguage('pgsql', pgsql)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('qml', qml)
hljs.registerLanguage('r', r)
hljs.registerLanguage('rscript', r)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('scala', scala)
hljs.registerLanguage('scheme', scheme)
hljs.registerLanguage('racket', scheme)
hljs.registerLanguage('rkt', scheme)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('sqlite', sql)
hljs.registerLanguage('sqlite3', sql)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('x86asm', x86asm)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('hcl', ini)
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

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  const formControl = target.closest('input, textarea, select')
  if (formControl instanceof HTMLInputElement || formControl instanceof HTMLTextAreaElement) {
    return !formControl.disabled && !formControl.readOnly
  }
  if (formControl instanceof HTMLSelectElement) {
    return !formControl.disabled
  }

  if (target.closest('[contenteditable=""], [contenteditable="true"]')) return true

  const monacoBlock = target.closest<HTMLElement>('.md-editable-block')
  return Boolean(monacoBlock?.classList.contains('is-editing') && target.closest('.monaco-editor'))
}

function shouldBlockMarkdownShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return false
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  if (event.isComposing) return false
  if (!BLOCKED_PAGE_KEYS.has(event.key.toLowerCase())) return false
  return !isEditableKeyboardTarget(event.target)
}

function installMarkdownShortcutGuard(doc: Document) {
  markdownShortcutGuardRefCount += 1
  if (markdownShortcutGuardHandler || markdownShortcutGuardRefCount !== 1) return

  markdownShortcutGuardHandler = (event: KeyboardEvent) => {
    if (!shouldBlockMarkdownShortcut(event)) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  doc.defaultView?.addEventListener('keydown', markdownShortcutGuardHandler, true)
  doc.addEventListener('keydown', markdownShortcutGuardHandler, true)
}

function uninstallMarkdownShortcutGuard(doc: Document) {
  markdownShortcutGuardRefCount = Math.max(0, markdownShortcutGuardRefCount - 1)
  if (markdownShortcutGuardRefCount !== 0 || !markdownShortcutGuardHandler) return

  doc.defaultView?.removeEventListener('keydown', markdownShortcutGuardHandler, true)
  doc.removeEventListener('keydown', markdownShortcutGuardHandler, true)
  markdownShortcutGuardHandler = null
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

type SetSourceOptions = {
  renderContent?: boolean
}

export type RenderMarkdownOptions = {
  codeRunner?: boolean
  docId?: string
}

type CodeFenceInfo = {
  lang: string
  fileName: string
  runnable: boolean | null
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

function resolveHighlightLanguage(lang: string | undefined): string {
  const requestedLang = (lang || '').trim().split(/\s+/)[0].toLowerCase()
  switch (requestedLang) {
    case 'asm':
    case 'assembly':
    case 'gas':
      return 'x86asm'
    case 'cangjie':
      return 'cpp'
    case 'fsx':
      return 'fsharp'
    case 'gd':
    case 'gdscript':
      return 'python'
    case 'gleam':
      return 'rust'
    case 'graphviz':
    case 'dot':
      return 'pgsql'
    case 'lean':
    case 'lean4':
      return 'coq'
    case 'mdx':
      return 'markdown'
    case 'mojo':
      return 'python'
    case 'next':
    case 'nextjs':
    case 'tsx':
      return 'typescript'
    case 'nextflow':
    case 'nf':
      return 'groovy'
    case 'qml':
      return 'qml'
    case 'sol':
    case 'solidity':
      return 'javascript'
    case 'tailwind':
    case 'tailwindcss':
      return 'css'
    case 'typ':
    case 'typst':
      return 'latex'
    case 'v':
    case 'vlang':
      return 'go'
    case 'wdl':
      return 'hcl'
    default:
      return requestedLang
  }
}

function resolveCodeLanguage(lang: string | undefined): CodeLanguageInfo {
  const requestedLang = (lang || '').trim().split(/\s+/)[0]
  const highlightLang = resolveHighlightLanguage(requestedLang)
  const validLang = highlightLang && hljs.getLanguage(highlightLang) ? highlightLang : ''
  return {
    langClass: validLang ? ` language-${validLang}` : '',
    langLabel: requestedLang || validLang || '',
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
      return 'html'
    case 'yaml':
    case 'yml':
      return 'yaml'
    case 'css':
    case 'scss':
    case 'vue':
    case 'tsx':
    case 'mdx':
    case 'sql':
    case 'rs':
    case 'py':
    case 'rb':
    case 'php':
    case 'lua':
    case 'dart':
    case 'kt':
    case 'swift':
      return extension === 'rs' ? 'rust'
        : extension === 'py' ? 'python'
          : extension === 'rb' ? 'ruby'
            : extension === 'kt' ? 'kotlin'
              : extension
    default:
      return extension || ''
  }
}

function isTruthyFenceOption(value: string): boolean {
  const normalized = stripFenceMetaQuotes(value).trim().toLowerCase()
  return normalized === '' || normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

function isFalsyFenceOption(value: string): boolean {
  const normalized = stripFenceMetaQuotes(value).trim().toLowerCase()
  return normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off'
}

function parseFenceRunnable(tokens: string[]): boolean | null {
  for (const token of tokens) {
    const normalized = token.trim().toLowerCase()
    if (normalized === 'run' || normalized === 'render' || normalized === 'runnable') return true
    if (normalized === 'norun' || normalized === 'no-run' || normalized === 'no-render') return false

    const match = token.match(/^(?:run|render|runnable|runner|executable)=(.+)$/i)
    if (!match) continue
    if (isFalsyFenceOption(match[1])) return false
    if (isTruthyFenceOption(match[1])) return true
  }

  return null
}

function parseCodeFenceInfo(info: string | undefined): CodeFenceInfo {
  const tokens = (info || '').trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return { lang: '', fileName: '', runnable: null }
  const runnable = parseFenceRunnable(tokens)

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
      runnable,
    }
  }

  const fileToken = tokens
    .slice(1)
    .map((token) => token.match(/^(?:file|filename|path)=(.+)$/i)?.[1] || '')
    .find(Boolean)

  return {
    lang: firstToken,
    fileName: fileToken ? stripFenceMetaQuotes(fileToken) : '',
    runnable,
  }
}

function splitHighlightedByLine(highlighted: string): string[] {
  const lines: string[] = []
  const stack: string[] = []
  let current = ''
  let index = 0
  while (index < highlighted.length) {
    const char = highlighted[index]
    if (char === '<') {
      const closeIdx = highlighted.indexOf('>', index)
      if (closeIdx === -1) {
        current += highlighted.slice(index)
        break
      }
      const tag = highlighted.slice(index, closeIdx + 1)
      if (tag.startsWith('</')) {
        if (stack.length) stack.pop()
      } else if (!tag.endsWith('/>') && !/^<(?:br|img|hr|input)\b/i.test(tag)) {
        stack.push(tag)
      }
      current += tag
      index = closeIdx + 1
      continue
    }
    if (char === '\n') {
      // close all open spans before newline, reopen on next line
      for (let i = stack.length - 1; i >= 0; i -= 1) current += '</span>'
      lines.push(current)
      current = stack.join('')
      index += 1
      continue
    }
    current += char
    index += 1
  }
  for (let i = stack.length - 1; i >= 0; i -= 1) current += '</span>'
  lines.push(current)
  return lines
}

function computeIndent(line: string): number {
  let count = 0
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === ' ') count += 1
    else if (ch === '\t') count += 4
    else break
  }
  return /^\s*$/.test(line) ? -1 : count
}

function computeFoldRanges(rawLines: string[]): Map<number, number> {
  // map: startLineIndex -> endLineIndex (inclusive), 0-based
  const ranges = new Map<number, number>()
  const indents = rawLines.map(computeIndent)
  for (let i = 0; i < rawLines.length; i += 1) {
    const own = indents[i]
    if (own < 0) continue
    let nextNonBlank = -1
    for (let j = i + 1; j < rawLines.length; j += 1) {
      if (indents[j] >= 0) { nextNonBlank = j; break }
    }
    if (nextNonBlank === -1) continue
    if (indents[nextNonBlank] <= own) continue
    let end = nextNonBlank
    for (let j = nextNonBlank + 1; j < rawLines.length; j += 1) {
      if (indents[j] >= 0 && indents[j] <= own) break
      end = j
    }
    ranges.set(i, end)
  }
  return ranges
}

const FOLD_CHEVRON_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3.22 5.47a.75.75 0 0 1 1.06 0L8 9.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.53a.75.75 0 0 1 0-1.06Z"/></svg>'

function renderHighlightedCode(source: string, lang: string | undefined): string {
  const { langClass, validLang } = resolveCodeLanguage(lang)
  const highlighted = validLang
    ? hljs.highlight(source, { language: validLang, ignoreIllegals: true }).value
    : hljs.highlightAuto(source).value
  const normalizedSource = source.replace(/\r\n?/g, '\n')
  const rawLines = normalizedSource.split('\n')
  const highlightedLines = splitHighlightedByLine(highlighted)
  while (highlightedLines.length < rawLines.length) highlightedLines.push('')
  const folds = computeFoldRanges(rawLines)

  const rowsHtml = rawLines.map((_rawLine, idx) => {
    const lineNo = idx + 1
    const foldEnd = folds.get(idx)
    const chevron = foldEnd !== undefined
      ? `<button type="button" class="md-code-preview__fold" data-md-action="fold" data-md-fold-start="${lineNo}" data-md-fold-end="${foldEnd + 1}" aria-expanded="true" aria-label="折叠代码块">${FOLD_CHEVRON_SVG}</button>`
      : '<span class="md-code-preview__fold md-code-preview__fold--placeholder" aria-hidden="true"></span>'
    const codeHtml = highlightedLines[idx] || ''
    return [
      `<span class="md-code-preview__row" data-md-line="${lineNo}">`,
      `<span class="md-code-preview__lineno" aria-hidden="true">${lineNo}</span>`,
      chevron,
      `<span class="md-code-preview__line">${codeHtml || ' '}</span>`,
      '</span>',
    ].join('')
  }).join('')

  return [
    '<pre class="md-code-preview">',
    `<code class="hljs md-code-preview__code${langClass}">${rowsHtml}</code>`,
    '</pre>',
  ].join('')
}

function escapeStyleEndTag(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style')
}

const IFRAME_SCROLLBAR_CSS = `
*{scrollbar-width:thin;scrollbar-color:rgba(31,196,31,0.58) rgba(31,196,31,0.10);}
*::-webkit-scrollbar{width:12px;height:12px;}
*::-webkit-scrollbar-track{border-radius:999px;background:rgba(31,196,31,0.10);box-shadow:inset 0 0 0 1px rgba(31,196,31,0.08);}
*::-webkit-scrollbar-thumb{border:3px solid transparent;border-radius:999px;background:rgba(31,196,31,0.72);background-clip:padding-box;}
*::-webkit-scrollbar-thumb:hover{background:#1fc41f;background-clip:padding-box;}
*::-webkit-scrollbar-thumb:active{background:#0a8a0a;background-clip:padding-box;}
`

function injectStyleIntoHtml(html: string, css: string): string {
  const combined = `${IFRAME_SCROLLBAR_CSS}\n${css}`
  const style = `<style>${escapeStyleEndTag(combined)}</style>`
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${style}</head>`)
  if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`)
  return `<!doctype html><html><head>${style}</head><body>${html}</body></html>`
}

function defaultStylePreviewHtml(css: string): string {
  const combined = `${IFRAME_SCROLLBAR_CSS}\n${css}`
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    `<style>${escapeStyleEndTag(combined)}</style>`,
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
    '<button class="md-editable-action md-editable-action--collapse" type="button" data-md-action="collapse" aria-expanded="true" aria-label="折叠代码">收起</button>',
    '<button class="md-editable-action md-code-copy" type="button" data-copy-code data-md-action="copy">复制</button>',
    '</div>',
    '</div>',
  ].join('')
}

function renderEditableBlock(kind: EditableBlockKind, source: string, lang = '', fileName = '', runnable = false): string {
  const encodedSource = escapeHtml(encodeSource(source))
  const requestedLang = lang.trim().split(/\s+/)[0]
  const { langLabel, validLang } = resolveCodeLanguage(lang)
  const runner = kind === 'code' && runnable && !fileName ? resolveCodeRunner(requestedLang) : ''
  const editorLang = requestedLang || validLang || runner
  const content = kind === 'code'
    ? renderHighlightedCode(source, validLang)
    : renderLatex(source, true)
  const sourceView = kind === 'math'
    ? `<pre class="md-editable-source" hidden><code>${escapeHtml(source)}</code></pre>`
    : ''
  const runnerAttr = runner ? ` data-md-runner="${escapeHtml(runner)}"` : ''
  const fileNameAttr = fileName ? ` data-md-file-name="${escapeHtml(fileName)}"` : ''
  const fileClass = fileName ? ' md-file-block' : ''
  const label = fileName ? `file: ${fileName}` : (langLabel || runner || 'text')

  return [
    `<div class="md-editable-block md-${kind}-block${fileClass}" data-md-kind="${kind}" data-md-original="${encodedSource}" data-md-current="${encodedSource}" data-md-lang="${escapeHtml(editorLang)}"${runnerAttr}${fileNameAttr}>`,
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
      const { lang: requestedLang, fileName, runnable } = parseCodeFenceInfo(lang)
      if (requestedLang.toLowerCase() === 'mermaid') {
        return renderMermaidDiagram(text)
      }
      return renderEditableBlock('code', text, requestedLang, fileName, runnable ?? currentMarkdownRenderOptions.codeRunner)
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

let currentMarkdownRenderOptions: Required<RenderMarkdownOptions> = {
  codeRunner: false,
  docId: '',
}
let markdownMonacoEditorModulePromise: Promise<typeof import('./monacoMarkdownEditor')> | null = null
const markdownMonacoWarmups = new Map<string, Promise<void>>()

function loadMarkdownMonacoEditorModule() {
  markdownMonacoEditorModulePromise ||= import('./monacoMarkdownEditor')
  return markdownMonacoEditorModulePromise
}

function warmupMarkdownMonacoEditor(language = '') {
  const key = language.trim().toLowerCase() || 'plaintext'
  let warmup = markdownMonacoWarmups.get(key)
  if (!warmup) {
    warmup = loadMarkdownMonacoEditorModule()
      .then(({ preloadMarkdownMonacoEditor }) => preloadMarkdownMonacoEditor(language))
      .catch(() => undefined)
    markdownMonacoWarmups.set(key, warmup)
  }
  return warmup
}

function withMarkdownRenderOptions<T>(options: RenderMarkdownOptions, render: () => T): T {
  const previous = currentMarkdownRenderOptions
  currentMarkdownRenderOptions = {
    codeRunner: Boolean(options.codeRunner),
    docId: options.docId || '',
  }
  try {
    return render()
  } finally {
    currentMarkdownRenderOptions = previous
  }
}

export function renderMarkdown(source: string, options: RenderMarkdownOptions = {}): string {
  if (!source) return ''
  const cacheKey = `${options.codeRunner ? '1' : '0'}:${options.docId || ''}:${source}`
  const cached = renderedMarkdownCache.get(cacheKey)
  if (cached !== undefined) return cached

  const rendered = withMarkdownRenderOptions(options, () => (
    deferClosedSourcePageImages(sanitizeHtml(marked.parse(preprocessMarkdownMath(source)) as string))
  ))
  renderedMarkdownCache.set(cacheKey, rendered)

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
  const ownerDocument = root instanceof Document ? root : root.ownerDocument

  if (ownerDocument) {
    installMarkdownShortcutGuard(ownerDocument)
    cleanupHandlers.push(() => uninstallMarkdownShortcutGuard(ownerDocument))
  }

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

  const setCurrentSource = (block: HTMLElement, source: string, options: SetSourceOptions = {}) => {
    block.dataset.mdCurrent = encodeSource(source)
    if (options.renderContent !== false) renderBlockContent(block, source)
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

  const monacoEditors = new WeakMap<HTMLElement, MarkdownMonacoEditor>()
  const monacoLoaders = new WeakMap<HTMLElement, Promise<MarkdownMonacoEditor>>()
  const textareaEditors = new WeakMap<HTMLElement, HTMLTextAreaElement>()
  const editTokens = new WeakMap<HTMLElement, number>()
  const activeMonacoEditors = new Set<MarkdownMonacoEditor>()
  let editTokenSequence = 0

  const bumpEditToken = (block: HTMLElement): number => {
    editTokenSequence += 1
    editTokens.set(block, editTokenSequence)
    return editTokenSequence
  }

  const ensureEditorHost = (block: HTMLElement): HTMLElement => {
    const existing = block.querySelector<HTMLElement>('.md-editable-editor')
    if (existing) return existing

    const host = document.createElement('div')
    host.className = 'md-editable-editor'
    host.hidden = true
    host.setAttribute('role', 'region')
    host.setAttribute('aria-label', 'VS Code style editor')

    const sourceView = block.querySelector('.md-editable-source')
    const toolbar = block.querySelector('.md-editable-toolbar')
    if (sourceView) sourceView.after(host)
    else if (toolbar) toolbar.after(host)
    else block.prepend(host)

    return host
  }

  const ensureTextareaEditor = (block: HTMLElement): HTMLTextAreaElement => {
    const existing = textareaEditors.get(block)
    if (existing) return existing

    const host = ensureEditorHost(block)
    const textarea = document.createElement('textarea')
    textarea.className = 'md-editable-textarea'
    textarea.spellcheck = false
    textarea.setAttribute('autocapitalize', 'off')
    textarea.setAttribute('autocomplete', 'off')
    textarea.setAttribute('autocorrect', 'off')
    textarea.wrap = 'off'
    textarea.value = getCurrentSource(block)
    textarea.setAttribute('aria-label', 'Markdown source editor')
    textarea.style.height = `${Math.max(host.getBoundingClientRect().height, 72)}px`
    if (host.firstChild) host.insertBefore(textarea, host.firstChild)
    else host.append(textarea)

    const onInput = () => {
      setCurrentSource(block, textarea.value, { renderContent: false })
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 620)}px`
    }

    textarea.addEventListener('input', onInput)
    textareaEditors.set(block, textarea)
    return textarea
  }

  const removeTextareaEditor = (block: HTMLElement) => {
    const textarea = textareaEditors.get(block)
    if (!textarea) return
    textarea.remove()
    textareaEditors.delete(block)
  }

  const ensureEditor = async (block: HTMLElement, readOnly = false): Promise<MarkdownMonacoEditor> => {
    const existing = monacoEditors.get(block)
    if (existing) {
      existing.setReadOnly(readOnly)
      return existing
    }

    const loading = monacoLoaders.get(block)
    if (loading) {
      const editor = await loading
      editor.setReadOnly(readOnly)
      return editor
    }

    const host = ensureEditorHost(block)
    if (!textareaEditors.has(block)) host.classList.add('is-loading')
    host.setAttribute('aria-busy', 'true')

    const loader = loadMarkdownMonacoEditorModule()
      .then(({ createMarkdownMonacoEditor }) => createMarkdownMonacoEditor({
        container: host,
        language: block.dataset.mdLang || block.dataset.mdRunner || '',
        value: getCurrentSource(block),
        onChange: (value) => setCurrentSource(block, value, { renderContent: false }),
        readOnly,
      }))
      .then((editor) => {
        monacoEditors.set(block, editor)
        activeMonacoEditors.add(editor)
        host.classList.remove('is-loading')
        host.setAttribute('aria-busy', 'false')
        if (block.classList.contains('is-editing')) removeTextareaEditor(block)
        else editor.setReadOnly(true)
        return editor
      }).catch((error) => {
        host.classList.remove('is-loading')
        host.setAttribute('aria-busy', 'false')
        monacoLoaders.delete(block)
        throw error
      })

    monacoLoaders.set(block, loader)
    return loader
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

  const setEditing = async (block: HTMLElement, editing: boolean) => {
    const editorHost = ensureEditorHost(block)
    const content = block.querySelector<HTMLElement>('.md-editable-content')
    const editButton = block.querySelector<HTMLButtonElement>('[data-md-action="edit"]')
    const language = block.dataset.mdLang || block.dataset.mdRunner || ''
    const editToken = bumpEditToken(block)

    block.classList.toggle('is-editing', editing)
    editorHost.hidden = !editing
    editorHost.classList.toggle('is-readonly', !editing)
    if (content) content.hidden = editing

    if (editButton) {
      editButton.textContent = editing ? '完成' : '修改'
      editButton.setAttribute('aria-expanded', editing ? 'true' : 'false')
      editButton.setAttribute('aria-busy', editing && !monacoEditors.has(block) ? 'true' : 'false')
    }

    if (!editing) {
      const editor = monacoEditors.get(block)
      const textarea = textareaEditors.get(block)
      if (textarea) setCurrentSource(block, textarea.value, { renderContent: false })
      editor?.setValue(getCurrentSource(block))
      editor?.setReadOnly(true)
      renderBlockContent(block, getCurrentSource(block))
      removeTextareaEditor(block)
      return
    }

    setSourceVisible(block, false)
    const textarea = ensureTextareaEditor(block)
    textarea.value = getCurrentSource(block)
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 620)}px`
    textarea.focus()

    void warmupMarkdownMonacoEditor(language)
    try {
      const editor = await ensureEditor(block, false)
      if (editTokens.get(block) !== editToken || !block.classList.contains('is-editing')) {
        editor.setReadOnly(true)
        return
      }
      editor.setValue(getCurrentSource(block))
      removeTextareaEditor(block)
      editor.layout()
      editor.container.classList.remove('is-readonly')
      editor.focusEnd()
    } finally {
      if (editButton) editButton.setAttribute('aria-busy', 'false')
    }
  }

  const restoreBlock = (block: HTMLElement) => {
    const originalSource = getOriginalSource(block)
    const editor = monacoEditors.get(block)
    const textarea = textareaEditors.get(block)
    if (textarea) textarea.value = originalSource
    editor?.setValue(originalSource)
    setCurrentSource(block, originalSource)
    setSourceVisible(block, false)
    void setEditing(block, false)
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
    if (getGiscusAuthState().authenticated) return
    setRunOutputPending(block, 'authenticating')
    await ensureGiscusLogin()
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
      setRunButtonLoading(button, false, runner)
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

  const warmupEditorFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return
    const editButton = target.closest<HTMLElement>('[data-md-action="edit"]')
    const block = editButton?.closest<HTMLElement>('.md-editable-block')
    if (!block) return
    void warmupMarkdownMonacoEditor(block.dataset.mdLang || block.dataset.mdRunner || '')
  }

  const onPointerOver = (event: Event) => warmupEditorFromTarget(event.target)
  const onFocusIn = (event: Event) => warmupEditorFromTarget(event.target)

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

    const actionButton = target.closest<HTMLElement>('[data-md-action], [data-copy-code]')
    if (!actionButton) return

    const action = actionButton.dataset.mdAction || (actionButton.hasAttribute('data-copy-code') ? 'copy' : '')
    const block = actionButton.closest<HTMLElement>('.md-editable-block')

    if (action === 'copy') {
      await copyBlockSource(actionButton)
      return
    }

    if (action === 'fold') {
      const foldButton = actionButton.closest<HTMLElement>('[data-md-action="fold"]') || actionButton
      const startStr = foldButton.dataset.mdFoldStart
      const endStr = foldButton.dataset.mdFoldEnd
      const pre = foldButton.closest<HTMLElement>('.md-code-preview')
      if (!pre || !startStr || !endStr) return
      const start = Number(startStr)
      const end = Number(endStr)
      const folded = foldButton.getAttribute('aria-expanded') === 'true'
      foldButton.setAttribute('aria-expanded', folded ? 'false' : 'true')
      foldButton.classList.toggle('is-folded', folded)
      const hiderId = `f${start}`
      for (let n = start + 1; n <= end; n += 1) {
        const row = pre.querySelector<HTMLElement>(`.md-code-preview__row[data-md-line="${n}"]`)
        if (!row) continue
        const current = (row.dataset.foldedBy || '').split(' ').filter(Boolean)
        const set = new Set(current)
        if (folded) set.add(hiderId)
        else set.delete(hiderId)
        row.dataset.foldedBy = [...set].join(' ')
        row.classList.toggle('is-hidden', set.size > 0)
      }
      return
    }

    if (!block) return

    if (action === 'run') {
      await runBlockSource(actionButton, block)
      return
    }

    if (action === 'edit') {
      await setEditing(block, !block.classList.contains('is-editing'))
      return
    }

    if (action === 'source') {
      await setEditing(block, false)
      setSourceVisible(block, !block.classList.contains('is-source-visible'))
      return
    }

    if (action === 'restore') {
      restoreBlock(block)
      return
    }

    if (action === 'collapse') {
      const collapsed = !block.classList.contains('is-collapsed')
      block.classList.toggle('is-collapsed', collapsed)
      actionButton.textContent = collapsed ? '展开' : '收起'
      actionButton.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
      actionButton.setAttribute('aria-label', collapsed ? '展开代码' : '折叠代码')
    }
  }

  root.addEventListener('pointerover', onPointerOver)
  root.addEventListener('focusin', onFocusIn)
  root.addEventListener('click', onClick)
  return () => {
    root.removeEventListener('pointerover', onPointerOver)
    root.removeEventListener('focusin', onFocusIn)
    root.removeEventListener('click', onClick)
    cleanupHandlers.forEach((cleanupHandler) => cleanupHandler())
    activeMonacoEditors.forEach((editor) => editor.dispose())
    activeMonacoEditors.clear()
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
