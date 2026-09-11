import ArticlePdfWorker from '../workers/articlePdf.worker?worker'
import type {
  PdfWorkerImageSources,
  PdfWorkerMathWarmup,
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

type WorkerTask = {
  request: PdfWorkerRequest
  targetWindow?: Window | null
  resolve: (value: ArrayBuffer | void) => void
  reject: (reason?: unknown) => void
  timeout: number | null
  closedPoll: number | null
}

// Keep one worker alive for the lifetime of the page. Creating a worker for
// every preview reparses pdfmake/MathJax and reloads the 25 MB CJK font.
let sharedWorker: Worker | null = null
let activeTask: WorkerTask | null = null
const queuedTasks: WorkerTask[] = []
let nextRequestId = 0
let workerWarm = false
let warmPromise: Promise<void> | null = null

function clearTaskTimers(task: WorkerTask): void {
  if (task.timeout !== null) window.clearTimeout(task.timeout)
  if (task.closedPoll !== null) window.clearInterval(task.closedPoll)
  task.timeout = null
  task.closedPoll = null
}

function rejectQueued(reason: unknown): void {
  while (queuedTasks.length) {
    const task = queuedTasks.shift()
    if (!task) continue
    clearTaskTimers(task)
    task.reject(reason)
  }
}

function supersedeWarmupWork(): void {
  const reason = new Error('PDF warm-up superseded by a user export.')

  // Drop warm requests that have not started. They are optional work and must
  // never delay a click-triggered preview/download.
  for (let index = queuedTasks.length - 1; index >= 0; index -= 1) {
    const task = queuedTasks[index]
    if (task.request.type !== 'warm') continue
    queuedTasks.splice(index, 1)
    clearTaskTimers(task)
    task.reject(reason)
  }

  // Keep an in-flight warm request alive. It may already have loaded the font
  // and MathJax context; terminating it here would make the first click pay
  // that startup cost a second time. The prioritized generate request will be
  // pumped immediately after the active warm task reports ready.
}

function resetWorker(reason: unknown, activeReason: unknown = reason): void {
  const worker = sharedWorker
  sharedWorker = null
  workerWarm = false
  warmPromise = null
  if (worker) worker.terminate()

  const task = activeTask
  activeTask = null
  if (task) {
    clearTaskTimers(task)
    task.reject(activeReason)
  }
  rejectQueued(reason)
}

function cancelActiveTask(reason: Error): void {
  const task = activeTask
  if (!task) return

  activeTask = null
  clearTaskTimers(task)
  task.reject(reason)

  // A worker cannot cancel an in-flight pdfmake render. Terminate it before
  // pumping another queued request, otherwise the old async handler and the
  // next request can mutate the same pdfmake/MathJax context concurrently.
  const worker = sharedWorker
  sharedWorker = null
  workerWarm = false
  warmPromise = null
  worker?.terminate()
  pumpQueue()
}

function handleWorkerError(worker: Worker, error: unknown): void {
  // An old worker can dispatch a late error after it has been replaced. Do not
  // tear down a newer worker in that case.
  if (worker !== sharedWorker) return
  const message = error instanceof Error
    ? error.message
    : String(error || 'PDF worker failed.')
  resetWorker(
    new PdfWorkerUnavailableError(message, { cause: error }),
    new Error(message),
  )
}

function handleWorkerMessage(event: MessageEvent<PdfWorkerResponse>): void {
  const response = event.data
  const task = activeTask
  if (!task || response.id !== task.request.id) return

  activeTask = null
  clearTaskTimers(task)

  if (response.type === 'success') {
    task.resolve(response.buffer)
  } else if (response.type === 'ready') {
    workerWarm = true
    task.resolve()
  } else {
    // A document-level error does not necessarily poison the worker. Keep it
    // alive so the next preview can reuse the already-loaded runtime.
    task.reject(new Error(response.message))
  }

  pumpQueue()
}

function createWorker(): Worker {
  if (sharedWorker) return sharedWorker

  let worker: Worker
  try {
    worker = new ArticlePdfWorker()
  } catch (error) {
    throw new PdfWorkerUnavailableError(
      error instanceof Error ? error.message : String(error),
      { cause: error },
    )
  }

  sharedWorker = worker
  worker.onmessage = handleWorkerMessage
  worker.onerror = (event) => {
    handleWorkerError(worker, new Error(event.message || 'PDF worker failed.'))
  }
  worker.onmessageerror = () => {
    handleWorkerError(worker, new Error('PDF worker returned an unreadable response.'))
  }
  return worker
}

function pumpQueue(): void {
  if (activeTask || !queuedTasks.length) return

  let worker: Worker
  try {
    worker = createWorker()
  } catch (error) {
    const reason = error instanceof PdfWorkerUnavailableError
      ? error
      : new PdfWorkerUnavailableError(String(error), { cause: error })
    rejectQueued(reason)
    return
  }

  const task = queuedTasks.shift()
  if (!task) return
  if (task.targetWindow?.closed) {
    task.reject(new Error('PDF preview window was closed.'))
    pumpQueue()
    return
  }

  activeTask = task
  task.timeout = window.setTimeout(() => {
    const timeoutError = new Error('PDF worker timed out.')
    resetWorker(
      new PdfWorkerUnavailableError(timeoutError.message, { cause: timeoutError }),
      timeoutError,
    )
  }, WORKER_TIMEOUT_MS)

  if (task.targetWindow) {
    task.closedPoll = window.setInterval(() => {
      if (task.targetWindow?.closed && activeTask === task) {
        cancelActiveTask(new Error('PDF preview window was closed.'))
      }
    }, 250)
  }

  try {
    worker.postMessage(task.request)
  } catch (error) {
    const unavailable = new PdfWorkerUnavailableError(
      error instanceof Error ? error.message : String(error),
      { cause: error },
    )
    resetWorker(unavailable, unavailable)
  }
}

function enqueue(
  request: PdfWorkerRequest,
  targetWindow?: Window | null,
  prioritize = false,
): Promise<ArrayBuffer | void> {
  return new Promise((resolve, reject) => {
    const task = {
      request,
      targetWindow,
      resolve,
      reject,
      timeout: null,
      closedPoll: null,
    }
    if (prioritize) queuedTasks.unshift(task)
    else queuedTasks.push(task)
    pumpQueue()
  })
}

/**
 * Start the worker and load its fonts/MathJax tables before the first click.
 * Calling this repeatedly is cheap once the worker reports ready.
 */
export function warmPdfWorker(
  formulas: PdfWorkerMathWarmup[] = [],
  images: PdfWorkerImageSources = {},
): Promise<void> {
  const uniqueFormulas = formulas.filter((item, index, values) => {
    const key = `${item.display ? 'display' : 'inline'}:${item.formula.trim()}`
    return item.formula.trim() && values.findIndex((candidate) => (
      `${candidate.display ? 'display' : 'inline'}:${candidate.formula.trim()}` === key
    )) === index
  }).slice(0, 256)
  const imageEntries = Object.entries(images)
  if (!uniqueFormulas.length && !imageEntries.length && workerWarm) return Promise.resolve()
  if (!uniqueFormulas.length && !imageEntries.length && warmPromise) return warmPromise

  const requestId = ++nextRequestId
  const request: PdfWorkerRequest = {
    type: 'warm',
    id: requestId,
    ...(uniqueFormulas.length ? { formulas: uniqueFormulas } : {}),
    ...(imageEntries.length ? { images } : {}),
  }
  const promise = enqueue(request)
    .then(() => undefined)
  if (!uniqueFormulas.length && !imageEntries.length) {
    warmPromise = promise.then(
      () => {
        warmPromise = null
      },
      (error) => {
        warmPromise = null
        throw error
      },
    )
    return warmPromise
  }
  return promise
}

export function generatePdfInWorker(
  payload: PdfWorkerPayload,
  options: { targetWindow?: Window | null } = {},
): Promise<ArrayBuffer> {
  supersedeWarmupWork()
  const requestId = ++nextRequestId
  return enqueue(
    { type: 'generate', id: requestId, payload },
    options.targetWindow,
    true,
  ).then((buffer) => buffer as ArrayBuffer)
}

/** Release the shared worker on application teardown or test cleanup. */
export function disposePdfWorker(): void {
  resetWorker(new Error('PDF worker disposed.'))
}
