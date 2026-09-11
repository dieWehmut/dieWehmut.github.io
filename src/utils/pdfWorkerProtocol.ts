import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'

export type PdfWorkerPalette = {
  accent: string
  secondary: string
  tertiary: string
  underline: string
}

export type PdfWorkerPayload = {
  definition: TDocumentDefinitions
  title: string
  siteTitle: string
  palette: PdfWorkerPalette
  images?: PdfWorkerImageSources
}

export type PdfWorkerMathWarmup = {
  formula: string
  display: boolean
}

export type PdfWorkerImageSource = {
  source: string
  width?: number
}

export type PdfWorkerImageSources = Record<string, PdfWorkerImageSource>

export type PdfWorkerRequest = {
  id: number
} & (
  | {
      type: 'generate'
      payload: PdfWorkerPayload
    }
  | {
      type: 'warm'
      formulas?: PdfWorkerMathWarmup[]
      images?: PdfWorkerImageSources
    }
)

export type PdfWorkerSuccess = {
  type: 'success'
  id: number
  buffer: ArrayBuffer
}

export type PdfWorkerReady = {
  type: 'ready'
  id: number
}

export type PdfWorkerFailure = {
  type: 'error'
  id: number
  message: string
}

export type PdfWorkerResponse = PdfWorkerSuccess | PdfWorkerReady | PdfWorkerFailure

// The marker is intentionally outside pdfmake's public Content union. It is
// replaced inside the worker before pdfmake preprocesses the definition.
export type PdfMathMarkerContent = Content & {
  nexusMath?: {
    formula: string
    display: boolean
  }
}
