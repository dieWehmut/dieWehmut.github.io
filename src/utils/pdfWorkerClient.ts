import ArticlePdfWorker from '../workers/articlePdf.worker?worker'
import type {
  PdfWorkerPayload,
  PdfWorkerRequest,
  PdfWorkerResponse,
} from './pdfWorkerProtocol'

const WORKER_TIMEOUT_MS = 60_000

export class PdfWorkerUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PdfWorkerUnavailableError'
  }
}

export function generatePdfInWorker(
  payload: PdfWorkerPayload,
  options: { targetWindow?: Window | null } = {},
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = new ArticlePdfWorker()
    } catch (error) {
      reject(new PdfWorkerUnavailableError(
        error instanceof Error ? error.message : String(error),
        { cause: error },
      ))
      return
    }

    let settled = false
    let closedPoll: number | null = null
    let timeout = 0

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (closedPoll !== null) window.clearInterval(closedPoll)
      worker.terminate()
      callback()
    }

    timeout = window.setTimeout(() => {
      finish(() => reject(new Error('PDF worker timed out.')))
    }, WORKER_TIMEOUT_MS)

    if (options.targetWindow) {
      closedPoll = window.setInterval(() => {
        if (options.targetWindow?.closed) {
          finish(() => reject(new Error('PDF preview window was closed.')))
        }
      }, 250)
    }

    worker.onmessage = (event: MessageEvent<PdfWorkerResponse>) => {
      const response = event.data
      if (response.type === 'success') {
        finish(() => resolve(response.buffer))
      } else {
        finish(() => reject(new Error(response.message)))
      }
    }
    worker.onerror = (event) => {
      finish(() => reject(new Error(event.message || 'PDF worker failed.')))
    }
    worker.onmessageerror = () => {
      finish(() => reject(new Error('PDF worker returned an unreadable response.')))
    }

    const request: PdfWorkerRequest = { type: 'generate', payload }
    try {
      worker.postMessage(request)
    } catch (error) {
      finish(() => reject(new PdfWorkerUnavailableError(
        error instanceof Error ? error.message : String(error),
        { cause: error },
      )))
    }
  })
}
