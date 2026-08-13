import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import lxgwFontUrl from '../assets/fonts/LXGWWenKai-Regular.ttf'

export type PdfExportSource = {
  title: string
  element: HTMLElement
}

const ACCENT_COLOR_FALLBACK = '#9b3dff'
const IMAGE_MAX_WIDTH_PT = 460

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
    const href = (node as HTMLAnchorElement).getAttribute('href') || ''
    if (href) {
      style.link = href
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
      ? [{ text: formula, style: 'mathBlock', preserveLeadingSpaces: true }]
      : []
  }
  if (pre) {
    return [
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

function elementToBlocks(element: Element, accent: string): Content[] {
  const tag = element.tagName.toLowerCase()
  const classes = element.classList

  if (classes.contains('article-meta')) {
    const text = element.textContent?.replace(/\s+/g, ' ').trim()
    return text ? [{ text, style: 'meta' }] : []
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
      return [{ text: inlineContent(element, accent), style: tag }]
    case 'p':
      return [{ text: inlineContent(element, accent), style: 'paragraph' }]
    case 'ul':
      return [{ ul: listItems(element, accent), style: 'list' }]
    case 'ol':
      return [{ ol: listItems(element, accent), style: 'list' }]
    case 'blockquote':
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
  accent: string
): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageMargins: [48, 54, 48, 50],
    info: { title },
    defaultStyle: {
      font: 'LXGW',
      fontSize: 10.5,
      lineHeight: 1.5,
      color: '#1f1f1f',
    },
    content,
    styles: {
      h1: { fontSize: 19, bold: true, color: accent, margin: [0, 0, 0, 8] },
      h2: { fontSize: 15.5, bold: true, color: accent, margin: [0, 16, 0, 6] },
      h3: { fontSize: 13, bold: true, color: accent, margin: [0, 12, 0, 5] },
      h4: { fontSize: 12, bold: true, color: accent, margin: [0, 10, 0, 4] },
      h5: { fontSize: 11, bold: true, color: accent, margin: [0, 8, 0, 4] },
      h6: { fontSize: 10.5, bold: true, color: accent, margin: [0, 8, 0, 4] },
      paragraph: { fontSize: 10.5, lineHeight: 1.5, margin: [0, 3, 0, 3] },
      meta: { fontSize: 9, color: '#666', margin: [0, 0, 0, 12] },
      list: { fontSize: 10.5, lineHeight: 1.45, margin: [0, 4, 0, 6] },
      blockquote: {
        fontSize: 10.5,
        italics: true,
        color: '#444',
        margin: [12, 4, 0, 8],
      },
      codeBlock: {
        fontSize: 8.8,
        lineHeight: 1.35,
        background: '#f5f5f5',
        color: '#24292e',
        margin: [0, 6, 0, 8],
      },
      mathBlock: {
        fontSize: 9,
        italics: true,
        background: '#fafafa',
        color: '#333',
        margin: [0, 6, 0, 8],
      },
      table: { fontSize: 9, lineHeight: 1.35, margin: [0, 6, 0, 10] },
      tableHeader: { bold: true, color: accent, background: '#f2f2f2' },
      tableCell: {},
      image: { margin: [0, 6, 0, 6] },
    },
    header: (_currentPage, _pageCount, pageSize) => ({
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
  source: PdfExportSource
): Promise<void> {
  await ensurePdfFonts()
  await embedImages(source.element)

  const accent = readAccentColor()
  const content = Array.from(source.element.children)
    .flatMap((child) => elementToBlocks(child, accent))
    .filter(Boolean)
  const definition = buildDocumentDefinition(source.title, content, accent)

  pdfMake.createPdf(definition).download(`${sanitizeFilename(source.title)}.pdf`)
}
