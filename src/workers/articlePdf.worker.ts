import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { mathjax } from 'mathjax-full/js/mathjax.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'
import { SVG as MathJaxSVG } from 'mathjax-full/js/output/svg.js'
import lxgwFontUrl from '../assets/fonts/LXGWWenKai-Regular.ttf'
import type {
  PdfWorkerImageSources,
  PdfWorkerMathWarmup,
  PdfWorkerPayload,
  PdfWorkerRequest,
  PdfWorkerResponse,
  PdfWorkerSuccess,
} from '../utils/pdfWorkerProtocol'

const IMAGE_MAX_WIDTH_PT = 460
const MATH_SVG_CACHE_LIMIT = 256
const PDF_IMAGE_CACHE_LIMIT = 24
const PDF_IMAGE_REENCODE_THRESHOLD = 768 * 1024
const PDF_IMAGE_MAX_DIMENSION = 1600

type MathJaxContext = {
  adaptor: ReturnType<typeof liteAdaptor>
  document: ReturnType<typeof mathjax.document>
}

let mathJaxContext: MathJaxContext | null = null
let fontsReady: Promise<void> | null = null
const mathSvgCache = new Map<string, string | null>()
type PdfImageAsset = { dataUrl: string; width: number }
const pdfImageAssetCache = new Map<string, Promise<PdfImageAsset | null>>()

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

async function loadPdfImageAsset(
  source: string,
  hintedWidth = 0,
): Promise<PdfImageAsset | null> {
  try {
    const response = await fetch(source)
    if (!response.ok) return null
    let blob = await response.blob()
    let width = hintedWidth || 0
    let bitmap: ImageBitmap | null = null

    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(blob)
      } catch {
        // Some browsers cannot decode SVG/AVIF/TIFF/GIF in ImageBitmap. The
        // original response is still usable, so skip the optional probe.
      }
      if (bitmap) {
        width = bitmap.width || width
        if (
          blob.size > PDF_IMAGE_REENCODE_THRESHOLD
          && /^image\/(?:png|bmp|tiff?)$/i.test(blob.type)
          && typeof OffscreenCanvas !== 'undefined'
        ) {
          try {
            const scale = Math.min(1, PDF_IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
            const canvas = new OffscreenCanvas(
              Math.max(1, Math.round(bitmap.width * scale)),
              Math.max(1, Math.round(bitmap.height * scale)),
            )
            const context = canvas.getContext('2d')
            if (context) {
              context.fillStyle = '#fff'
              context.fillRect(0, 0, canvas.width, canvas.height)
              context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
              const compressed = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.84 })
              if (compressed.size < blob.size) blob = compressed
            }
          } catch {
            // Compression is optional; retain the original bytes on failure.
          }
        }
        bitmap.close()
      }
    }

    const dataUrl = `data:${blob.type || 'application/octet-stream'};base64,${arrayBufferToBase64(await blob.arrayBuffer())}`
    return { dataUrl, width: width || 460 }
  } catch {
    return null
  }
}

function cachedPdfImageAsset(
  source: string,
  hintedWidth = 0,
): Promise<PdfImageAsset | null> {
  const existing = pdfImageAssetCache.get(source)
  if (existing) {
    pdfImageAssetCache.delete(source)
    pdfImageAssetCache.set(source, existing)
    return existing
  }

  const promise = loadPdfImageAsset(source, hintedWidth).then((asset) => {
    if (!asset) pdfImageAssetCache.delete(source)
    return asset
  })
  pdfImageAssetCache.set(source, promise)
  while (pdfImageAssetCache.size > PDF_IMAGE_CACHE_LIMIT) {
    const oldest = pdfImageAssetCache.keys().next().value
    if (oldest === undefined) break
    pdfImageAssetCache.delete(oldest)
  }
  return promise
}

async function preparePdfImages(sources: PdfWorkerImageSources = {}): Promise<Record<string, string>> {
  const entries = Object.entries(sources)
  const loaded = await Promise.all(entries.map(async ([key, descriptor]) => {
    const asset = await cachedPdfImageAsset(descriptor.source, descriptor.width)
    return asset ? [key, asset.dataUrl] as const : null
  }))
  return Object.fromEntries(loaded.filter((entry): entry is readonly [string, string] => Boolean(entry)))
}

