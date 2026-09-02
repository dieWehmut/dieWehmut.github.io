import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { mathjax } from 'mathjax-full/js/mathjax.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'
import { SVG as MathJaxSVG } from 'mathjax-full/js/output/svg.js'
import lxgwFontUrl from '../assets/fonts/LXGWWenKai-Regular.ttf'
import type { PdfGenerationOptions } from './exportPdf'

const IMAGE_MAX_WIDTH_PT = 460

type MathJaxContext = {
  adaptor: ReturnType<typeof liteAdaptor>
  document: ReturnType<typeof mathjax.document>
}

type PdfMathMarker = {
  nexusMath: {
    formula: string
    display: boolean
  }
  margin?: unknown
  fit?: [number, number]
}

let pdfFontsReady: Promise<void> | null = null
let mathJaxContext: MathJaxContext | null = null

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
  const marker = record.nexusMath as PdfMathMarker['nexusMath'] | undefined
  if (marker?.formula) {
    const svg = renderMathSvg(marker.formula, marker.display)
    if (svg) {
      const { nexusMath: _marker, ...rest } = record
      return {
        ...rest,
        svg,
        fit: marker.display ? (record.fit || [IMAGE_MAX_WIDTH_PT, 160]) : inlineMathFit(svg),
      }
    }

    return marker.display
      ? {
          text: marker.formula,
          style: 'mathBlock',
          preserveLeadingSpaces: true,
          margin: record.margin,
        }
      : {
          text: marker.formula,
          italics: true,
          color: '#555',
          margin: record.margin,
        }
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [key, resolveMathMarkers(entry)])
  )
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

export async function generatePdfOnMain(
  definition: TDocumentDefinitions,
  title: string,
  options: PdfGenerationOptions,
): Promise<void> {
  await ensurePdfFonts()
  const fallbackDefinition = resolveMathMarkers(definition) as TDocumentDefinitions
  const pdf = pdfMake.createPdf(fallbackDefinition)
  if (options.mode === 'preview') {
    if (!options.targetWindow || options.targetWindow.closed) {
      throw new Error('PDF preview window is unavailable.')
    }
    await pdf.open(options.targetWindow)
    return
  }

  await pdf.download(`${title}.pdf`)
}
