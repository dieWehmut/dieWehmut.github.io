import type { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces'
import { siteConfig } from '../data/site/config'
import { ensureMermaidRendered } from './markdown'
import { generatePdfInWorker, PdfWorkerUnavailableError } from './pdfWorkerClient'
import type { PdfWorkerPayload } from './pdfWorkerProtocol'

export type PdfExportSource = {
  title: string
  element: HTMLElement
}

export type PdfGenerationOptions = {
  mode?: 'download' | 'preview'
  targetWindow?: Window | null
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

type PdfMathMarker = {
  nexusMath: {
    formula: string
    display: boolean
  }
  style?: string
  margin?: unknown
  alignment?: 'left' | 'center' | 'right'
  font?: string
  fit?: [number, number]
}

type PdfInlineMathSegment = {
  kind: 'math'
  formula: string
  svg: null
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

function decodeDataSource(value: string): string {
  const htmlDecoded = decodeHtml(value)
  try {
    return decodeURIComponent(htmlDecoded)
  } catch {
    return htmlDecoded
  }
}

function normalizePdfSvg(svg: string): string {
  return svg
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z-]+=(['"]).*?\1/gi, '')
    .replace(/font-family=(['"])(?:serif|sans-serif|monospace)\1/gi, 'font-family="LXGW"')
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

function extractInlineLatex(node: HTMLElement): string {
  const annotation = node.querySelector('annotation')
  return annotation?.textContent?.trim() || ''
}

type PdfInlineTextSegment = {
  kind: 'text'
  content: Content
  raw: string
}

type PdfInlineSegment = PdfInlineTextSegment | PdfInlineMathSegment

function inlineElementStyle(node: HTMLElement, palette: PdfPalette): Record<string, unknown> {
  const tag = node.tagName.toLowerCase()
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
  return style
}

function applyInlineStyle(base: Content, style: Record<string, unknown>): Content {
  if (!Object.keys(style).length) return base
  if (typeof base === 'object' && base !== null && !Array.isArray(base) && 'text' in base) {
    return { ...base, ...style } as Content
  }
  return { text: [base], ...style } as Content
}

function asTextContent(value: Content): ContentText | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return 'text' in value ? value as ContentText : null
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

  return applyInlineStyle(base, inlineElementStyle(node, palette))
}

function collectInlineSegments(node: Node, palette: PdfPalette): PdfInlineSegment[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = node.textContent || ''
    return raw ? [{ kind: 'text', content: { text: raw }, raw }] : []
  }

  if (!(node instanceof HTMLElement)) {
    const raw = node.textContent || ''
    return raw ? [{ kind: 'text', content: { text: raw }, raw }] : []
  }

  const tag = node.tagName.toLowerCase()
  if (tag === 'br') return [{ kind: 'text', content: { text: '\n' }, raw: '\n' }]
  if (tag === 'input') {
    const raw = (node as HTMLInputElement).checked ? '[x]' : '[ ]'
    return [{ kind: 'text', content: { text: raw }, raw }]
  }
  if (tag === 'img') {
    const alt = (node as HTMLImageElement).alt
    const raw = alt ? `[${alt}]` : ''
    return raw ? [{ kind: 'text', content: { text: raw }, raw }] : []
  }
  if (node.classList.contains('katex')) {
    const formula = extractInlineLatex(node)
    if (!formula) {
      const raw = node.textContent?.trim() || ''
      return raw ? [{ kind: 'text', content: { text: raw }, raw }] : []
    }
    return [{ kind: 'math', formula, svg: null }]
  }

  const children = Array.from(node.childNodes)
    .flatMap((child) => collectInlineSegments(child, palette))
  if (!children.length) return []

  const style = inlineElementStyle(node, palette)
  if (!Object.keys(style).length) return children

  const styled: PdfInlineSegment[] = []
  let pending: PdfInlineTextSegment[] = []
  const flushText = () => {
    if (!pending.length) return
    const raw = pending.map((segment) => segment.raw).join('')
    const base = pending.length === 1
      ? pending[0].content
      : { text: pending.map((segment) => segment.content) } as Content
    styled.push({ kind: 'text', content: applyInlineStyle(base, style), raw })
    pending = []
  }

  children.forEach((segment) => {
    if (segment.kind === 'text') {
      pending.push(segment)
      return
    }
    flushText()
    styled.push(segment)
  })
  flushText()
  return styled
}

function inlineMathFit(svg: string): [number, number] {
  const viewBox = svg.match(/\bviewBox=(['"])([^'"]+)\1/i)?.[2]
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)
  const ratio = viewBox?.length === 4 && viewBox[2] > 0 && viewBox[3] > 0
    ? viewBox[2] / viewBox[3]
    : 4
  const height = 14
  return [Math.min(IMAGE_MAX_WIDTH_PT, Math.max(height, ratio * height)), height]
}

function inlineNodesToContent(
  nodes: Iterable<Node>,
  palette: PdfPalette,
  style?: string,
): Content {
  const inlineSegments = Array.from(nodes)
    .flatMap((node) => collectInlineSegments(node, palette))
  const hasMath = inlineSegments.some((segment) => segment.kind === 'math')
  if (!hasMath) {
    const text = Array.from(nodes)
      .map((node) => inlineContent(node, palette))
      .filter(Boolean)
    return { text, ...(style ? { style } : {}) } as Content
  }

  const segments: Content[] = inlineSegments.flatMap((segment) => {
    if (segment.kind === 'text') {
      if (!segment.raw.trim()) return []
      const text = asTextContent(segment.content)
      return [text ? { ...text, margin: [0, 0, 0, 0] } : { text: segment.raw }]
    }
    const math: PdfMathMarker = {
      nexusMath: {
        formula: segment.formula,
        display: false,
      },
      font: 'LXGW',
      alignment: 'left',
      margin: [0, 2, 0, 2],
    }
    return [math as unknown as Content]
  })

  return {
    stack: segments.length ? segments : [{ text: '' }],
    ...(style ? { style } : {}),
  } as Content
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
      const inline = inlineNodesToContent(directNodes, palette)
      const nested = nestedLists.map((list) => ({
        [list.tagName.toLowerCase() === 'ul' ? 'ul' : 'ol']: listItems(list, palette),
      }))
      const itemContent = typeof inline === 'object' && inline !== null && 'stack' in inline
        ? { stack: [inline] }
        : { text: asTextContent(inline)?.text || '' }
      return { ...itemContent, ...(nested.length ? { ul: nested } : {}) } as Content
    })
}

function tableToContent(table: HTMLTableElement, palette: PdfPalette): Content {
  const rows = Array.from(table.querySelectorAll('tr'))
  const body = rows.map((row) =>
    Array.from(row.children).map((cell) => {
      const cellContent = inlineNodesToContent(Array.from(cell.childNodes), palette)
      const cellStyle = cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell'
      if (typeof cellContent === 'object' && cellContent !== null && 'stack' in cellContent) {
        return { stack: [cellContent], style: cellStyle }
      }
      return { text: asTextContent(cellContent)?.text || '', style: cellStyle }
    })
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

function mermaidToBlocks(figure: Element, palette: PdfPalette): Content[] {
  const caption = cleanText(
    figure.querySelector('figcaption')?.textContent || 'Mermaid diagram'
  )
  const renderedSvg = figure.querySelector<SVGSVGElement>('svg')
  if (renderedSvg) {
    return [
      {
        svg: normalizePdfSvg(renderedSvg.outerHTML),
        fit: [IMAGE_MAX_WIDTH_PT, 320],
        font: 'LXGW',
        alignment: 'center',
        margin: [0, 6, 0, 2],
      },
      ...(caption
        ? [{ text: caption, style: 'figcaption' } as Content]
        : []),
    ]
  }

  const encodedSource = figure.getAttribute('data-md-mermaid-source') || ''
  const diagramFallback = decodeDataSource(encodedSource)
    || figure.querySelector('.md-mermaid__source code')?.textContent?.trim()
    || ''
  return diagramFallback
    ? [
        { text: caption, style: 'codeHeader', color: palette.accent },
        {
          text: diagramFallback,
          style: 'codeBlock',
          preserveLeadingSpaces: true,
        },
      ]
    : []
}

function editableBlockToBlocks(block: HTMLElement, palette: PdfPalette): Content[] {
  const kind = block.dataset.mdKind
  const raw = block.dataset.mdOriginal || block.dataset.mdCurrent || ''
  const pre = block.querySelector('pre')

  if (kind === 'math') {
    const formula = raw ? decodeDataSource(raw) : block.textContent?.trim() || ''
    if (!formula) return []

    const math: PdfMathMarker = {
      nexusMath: {
        formula,
        display: true,
      },
      fit: [IMAGE_MAX_WIDTH_PT, 160],
      font: 'LXGW',
      alignment: 'center',
      margin: [0, 7, 0, 9],
    }
    return [math as unknown as Content]
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

  if (classes.contains('md-mermaid')) {
    return mermaidToBlocks(element, palette)
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
        const heading: Content = inlineNodesToContent(Array.from(element.childNodes), palette, tag)
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
      return [inlineNodesToContent(Array.from(element.childNodes), palette, 'paragraph')]
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
      return [inlineNodesToContent(Array.from(element.childNodes), palette, 'figcaption')]
    default:
      return [inlineNodesToContent(Array.from(element.childNodes), palette, 'paragraph')]
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

function serializableDefinition(definition: TDocumentDefinitions): TDocumentDefinitions {
  const { header: _header, footer: _footer, ...rest } = definition
  return rest
}

function blobFromPdfBytes(bytes: ArrayBuffer): Blob {
  return new Blob([bytes], { type: 'application/pdf' })
}

function schedulePdfUrlRevoke(url: string, targetWindow?: Window | null): void {
  let revoked = false
  const revoke = () => {
    if (revoked) return
    revoked = true
    URL.revokeObjectURL(url)
  }

  // The PDF viewer owns the URL after navigation. Revoke it when that viewer
  // is closed, with a bounded timeout for browsers that do not expose its
  // lifecycle events through WindowProxy.
  if (targetWindow) {
    try {
      targetWindow.addEventListener('load', () => {
        targetWindow.addEventListener('pagehide', revoke, { once: true })
      }, { once: true })
    } catch {
      // Cross-origin PDF viewers may reject event listeners; the timeout below
      // still bounds the retained Blob.
    }
  }
  window.setTimeout(revoke, targetWindow ? 5 * 60_000 : 60_000)
}

function deliverPdfBlob(blob: Blob, title: string, options: PdfGenerationOptions): void {
  const url = URL.createObjectURL(blob)
  if (options.mode === 'preview') {
    if (!options.targetWindow || options.targetWindow.closed) {
      URL.revokeObjectURL(url)
      throw new Error('PDF preview window is unavailable.')
    }
    try {
      schedulePdfUrlRevoke(url, options.targetWindow)
      options.targetWindow.location.href = url
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
    return
  }

  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${sanitizeFilename(title)}.pdf`
    anchor.rel = 'noopener'
    anchor.click()
    schedulePdfUrlRevoke(url)
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export async function generateArticlePdf(
  source: PdfExportSource,
  siteTitle = 'Nexus',
  options: PdfGenerationOptions = {},
): Promise<void> {
  await ensureMermaidRendered(source.element)
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

  const workerPayload: PdfWorkerPayload = {
    definition: serializableDefinition(definition),
    title: source.title,
    siteTitle,
    palette,
  }

  if (typeof Worker !== 'undefined') {
    try {
      const bytes = await generatePdfInWorker(workerPayload, {
        targetWindow: options.mode === 'preview' ? options.targetWindow : null,
      })
      deliverPdfBlob(blobFromPdfBytes(bytes), source.title, options)
      return
    } catch (error) {
      if (!(error instanceof PdfWorkerUnavailableError)) throw error
      // CSP-restricted or legacy browsers may expose Worker but reject its
      // construction/message. Load the synchronous compatibility path only in
      // that case; normal browsers never pay for the heavy fallback chunk.
    }
  }

  // Older browsers without Worker support retain the original synchronous
  // implementation as a lazy compatibility path.
  const { generatePdfOnMain } = await import('./pdfMainFallback')
  await generatePdfOnMain(definition, sanitizeFilename(source.title), options)
}