function normalizePdfSvg(svg: string): string {
  return svg
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z-]+=(['"]).*?\1/gi, '')
    .replace(/font-family=(['"])(?:serif|sans-serif|monospace)\1/gi, 'font-family="LXGW"')
}

function getMathJaxContext(): MathJaxContext {
  if (mathJaxContext) return mathJaxContext
  const adaptor = liteAdaptor()
  RegisterHTMLHandler(adaptor)
  const inputJax = new TeX({ packages: AllPackages })
  const outputJax = new MathJaxSVG({ fontCache: 'none' })
  mathJaxContext = {
    adaptor,
    document: mathjax.document('', { InputJax: inputJax, OutputJax: outputJax }),
  }
  return mathJaxContext
}

function renderMathSvg(formula: string, display: boolean): string | null {
  const normalized = formula.trim()
  if (!normalized) return null
  const cacheKey = `${display ? 'display' : 'inline'}:${normalized}`
  if (mathSvgCache.has(cacheKey)) return mathSvgCache.get(cacheKey) || null

  let result: string | null = null
  try {
    const context = getMathJaxContext()
    context.document.reset()
    const converted = context.document.convert(normalized, { display })
    const svg = context.adaptor.tags(converted, 'svg')[0]
    // MathJax reports TeX errors as merror nodes instead of throwing. Their
    // diagnostic SVG can contain unescaped XML (for example "Misplaced &").
    // Keep the original formula through the existing text fallback.
    const hasMathError = context.adaptor.tags(converted, 'g')
      .some((node) => context.adaptor.getAttribute(node, 'data-mml-node') === 'merror')
    result = svg && !hasMathError ? normalizePdfSvg(context.adaptor.outerHTML(svg)) : null
  } catch {
    result = null
  }

  mathSvgCache.set(cacheKey, result)
  if (mathSvgCache.size > MATH_SVG_CACHE_LIMIT) {
    const oldestKey = mathSvgCache.keys().next().value
    if (oldestKey !== undefined) mathSvgCache.delete(oldestKey)
  }
  return result
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

function resolveMathMarkers(
  value: unknown,
  availableImages: Record<string, string> = {},
): unknown {
  if (Array.isArray(value)) return value.map((entry) => resolveMathMarkers(entry, availableImages))
  if (!value || typeof value !== 'object') return value

  const record = value as Record<string, unknown>
  const imageMarker = record.nexusImage as { key?: string; alt?: string } | undefined
  if (imageMarker?.key) {
    if (!Object.prototype.hasOwnProperty.call(availableImages, imageMarker.key)) {
      return imageMarker.alt ? { text: `[${imageMarker.alt}]`, style: 'paragraph' } : ''
    }
    const { nexusImage: _marker, ...rest } = record
    return {
      ...rest,
      image: imageMarker.key,
    }
  }

  const marker = record.nexusMath as { formula?: string; display?: boolean } | undefined
  if (marker?.formula) {
    const display = Boolean(marker.display)
    const { nexusMath: _marker, ...rest } = record
    const svg = renderMathSvg(marker.formula, display)
    if (svg) {
      return {
        ...rest,
        svg,
        fit: display ? (rest.fit || [IMAGE_MAX_WIDTH_PT, 160]) : inlineMathFit(svg),
      }
    }

    return display
      ? {
          text: marker.formula,
          style: 'mathBlock',
          preserveLeadingSpaces: true,
          margin: rest.margin,
        }
      : {
          text: marker.formula,
          italics: true,
          color: '#555',
          margin: rest.margin,
        }
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [key, resolveMathMarkers(entry, availableImages)])
  )
}

function addPageChrome(
  definition: Record<string, unknown>,
  title: string,
  siteTitle: string,
  palette: { accent: string; secondary: string; tertiary: string },
): Record<string, unknown> {
  const truncatedTitle = title.length > 42 ? `${title.slice(0, 42)}...` : title
  return {
    ...definition,
    header: (_currentPage: number, _pageCount: number, pageSize: { width: number }) => ({
      stack: [
        {
          canvas: [{
            type: 'rect',
            x: 0,
            y: 0,
            w: pageSize.width,
            h: 4,
            color: palette.secondary,
          }],
        },
        {
          columns: [
            { text: siteTitle, fontSize: 8, color: '#999' },
            { text: truncatedTitle, fontSize: 8, color: palette.accent, alignment: 'right' },
          ],
          margin: [0, 6, 0, 0],
        },
      ],
    }),
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'right',
      margin: [0, 0, 48, 0],
      color: palette.tertiary,
      fontSize: 8.5,
    }),
  }
}

async function ensureFonts(): Promise<void> {
  fontsReady ||= (async () => {
    try {
      pdfMake.addVirtualFileSystem(pdfFonts as never)
    } catch {
      ;(pdfMake as unknown as { vfs?: Record<string, string> }).vfs = pdfFonts as never
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
  await fontsReady
}

async function generate(payload: PdfWorkerPayload): Promise<ArrayBuffer> {
  await ensureFonts()
  const imageAssets = await preparePdfImages(payload.images)
  const resolved = resolveMathMarkers(payload.definition, imageAssets) as Record<string, unknown>
  const definition = addPageChrome(
    Object.keys(imageAssets).length
      ? { ...resolved, images: imageAssets }
      : resolved,
    payload.title,
    payload.siteTitle,
    payload.palette,
  )
  const document = pdfMake.createPdf(definition as never)
  const buffer = await document.getBuffer()
  const bytes = buffer instanceof Uint8Array
    ? buffer
    : new Uint8Array(buffer as ArrayBuffer)
  const transferable = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? bytes.buffer
    : bytes.slice().buffer
  return transferable as ArrayBuffer
}

async function warm(
  formulas: PdfWorkerMathWarmup[] = [],
  images: PdfWorkerImageSources = {},
): Promise<void> {
  await ensureFonts()
  await preparePdfImages(images)
  // Construct the MathJax document while the preview window is still showing
  // its lightweight loading state. Formula conversion can then reuse the
  // parser/font tables on the first real request.
  getMathJaxContext()
  const seen = new Set<string>()
  formulas.slice(0, 256).forEach(({ formula, display }) => {
    const normalized = String(formula || '').trim()
    if (!normalized) return
    const key = `${display ? 'display' : 'inline'}:${normalized}`
    if (seen.has(key)) return
    seen.add(key)
    renderMathSvg(normalized, Boolean(display))
  })
}

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<PdfWorkerRequest>) => void) | null
  postMessage: (message: PdfWorkerResponse, transfer?: Transferable[]) => void
}

workerScope.onmessage = async (event) => {
  const request = event.data
  if (!request || (request.type !== 'generate' && request.type !== 'warm')) return
  try {
    if (request.type === 'warm') {
      await warm(request.formulas, request.images)
      workerScope.postMessage({ type: 'ready', id: request.id })
      return
    }

    const buffer = await generate(request.payload)
    const response: PdfWorkerSuccess = { type: 'success', id: request.id, buffer }
    workerScope.postMessage(response, [buffer])
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
