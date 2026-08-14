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
const SECONDARY_COLOR_FALLBACK = '#ff69b4'
const TERTIARY_COLOR_FALLBACK = '#1fc41f'
const PDF_UNDERLINE_COLOR = '#000'
const IMAGE_MAX_WIDTH_PT = 460
const SITE_BASE_URL = siteConfig.siteUrl || 'https://diewehmut.github.io'

type PdfPalette = {
  accent: string
  secondary: string
  tertiary: string
  underline: string
}

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

function readPdfPalette(): PdfPalette {
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback

  return {
    accent: read('--site-accent', ACCENT_COLOR_FALLBACK),
    secondary: read('--site-secondary', SECONDARY_COLOR_FALLBACK),
    tertiary: read('--site-tertiary', TERTIARY_COLOR_FALLBACK),
    underline: PDF_UNDERLINE_COLOR,
  }
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

function inlineContent(node: Node, palette: PdfPalette): Content {
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
    .map((child) => inlineContent(child, palette))
    .filter(Boolean)
  if (!children.length) return ''

  let base: Content
  if (children.length === 1) base = children[0] as Content
  else base = { text: children }

  const style: Record<string, unknown> = {}
  if (tag === 'strong' || tag === 'b') {
    style.bold = true
    style.color = palette.secondary
  }
  if (tag === 'em' || tag === 'i') {
    style.italics = true
    style.color = palette.tertiary
  }
  if (tag === 'code' || tag === 'kbd' || tag === 'samp') {
    style.fontSize = 8.8
    style.background = tintWithWhite(palette.tertiary, 0.88)
    style.color = palette.secondary
  }
  if (tag === 'a') {
    const rawHref = (node as HTMLAnchorElement).getAttribute('href') || ''
    if (rawHref) {
      style.link = absoluteUrl(rawHref)
      style.color = palette.accent
      style.decoration = 'underline'
      style.decorationColor = palette.accent
    }
  }
  if (tag === 'mark') {
    style.background = tintWithWhite(palette.secondary, 0.76)
    style.color = palette.secondary
  }
  if (tag === 'u') {
    style.decoration = 'underline'
    style.decorationColor = palette.underline
    style.decorationThickness = 0.7
  }
  if (tag === 'ins') {
    style.color = palette.tertiary
    style.decoration = 'underline'
    style.decorationColor = palette.tertiary
  }
  if (tag === 'del' || tag === 's') {
    style.color = '#b42318'
    style.decoration = 'lineThrough'
    style.decorationColor = '#b42318'
  }

  if (!Object.keys(style).length) return base
  if (typeof base === 'object' && base !== null && 'text' in base) {
    return { ...base, ...style } as Content
  }
  return { text: [base], ...style } as Content
}

function vocabularyListItemToContent(item: Element, palette: PdfPalette): Content {
  const word = Array.from(item.children).find((child) =>
    child.classList.contains('md-vocabulary-entry__word')
  )
  const rows = Array.from(item.children).filter((child) =>
    child.classList.contains('md-vocabulary-entry__row')
  )
  const nestedLists = Array.from(item.children).filter((child) =>
    ['ul', 'ol'].includes(child.tagName.toLowerCase())
  )
  const stack: Content[] = []

  if (word?.textContent?.trim()) {
    stack.push({
      text: cleanText(word.textContent),
      bold: true,
      color: palette.secondary,
      margin: [0, 0, 0, 2],
    })
  }

  rows.forEach((row) => {
    const locale = row.getAttribute('data-md-vocabulary-locale') || ''
    const label = row.querySelector('.md-vocabulary-entry__label')?.textContent?.trim() || ''
    const phonetic = row.querySelector('.md-vocabulary-entry__phonetic')?.textContent?.trim() || ''
    const suffix = row.querySelector('.md-vocabulary-entry__suffix')?.textContent?.trim() || ''
    const rowColor = locale === 'british'
      ? palette.tertiary
      : locale === 'american'
        ? palette.accent
        : palette.secondary

    stack.push({
      columns: [
        { text: label, width: 22, bold: true, color: rowColor },
        {
          text: [
            { text: phonetic, color: rowColor },
            ...(suffix ? [{ text: ` ${suffix}`, color: palette.tertiary }] : []),
          ],
        },
      ],
      columnGap: 4,
      margin: [0, 1, 0, 0],
    } as Content)
  })

  nestedLists.forEach((nestedList) => {
    const nestedItems = listItems(nestedList, palette)
    stack.push(
      nestedList.tagName.toLowerCase() === 'ol'
        ? { ol: nestedItems, style: 'list', margin: [8, 3, 0, 0] }
        : { ul: nestedItems, style: 'list', margin: [8, 3, 0, 0] },
    )
  })

  return {
    stack,
    margin: [0, 2, 0, 4],
  } as Content
}

function listItems(list: Element, palette: PdfPalette): Content[] {
  return Array.from(list.children)
    .filter((child) => child.tagName.toLowerCase() === 'li')
    .map((item) => {
      if (item.classList.contains('md-vocabulary-entry')) {
        return vocabularyListItemToContent(item, palette)
      }

      const nestedLists = Array.from(item.children).filter((child) =>
        ['ul', 'ol'].includes(child.tagName.toLowerCase())
      )
      const directNodes = Array.from(item.childNodes).filter(
        (child) => !(child instanceof Element) || !nestedLists.includes(child)
      )
      const text = directNodes
        .map((child) => inlineContent(child, palette))
        .filter(Boolean)
      const nested = nestedLists.map((list) => ({
        [list.tagName.toLowerCase() === 'ul' ? 'ul' : 'ol']: listItems(list, palette),
      }))
      return { text, ...(nested.length ? { ul: nested } : {}) } as Content
    })
}

function tableToContent(table: HTMLTableElement, palette: PdfPalette): Content {
  const rows = Array.from(table.querySelectorAll('tr'))
  const body = rows.map((row) =>
    Array.from(row.children).map((cell) => ({
      text: inlineContent(cell, palette),
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

function editableBlockToBlocks(block: HTMLElement, palette: PdfPalette): Content[] {
  const kind = block.dataset.mdKind
  const raw = block.dataset.mdOriginal || block.dataset.mdCurrent || ''
  const pre = block.querySelector('pre')

  if (kind === 'math') {
    const formula = raw ? decodeHtml(raw) : block.textContent?.trim() || ''
    return formula
      ? [
          { text: 'LaTeX', style: 'codeHeader', color: palette.accent },
          { text: formula, style: 'mathBlock', preserveLeadingSpaces: true },
        ]
      : []
  }
  if (pre) {
    const lang = block.dataset.mdLang || ''
    const fileName = block.dataset.mdFileName || ''
    const label = fileName ? `file: ${fileName}` : lang || 'text'
    return [
      { text: label, style: 'codeHeader', color: palette.secondary },
      {
        text: pre.textContent || '',
        style: 'codeBlock',
        preserveLeadingSpaces: true,
      },
    ]
  }
  return Array.from(block.children).flatMap((child) =>
    elementToBlocks(child, palette)
  )
}

let tocEntries: Array<{ id: string; title: string; level: number }> = []

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function articleMetaToBlocks(meta: HTMLElement, palette: PdfPalette): Content[] {
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
        color: palette.accent,
        background: tintWithWhite(palette.accent, 0.88),
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
        lineColor: palette.accent,
      },
    ],
    margin: [0, 4, 0, 10],
  })

  return result
}

function elementToBlocks(element: Element, palette: PdfPalette): Content[] {
  const tag = element.tagName.toLowerCase()
  const classes = element.classList

  if (classes.contains('article-meta')) {
    return articleMetaToBlocks(element as HTMLElement, palette)
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
      return editableBlockToBlocks(element as HTMLElement, palette)
    }
    return Array.from(element.children).flatMap((child) =>
      elementToBlocks(child, palette)
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
        const heading: Content = { text: inlineContent(element, palette), style: tag }
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
      return [{ text: inlineContent(element, palette), style: 'paragraph' }]
    case 'ul':
      return [{ ul: listItems(element, palette), style: 'list' }]
    case 'ol':
      return [{ ol: listItems(element, palette), style: 'list' }]
    case 'blockquote':
      {
        const quoteContent = Array.from(element.children).flatMap((child) =>
          elementToBlocks(child, palette)
        )
        return [
          {
            table: {
              widths: [1.2, '*'],
              body: [
                [
                  { text: '', fillColor: palette.secondary },
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
            elementToBlocks(child, palette)
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
      return [tableToContent(element as HTMLTableElement, palette)]
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
              lineColor: palette.tertiary,
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
      return [{ text: inlineContent(element, palette), style: 'paragraph' }]
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
  palette: PdfPalette,
  siteTitle: string
): TDocumentDefinitions {
  const { accent, secondary, tertiary } = palette
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
                        color: tertiary,
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
      tocPage: { fontSize: 10.2, bold: true, color: secondary },
      h1: { fontSize: 21, bold: true, color: accent, margin: [0, 0, 0, 10] },
      h2: { fontSize: 16, bold: true, color: secondary, margin: [0, 18, 0, 7] },
      h3: { fontSize: 13.5, bold: true, color: tertiary, margin: [0, 14, 0, 6] },
      h4: { fontSize: 12, bold: true, color: accent, margin: [0, 11, 0, 5] },
      h5: { fontSize: 11, bold: true, color: secondary, margin: [0, 9, 0, 4] },
      h6: { fontSize: 10.8, bold: true, color: tertiary, margin: [0, 8, 0, 4] },
      paragraph: { fontSize: 10.8, lineHeight: 1.6, margin: [0, 4, 0, 4] },
      metaRow: {
        fontSize: 9,
        lineHeight: 1.45,
        color: '#666',
        margin: [0, 2, 0, 2],
      },
      metaItem: { fontSize: 9, color: '#666' },
      metaLink: { fontSize: 9, color: accent, decoration: 'underline', decorationColor: accent },
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
        background: tintWithWhite(tertiary, 0.93),
        color: '#24292e',
        margin: [0, 0, 0, 9],
      },
      mathBlock: {
        fontSize: 9,
        italics: true,
        background: tintWithWhite(secondary, 0.95),
        color: '#333',
        margin: [0, 0, 0, 9],
      },
      table: { fontSize: 9, lineHeight: 1.35, margin: [0, 7, 0, 11] },
      tableHeader: {
        bold: true,
        color: secondary,
        background: tintWithWhite(secondary, 0.92),
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
              color: secondary,
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
      color: tertiary,
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

  const palette = readPdfPalette()
  tocEntries = []
  const content = Array.from(source.element.children)
    .flatMap((child) => elementToBlocks(child, palette))
    .filter(Boolean)
  const definition = buildDocumentDefinition(
    source.title,
    content,
    tocEntries,
    palette,
    siteTitle
  )

  pdfMake.createPdf(definition).download(`${sanitizeFilename(source.title)}.pdf`)
}
