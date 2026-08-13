import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import lxgwFontUrl from '../assets/fonts/LXGWWenKai-Regular.ttf'
import { siteConfig } from '../data/site/config'

export type PdfExportSource = {
  title: string
  element: HTMLElement
}

const ACCENT_COLOR_FALLBACK = '#9b3dff'
const IMAGE_MAX_WIDTH_PT = 460
const SITE_BASE_URL = siteConfig.siteUrl || 'https://diewehmut.github.io'

let pdfFontsReady: Promise<void> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function decodeHtml(value: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

function readAccentColor(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--site-accent')
      .trim() || ACCENT_COLOR_FALLBACK
  )
}

function absoluteUrl(href: string): string {
  if (!href) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return href
  const prefix = href.startsWith('/') ? '' : '/'
  return `${SITE_BASE_URL}${prefix}${href}`
}

function tintWithWhite(hex: string, ratio: number): string {
  const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!match) return '#f5f5f5'
  const mix = (value: number) =>
    Math.round(value + (255 - value) * ratio)
  const channels = [match[1], match[2], match[3]].map((part) =>
    mix(parseInt(part, 16))
  )
  return `#${channels
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return cleaned || 'article'
}

async function ensurePdfFonts(): Promise<void> {
  pdfFontsReady ||= (async () => {
    try {
      pdfMake.addVirtualFileSystem(pdfFonts)
    } catch {
      ;(pdfMake as unknown as { vfs?: Record<string, string> }).vfs = pdfFonts
    }

    const response = await fetch(lxgwFontUrl)
    if (!response.ok) throw new Error(`Font load failed: ${response.status}`)
    const base64 = arrayBufferToBase64(await response.arrayBuffer())
    pdfMake.addVirtualFileSystem({ 'LXGWWenKai-Regular.ttf': base64 })

    pdfMake.fonts = {
      ...(pdfMake.fonts || {}),
      LXGW: {
        normal: 'LXGWWenKai-Regular.ttf',
        bold: 'LXGWWenKai-Regular.ttf',
        italics: 'LXGWWenKai-Regular.ttf',
        bolditalics: 'LXGWWenKai-Regular.ttf',
      },
    }
  })()
  await pdfFontsReady
}

function extractInlineLatex(node: HTMLElement): string {
  const annotation = node.querySelector('annotation')
  return annotation?.textContent?.trim() || ''
}

function inlineContent(node: Node, accent: string): Content {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    return text.trim() ? { text } : ''
  }

  if (!(node instanceof HTMLElement)) return { text: node.textContent || '' }

  const tag = node.tagName.toLowerCase()
  if (tag === 'br') return { text: '\n' }
  if (tag === 'input') {
    return { text: (node as HTMLInputElement).checked ? '☑' : '☐' }
  }
  if (tag === 'img') {
    const alt = (node as HTMLImageElement).alt
    return alt ? { text: `[${alt}]` } : ''
  }
  if (node.classList.contains('katex')) {
    const formula = extractInlineLatex(node)
    return formula
      ? { text: formula, italics: true, color: '#555' }
      : { text: node.textContent?.trim() || ' ' }
  }

  const children = Array.from(node.childNodes)
    .map((child) => inlineContent(child, accent))
    .filter(Boolean)
  if (!children.length) return ''

  let base: Content
  if (children.length === 1) base = children[0] as Content
  else base = { text: children }

  const style: Record<string, unknown> = {}
  if (tag === 'strong' || tag === 'b') style.bold = true
  if (tag === 'em' || tag === 'i') style.italics = true
  if (tag === 'code' || tag === 'kbd' || tag === 'samp') {
    style.fontSize = 8.8
    style.background = '#f2f2f2'
    style.color = '#c7254e'
  }
  if (tag === 'a') {
    const rawHref = (node as HTMLAnchorElement).getAttribute('href') || ''
    if (rawHref) {
      style.link = absoluteUrl(rawHref)
      style.color = accent
      style.decoration = 'underline'
    }
  }
  if (tag === 'mark') style.background = '#fff3bf'
  if (tag === 'del' || tag === 's') style.decoration = 'lineThrough'

  if (!Object.keys(style).length) return base
  if (typeof base === 'object' && base !== null && 'text' in base) {
    return { ...base, ...style } as Content
  }
  return { text: [base], ...style } as Content
}

function listItems(list: Element, accent: string): Content[] {
  return Array.from(list.children)
    .filter((child) => child.tagName.toLowerCase() === 'li')
    .map((item) => {
      const nestedLists = Array.from(item.children).filter((child) =>
        ['ul', 'ol'].includes(child.tagName.toLowerCase())
      )
      const directNodes = Array.from(item.childNodes).filter(
        (child) => !(child instanceof Element) || !nestedLists.includes(child)
      )
      const text = directNodes
        .map((child) => inlineContent(child, accent))
        .filter(Boolean)
      const nested = nestedLists.map((list) => ({
        [list.tagName.toLowerCase() === 'ul' ? 'ul' : 'ol']: listItems(list, accent),
      }))
      return { text, ...(nested.length ? { ul: nested } : {}) } as Content
    })
}

function tableToContent(table: HTMLTableElement, accent: string): Content {
  const rows = Array.from(table.querySelectorAll('tr'))
  const body = rows.map((row) =>
    Array.from(row.children).map((cell) => ({
      text: inlineContent(cell, accent),
      style: cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell',
    }))
  )
  const columnCount = Math.max(...body.map((row) => row.length), 1)
  return {
    table: {
      headerRows: 1,
      widths: Array(columnCount).fill('*'),
      body,
    },
    layout: 'lightHorizontalLines',
    style: 'table',
  }
}

function imageToContent(image: HTMLImageElement): Content {
  const dataUrl = image.dataset.pdfImage
  if (!dataUrl) {
    return image.alt ? { text: `[${image.alt}]`, style: 'paragraph' } : ''
  }
  const naturalWidth = Number(image.dataset.pdfWidth || 460)
  return {
    image: dataUrl,
    width: Math.min(naturalWidth, IMAGE_MAX_WIDTH_PT),
    alignment: 'center',
    style: 'image',
  }
}

function editableBlockToBlocks(block: HTMLElement, accent: string): Content[] {
  const kind = block.dataset.mdKind
  const raw = block.dataset.mdOriginal || block.dataset.mdCurrent || ''
  const pre = block.querySelector('pre')

  if (kind === 'math') {
    const formula = raw ? decodeHtml(raw) : block.textContent?.trim() || ''
    return formula
      ? [
          { text: 'LaTeX', style: 'codeHeader', color: accent },
          { text: formula, style: 'mathBlock', preserveLeadingSpaces: true },
        ]
      : []
  }
  if (pre) {
    const lang = block.dataset.mdLang || ''
    const fileName = block.dataset.mdFileName || ''
    const label = fileName ? `file: ${fileName}` : lang || 'text'
    return [
      { text: label, style: 'codeHeader', color: accent },
      {
        text: pre.textContent || '',
        style: 'codeBlock',
        preserveLeadingSpaces: true,
      },
    ]
  }
  return Array.from(block.children).flatMap((child) =>
    elementToBlocks(child, accent)
  )
}

let tocEntries: Array<{ id: string; title: string; level: number }> = []

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function articleMetaToBlocks(meta: HTMLElement, accent: string): Content[] {
  const items: Content[] = []
  const pushItem = (item: Content) => {
    if (items.length) {
      items.push({ text: '  ·  ', color: '#b5b5b5', fontSize: 9 })
    }
    items.push(item)
  }

  const date = meta.querySelector('.article-meta__date')
  if (date) pushItem({ text: cleanText(date.textContent || ''), style: 'metaItem' })

  const updated = meta.querySelector('.article-meta__updated')
  if (updated) {
    pushItem({ text: cleanText(updated.textContent || ''), style: 'metaItem' })
  }

  for (const stat of meta.querySelectorAll('.article-meta__stat')) {
    pushItem({ text: cleanText(stat.textContent || ''), style: 'metaItem' })
  }

  const license = meta.querySelector<HTMLAnchorElement>('.article-meta__license')
  if (license) {
    pushItem({
      text: cleanText(license.textContent || ''),
      link: absoluteUrl(license.getAttribute('href') || ''),
      style: 'metaLink',
    })
  }

  const result: Content[] = []
  if (items.length) result.push({ text: items, style: 'metaRow' })

  const tagLinks = Array.from(
    meta.querySelectorAll<HTMLAnchorElement>('a.article-meta__tag')
  )
  if (tagLinks.length) {
    const tagText: Content[] = []
    tagLinks.forEach((link, index) => {
      if (index > 0) tagText.push({ text: '  ' })
      const tag = cleanText(link.textContent || '')
      tagText.push({
        text: `# ${tag}`,
        link: absoluteUrl(link.getAttribute('href') || ''),
        color: accent,
        background: tintWithWhite(accent, 0.88),
        fontSize: 8.5,
        bold: true,
      })
    })
    result.push({ text: tagText, style: 'tagRow' })
  }

  // A subtle accent rule separates the article header from the body, like the
  // card border on the website.
  result.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 499,
        y2: 0,
        lineWidth: 0.8,
        lineColor: accent,
      },
    ],
    margin: [0, 4, 0, 10],
  })

  return result
}

