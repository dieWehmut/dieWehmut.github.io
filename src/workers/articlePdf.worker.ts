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
  PdfWorkerRequest,
  PdfWorkerResponse,
  PdfWorkerSuccess,
} from '../utils/pdfWorkerProtocol'

const IMAGE_MAX_WIDTH_PT = 460

type MathJaxContext = {
  adaptor: ReturnType<typeof liteAdaptor>
  document: ReturnType<typeof mathjax.document>
}

let mathJaxContext: MathJaxContext | null = null
let fontsReady: Promise<void> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
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
  try {
    const context = getMathJaxContext()
    context.document.reset()
    const converted = context.document.convert(normalized, { display })
    const svg = context.adaptor.tags(converted, 'svg')[0]
    return svg ? normalizePdfSvg(context.adaptor.outerHTML(svg)) : null
  } catch {
    return null
  }
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

function resolveMathMarkers(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => resolveMathMarkers(entry))
  if (!value || typeof value !== 'object') return value

  const record = value as Record<string, unknown>
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
    Object.entries(record).map(([key, entry]) => [key, resolveMathMarkers(entry)])
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

async function generate(payload: PdfWorkerRequest['payload']): Promise<ArrayBuffer> {
  await ensureFonts()
  const resolved = resolveMathMarkers(payload.definition) as Record<string, unknown>
  const definition = addPageChrome(resolved, payload.title, payload.siteTitle, payload.palette)
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

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<PdfWorkerRequest>) => void) | null
  postMessage: (message: PdfWorkerResponse, transfer?: Transferable[]) => void
}

workerScope.onmessage = async (event) => {
  if (event.data?.type !== 'generate') return
  try {
    const buffer = await generate(event.data.payload)
    const response: PdfWorkerSuccess = { type: 'success', buffer }
    workerScope.postMessage(response, [buffer])
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
