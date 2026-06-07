import { Marked } from 'marked'
import hljs from 'highlight.js'
import katex from 'katex'
import markedKatex from 'marked-katex-extension'
import { openImagePreviewGallery } from './imagePreview'
import { getPublicAssetUrlCandidates, resolvePublicAssetUrl, retryPublicAssetImage } from './publicAssets'
import { runCode, type RunResult, type RunStatus } from './codeRunner'

const ALLOWED_TAGS = new Set([
  'a', 'blockquote', 'br', 'button', 'code', 'del', 'details', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'input', 'ins', 'kbd',
  'li', 'mark', 'ol', 'p', 'pre', 's', 'section', 'small', 'span', 'strong',
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
  span: new Set(['style']),
  textarea: new Set(['rows', 'spellcheck']),
  td: new Set(['align', 'colspan', 'rowspan']),
  th: new Set(['align', 'colspan', 'rowspan']),
}
const MARKDOWN_CACHE_LIMIT = 24
const MARKDOWN_PREVIEW_CACHE_LIMIT = 80
const SOURCE_IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const renderedMarkdownCache = new Map<string, string>()
const renderedMarkdownPreviewCache = new Map<string, string>()

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stripUnsafeAttributes(rawAttrs: string, tagName: string): string {
  const attrPattern = /([:@a-zA-Z_][\w:.-]*)(?:\s*=\s*(".*?"|'.*?'|[^\s"'`=<>]+))?/g
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

    collected.push(`${lowerName}="${escapeHtml(safeValue)}"`)
  }

  return collected.length ? ` ${collected.join(' ')}` : ''
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

function encodeSource(value: string): string {
  return encodeURIComponent(value)
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

function resolveCodeRunner(lang: string | undefined): string {
  const requestedLang = (lang || '').trim().split(/\s+/)[0].toLowerCase()
  return requestedLang === 'go' || requestedLang === 'golang' ? 'go' : ''
}

function renderHighlightedCode(source: string, lang: string | undefined): string {
  const { langClass, validLang } = resolveCodeLanguage(lang)
  const highlighted = validLang
    ? hljs.highlight(source, { language: validLang }).value
    : escapeHtml(source)
  return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`
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

function renderEditableToolbar(kind: EditableBlockKind, langLabel: string, runner: string): string {
  const label = kind === 'math' ? 'LaTeX' : langLabel
  const runButton = runner
    ? '<button class="md-editable-action md-editable-action--run" type="button" data-md-action="run">运行</button>'
    : ''
  const sourceButton = kind === 'math'
    ? '<button class="md-editable-action" type="button" data-md-action="source" aria-expanded="false">显示源码</button>'
    : ''

  return [
    '<div class="md-code-header md-editable-toolbar">',
    `<span class="md-code-lang">${escapeHtml(label)}</span>`,
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

function renderEditableBlock(kind: EditableBlockKind, source: string, lang = ''): string {
  const encodedSource = escapeHtml(encodeSource(source))
  const { langLabel, validLang } = resolveCodeLanguage(lang)
  const runner = kind === 'code' ? resolveCodeRunner(lang) : ''
  const content = kind === 'code'
    ? renderHighlightedCode(source, validLang)
    : renderLatex(source, true)
  const sourceView = kind === 'math'
    ? `<pre class="md-editable-source" hidden><code>${escapeHtml(source)}</code></pre>`
    : ''
  const runnerAttr = runner ? ` data-md-runner="${escapeHtml(runner)}"` : ''

  return [
    `<div class="md-editable-block md-${kind}-block" data-md-kind="${kind}" data-md-original="${encodedSource}" data-md-current="${encodedSource}" data-md-lang="${escapeHtml(validLang)}"${runnerAttr}>`,
    renderEditableToolbar(kind, langLabel, runner),
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
      const requestedLang = (lang || '').trim().split(/\s+/)[0]
      if (requestedLang.toLowerCase() === 'mermaid') {
        return renderMermaidDiagram(text)
      }
      return renderEditableBlock('code', text, requestedLang)
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

export function renderMarkdown(source: string): string {
  if (!source) return ''
  const cached = renderedMarkdownCache.get(source)
  if (cached !== undefined) return cached

  const rendered = sanitizeHtml(marked.parse(preprocessMarkdownMath(source)) as string)
  renderedMarkdownCache.set(source, rendered)

  if (renderedMarkdownCache.size > MARKDOWN_CACHE_LIMIT) {
    const oldestKey = renderedMarkdownCache.keys().next().value
    if (oldestKey !== undefined) renderedMarkdownCache.delete(oldestKey)
  }

  return rendered
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

  root.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    const originalSrc = image.getAttribute('src') || ''
    if (!originalSrc) return

    image.dataset.originalSrc = originalSrc
    const sourcePage = image.closest<HTMLDetailsElement>('details.md-source-page')
    if (sourcePage && !sourcePage.open) {
      image.dataset.mdLazySrc = originalSrc
      image.src = SOURCE_IMAGE_PLACEHOLDER
    }

    const onError = () => {
      retryPublicAssetImage(image, originalSrc)
    }

    image.addEventListener('error', onError)
    cleanupHandlers.push(() => image.removeEventListener('error', onError))

    if (!sourcePage && image.complete && image.naturalWidth === 0) {
      queueMicrotask(onError)
    }
  })

  root.querySelectorAll<HTMLDetailsElement>('details.md-source-page').forEach((details) => {
    if (details.open) loadSourcePageImages(details)

    const onToggle = () => {
      if (details.open) loadSourcePageImages(details)
    }

    details.addEventListener('toggle', onToggle)
    cleanupHandlers.push(() => details.removeEventListener('toggle', onToggle))
  })

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

  const runStatusLabels: Record<RunStatus | 'preparing' | 'running', string> = {
    preparing: '准备中',
    running: '运行中',
    success: '成功',
    compile_error: '编译错误',
    runtime_error: '运行错误',
    timeout: '超时',
    unsupported: '不支持',
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
    block.append(panel)

    return panel
  }

  const setRunOutputPending = (block: HTMLElement, state: 'preparing' | 'running') => {
    const panel = ensureRunOutput(block)
    panel.dataset.status = state
    panel.classList.remove('is-stale')

    const status = panel.querySelector<HTMLElement>('.md-run-output__status')
    const duration = panel.querySelector<HTMLElement>('.md-run-output__duration')
    const message = panel.querySelector<HTMLElement>('.md-run-output__message')
    const empty = panel.querySelector<HTMLElement>('.md-run-output__empty')
    const stdout = ensureRunStream(panel, 'stdout')
    const stderr = ensureRunStream(panel, 'stderr')

    if (status) status.textContent = runStatusLabels[state]
    if (duration) duration.textContent = ''
    if (message) {
      message.textContent = ''
      message.hidden = true
    }
    if (empty) empty.hidden = true
    stdout.hidden = true
    stderr.hidden = true
  }

  const scrollRunOutputIntoView = (block: HTMLElement) => {
    const panel = ensureRunOutput(block)
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior, block: 'center', inline: 'nearest' })
    })
  }

  const setRunOutputResult = (block: HTMLElement, result: RunResult) => {
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

    if (status) status.textContent = runStatusLabels[result.status]
    if (duration) duration.textContent = `${Math.max(0, Math.round(result.durationMs))} ms`
    if (message) {
      message.textContent = result.message
      message.hidden = !result.message
    }
    if (stdoutPre) stdoutPre.textContent = result.stdout
    if (stderrPre) stderrPre.textContent = result.stderr
    stdout.hidden = !hasStdout
    stderr.hidden = !hasStderr
    if (empty) empty.hidden = hasStdout || hasStderr || Boolean(result.message)
  }

  const setRunButtonLoading = (button: HTMLElement, running: boolean) => {
    button.classList.toggle('is-running', running)
    button.setAttribute('aria-busy', running ? 'true' : 'false')
    button.textContent = running ? '运行中' : '运行'
    if (button instanceof HTMLButtonElement) button.disabled = running
  }

  const runBlockSource = async (button: HTMLElement, block: HTMLElement) => {
    if (block.classList.contains('is-running')) return

    const runner = block.dataset.mdRunner || ''
    block.classList.add('is-running')
    setRunButtonLoading(button, true)
    setRunOutputPending(block, 'preparing')
    scrollRunOutputIntoView(block)

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      setRunOutputPending(block, 'running')
      const result = await runCode({
        language: runner,
        source: getCurrentSource(block),
      })
      setRunOutputResult(block, result)
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
      setRunButtonLoading(button, false)
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
