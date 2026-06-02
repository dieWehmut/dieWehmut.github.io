import { Marked } from 'marked'
import hljs from 'highlight.js'
import markedKatex from 'marked-katex-extension'
import { openImagePreviewGallery } from './imagePreview'

const ALLOWED_TAGS = new Set([
  'a', 'blockquote', 'br', 'button', 'code', 'del', 'details', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'li', 'ol', 'p',
  'pre', 'section', 'span', 'strong', 'summary', 'table', 'tbody', 'td', 'th',
  'thead', 'tr', 'ul',
])

const GLOBAL_ALLOWED_ATTRS = new Set(['class', 'id', 'title', 'lang', 'dir', 'aria-hidden'])
const PER_TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  button: new Set(['type', 'data-copy-code']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
}
const MARKDOWN_CACHE_LIMIT = 24
const renderedMarkdownCache = new Map<string, string>()

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
    if (!GLOBAL_ALLOWED_ATTRS.has(lowerName) && !allowedAttrs.has(lowerName)) continue

    if (!value) {
      collected.push(lowerName)
      continue
    }

    const normalized = value.trim().replace(/^['"]|['"]$/g, '')
    if ((lowerName === 'href' || lowerName === 'src') && !isSafeUrl(normalized)) continue

    collected.push(`${lowerName}="${escapeHtml(normalized)}"`)
  }

  return collected.length ? ` ${collected.join(' ')}` : ''
}

function isSafeUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.startsWith('javascript:')) return false
  if (normalized.startsWith('data:text/html')) return false
  return true
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

const marked = new Marked({
  async: false,
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const requestedLang = (lang || '').trim().split(/\s+/)[0]
      const validLang = requestedLang && hljs.getLanguage(requestedLang) ? requestedLang : ''
      const highlighted = validLang
        ? hljs.highlight(text, { language: validLang }).value
        : escapeHtml(text)
      const langClass = validLang ? ` language-${validLang}` : ''
      const langLabel = validLang || ''
      const headerHtml = langLabel
        ? `<div class="md-code-header"><span class="md-code-lang">${escapeHtml(langLabel)}</span><button class="md-code-copy" type="button" data-copy-code>Copy</button></div>`
        : `<div class="md-code-header"><span class="md-code-lang"></span><button class="md-code-copy" type="button" data-copy-code>Copy</button></div>`
      return `<div class="md-code-block">${headerHtml}<pre><code class="hljs${langClass}">${highlighted}</code></pre></div>`
    },
    image({ href, title, text }) {
      const src = escapeHtml(href || '')
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
    listitem({ tokens }) {
      const text = this.parser.parse(tokens)
      return `<li>${text}</li>\n`
    },
  },
})

marked.use(markedKatex({
  throwOnError: false,
  output: 'htmlAndMathml',
}))

export function renderMarkdown(source: string): string {
  if (!source) return ''
  const cached = renderedMarkdownCache.get(source)
  if (cached !== undefined) return cached

  const rendered = sanitizeHtml(marked.parse(source) as string)
  renderedMarkdownCache.set(source, rendered)

  if (renderedMarkdownCache.size > MARKDOWN_CACHE_LIMIT) {
    const oldestKey = renderedMarkdownCache.keys().next().value
    if (oldestKey !== undefined) renderedMarkdownCache.delete(oldestKey)
  }

  return rendered
}

export function bindMarkdownInteractions(root: ParentNode | null | undefined): () => void {
  if (!root) return () => {}
  const resetTimers = new WeakMap<HTMLElement, number>()

  const scheduleReset = (button: HTMLElement, label: string, state?: 'is-copied' | 'is-failed') => {
    const existingTimer = resetTimers.get(button)
    if (existingTimer) window.clearTimeout(existingTimer)

    const timer = window.setTimeout(() => {
      button.textContent = label
      if (state) button.classList.remove(state)
      resetTimers.delete(button)
    }, 2000)

    resetTimers.set(button, timer)
  }

  const onClick = async (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const image = target.closest<HTMLImageElement>('img')
    if (image?.src) {
      event.preventDefault()
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'))
        .filter((item) => item.src)
        .map((item) => ({ src: item.src, alt: item.alt }))
      openImagePreviewGallery(images, images.findIndex((item) => item.src === image.src))
      return
    }

    const button = target.closest<HTMLElement>('[data-copy-code]')
    if (!button) return

    const code = button.closest('.md-code-block')?.querySelector('code')
    const text = code?.textContent
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      const originalLabel = button.textContent || 'Copy'
      button.classList.remove('is-failed')
      button.classList.add('is-copied')
      button.textContent = 'Copied'
      scheduleReset(button, originalLabel, 'is-copied')
    } catch {
      button.classList.remove('is-copied')
      button.classList.add('is-failed')
      button.textContent = 'Failed'
      scheduleReset(button, 'Copy', 'is-failed')
    }
  }

  root.addEventListener('click', onClick)
  return () => root.removeEventListener('click', onClick)
}

export function excerptFromMarkdown(source: string, maxLength = 120): string {
  if (!source) return ''
  const plain = source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<summary[^>]*>[\s\S]*?<\/summary>/gi, '')
    .replace(/<\/?(?:details|summary|big|b|br|hr|img)[^>]*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[>*\-|]/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength - 1)}…`
}