function elementToBlocks(element: Element, accent: string): Content[] {
  const tag = element.tagName.toLowerCase()
  const classes = element.classList

  if (classes.contains('article-meta')) {
    return articleMetaToBlocks(element as HTMLElement, accent)
  }

  if (
    classes.contains('markdown-body') ||
    classes.contains('markdown-content__chunk') ||
    tag === 'div' ||
    tag === 'section' ||
    tag === 'article' ||
    tag === 'figure' ||
    tag === 'details' ||
    tag === 'summary'
  ) {
    if (classes.contains('md-editable-block')) {
      return editableBlockToBlocks(element as HTMLElement, accent)
    }
    return Array.from(element.children).flatMap((child) =>
      elementToBlocks(child, accent)
    )
  }

  switch (tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      {
        const heading: Content = { text: inlineContent(element, accent), style: tag }
        if (element.closest('.markdown-body')) {
          const tocId = `pdf-toc-${tocEntries.length + 1}`
          ;(heading as Content & { id: string }).id = tocId
          tocEntries.push({
            id: tocId,
            title: cleanText(element.textContent || ''),
            level: Number(tag.slice(1)) || 2,
          })
        }
        return [heading]
      }
    case 'p':
      return [{ text: inlineContent(element, accent), style: 'paragraph' }]
    case 'ul':
      return [{ ul: listItems(element, accent), style: 'list' }]
    case 'ol':
      return [{ ol: listItems(element, accent), style: 'list' }]
    case 'blockquote':
      {
        const quoteContent = Array.from(element.children).flatMap((child) =>
          elementToBlocks(child, accent)
        )
        return [
          {
            table: {
              widths: [1.2, '*'],
              body: [
                [
                  { text: '', fillColor: accent },
                  {
                    stack: quoteContent,
                    margin: [10, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: 'noBorders',
            style: 'blockquote',
          },
        ]
      }
      return [
        {
          stack: Array.from(element.children).flatMap((child) =>
            elementToBlocks(child, accent)
          ),
          style: 'blockquote',
        },
      ]
    case 'pre':
      return [
        {
          text: element.textContent || '',
          style: 'codeBlock',
          preserveLeadingSpaces: true,
        },
      ]
    case 'table':
      return [tableToContent(element as HTMLTableElement, accent)]
    case 'hr':
      return [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 499,
              y2: 0,
              lineWidth: 0.7,
              lineColor: accent,
            },
          ],
          margin: [0, 8, 0, 8],
        },
      ]
    case 'img':
      return [imageToContent(element as HTMLImageElement)]
    case 'figcaption':
      return [
        {
          text: cleanText(element.textContent || ''),
          style: 'figcaption',
        },
      ]
    default:
      return [{ text: inlineContent(element, accent), style: 'paragraph' }]
  }
}

async function embedImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(async (image) => {
      if (image.dataset.pdfImage) return
      const src =
        image.dataset.mdLazySrc ||
        image.currentSrc ||
        image.getAttribute('src') ||
        ''
      if (!src) return

      try {
        let dataUrl = src
        if (!src.startsWith('data:')) {
          const response = await fetch(src)
          if (!response.ok) throw new Error(`Image load failed: ${response.status}`)
          dataUrl = await blobToDataUrl(await response.blob())
        }
        const probe = new Image()
        await new Promise<void>((resolve, reject) => {
          probe.onload = () => resolve()
          probe.onerror = () => reject(new Error('Image decode failed'))
          probe.src = dataUrl
        })
        image.dataset.pdfImage = dataUrl
        image.dataset.pdfWidth = String(probe.naturalWidth || 460)
      } catch {
        // Leave the image unembedded; the converter falls back to alt text.
      }
    })
  )
}

