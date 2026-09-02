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
}

export type PdfWorkerRequest = {
  type: 'generate'
  payload: PdfWorkerPayload
}

export type PdfWorkerSuccess = {
  type: 'success'
  buffer: ArrayBuffer
}

export type PdfWorkerFailure = {
  type: 'error'
  message: string
}

export type PdfWorkerResponse = PdfWorkerSuccess | PdfWorkerFailure

// The marker is intentionally outside pdfmake's public Content union. It is
// replaced inside the worker before pdfmake preprocesses the definition.
export type PdfMathMarkerContent = Content & {
  nexusMath?: {
    formula: string
    display: boolean
  }
}
