import { Marked } from 'marked'
import hljs from 'highlight.js'
import markedKatex from 'marked-katex-extension'

const marked = new Marked({
  async: false,
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const validLang = lang && hljs.getLanguage(lang) ? lang : ''
      let highlighted: string
      if (validLang) {
        highlighted = hljs.highlight(text, { language: validLang }).value
      } else {
        highlighted = hljs.highlightAuto(text).value
      }
      const langClass = validLang ? ` language-${validLang}` : ''
      const langLabel = validLang || ''
      const headerHtml = langLabel
        ? `<div class="md-code-header"><span class="md-code-lang">${langLabel}</span><button class="md-code-copy" onclick="(function(btn){var code=btn.closest('.md-code-block').querySelector('code');navigator.clipboard.writeText(code.textContent);btn.textContent='✓ Copied';setTimeout(function(){btn.textContent='Copy'},1500)})(this)">Copy</button></div>`
        : `<div class="md-code-header"><span class="md-code-lang"></span><button class="md-code-copy" onclick="(function(btn){var code=btn.closest('.md-code-block').querySelector('code');navigator.clipboard.writeText(code.textContent);btn.textContent='✓ Copied';setTimeout(function(){btn.textContent='Copy'},1500)})(this)">Copy</button></div>`
      return `<div class="md-code-block">${headerHtml}<pre><code class="hljs${langClass}">${highlighted}</code></pre></div>`
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
  return marked.parse(source) as string
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