function buildDocumentDefinition(
  title: string,
  content: Content[],
  toc: Array<{ id: string; title: string; level: number }>,
  accent: string,
  siteTitle: string
): TDocumentDefinitions {
  const tocContent: Content[] =
    toc.length >= 2
      ? [
          {
            stack: [
              { text: 'Contents', style: 'tocTitle' },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 499,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: accent,
                  },
                ],
                margin: [0, 4, 0, 10],
              },
              ...toc.map((entry) => ({
                columns: [
                  {
                    width: '*',
                    text: [
                      {
                        text: entry.level > 2 ? '·  ' : '▪  ',
                        color: accent,
                        bold: true,
                      },
                      { text: entry.title, style: 'tocEntry' },
                    ],
                  },
                  {
                    width: 'auto',
                    pageReference: entry.id,
                    style: 'tocPage',
                  },
                ],
                margin: [(entry.level - 2) * 12, 2.5, 0, 2.5],
              })),
            ],
            pageBreak: 'after',
          } as Content,
        ]
      : []
  const truncatedTitle = title.length > 42 ? `${title.slice(0, 42)}…` : title

  return {
    pageSize: 'A4',
    pageMargins: [48, 54, 48, 50],
    info: { title },
    defaultStyle: {
      font: 'LXGW',
      fontSize: 10.8,
      lineHeight: 1.6,
      color: '#1f1f1f',
    },
    content: [...tocContent, ...content],
    styles: {
      tocTitle: { fontSize: 16, bold: true, color: accent, margin: [0, 0, 0, 10] },
      tocEntry: { fontSize: 10.2, color: '#333' },
      tocPage: { fontSize: 10.2, bold: true, color: accent },
      h1: { fontSize: 21, bold: true, color: accent, margin: [0, 0, 0, 10] },
      h2: { fontSize: 16, bold: true, color: accent, margin: [0, 18, 0, 7] },
      h3: { fontSize: 13.5, bold: true, color: accent, margin: [0, 14, 0, 6] },
      h4: { fontSize: 12, bold: true, color: accent, margin: [0, 11, 0, 5] },
      h5: { fontSize: 11, bold: true, color: accent, margin: [0, 9, 0, 4] },
      h6: { fontSize: 10.8, bold: true, color: accent, margin: [0, 8, 0, 4] },
      paragraph: { fontSize: 10.8, lineHeight: 1.6, margin: [0, 4, 0, 4] },
      metaRow: {
        fontSize: 9,
        lineHeight: 1.45,
        color: '#666',
        margin: [0, 2, 0, 2],
      },
      metaItem: { fontSize: 9, color: '#666' },
      metaLink: { fontSize: 9, color: accent, decoration: 'underline' },
      tagRow: { fontSize: 8.5, lineHeight: 1.4, margin: [0, 4, 0, 0] },
      list: { fontSize: 10.8, lineHeight: 1.55, margin: [0, 4, 0, 8] },
      blockquote: {
        fontSize: 10.6,
        color: '#444',
        margin: [0, 5, 0, 9],
      },
      codeHeader: {
        fontSize: 8,
        bold: true,
        margin: [0, 7, 0, 0],
      },
      codeBlock: {
        fontSize: 8.8,
        lineHeight: 1.4,
        background: tintWithWhite(accent, 0.93),
        color: '#24292e',
        margin: [0, 0, 0, 9],
      },
      mathBlock: {
        fontSize: 9,
        italics: true,
        background: tintWithWhite(accent, 0.95),
        color: '#333',
        margin: [0, 0, 0, 9],
      },
      table: { fontSize: 9, lineHeight: 1.35, margin: [0, 7, 0, 11] },
      tableHeader: {
        bold: true,
        color: accent,
        background: tintWithWhite(accent, 0.92),
      },
      tableCell: {},
      image: { margin: [0, 6, 0, 6] },
      figcaption: {
        fontSize: 8.5,
        color: '#777',
        alignment: 'center',
        margin: [0, 2, 0, 9],
      },
    },
    header: (_currentPage, _pageCount, pageSize) => ({
      stack: [
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: pageSize.width,
              h: 4,
              color: accent,
            },
          ],
        },
        {
          columns: [
            { text: siteTitle, fontSize: 8, color: '#999' },
            {
              text: truncatedTitle,
              fontSize: 8,
              color: accent,
              alignment: 'right',
            },
          ],
          margin: [0, 6, 0, 0],
        },
      ],
    }),
    footer: (currentPage, pageCount) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'right',
      margin: [0, 0, 48, 0],
      color: accent,
      fontSize: 8.5,
    }),
  }
}

export async function generateArticlePdf(
  source: PdfExportSource,
  siteTitle = 'Nexus'
): Promise<void> {
  await ensurePdfFonts()
  await embedImages(source.element)

  const accent = readAccentColor()
  tocEntries = []
  const content = Array.from(source.element.children)
    .flatMap((child) => elementToBlocks(child, accent))
    .filter(Boolean)
  const definition = buildDocumentDefinition(
    source.title,
    content,
    tocEntries,
    accent,
    siteTitle
  )

  pdfMake.createPdf(definition).download(`${sanitizeFilename(source.title)}.pdf`)
}
