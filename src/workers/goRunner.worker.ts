import type { RunResult } from '../utils/codeRunner'

type GoWorkerRequest = {
  id: number
  type: 'run'
  source: string
  stdin: string
}

type GoWorkerResponse = {
  id: number
  type: 'result'
  result: Omit<RunResult, 'durationMs'> & { durationMs?: number }
} | {
  id: number
  type: 'error'
  message: string
  durationMs?: number
}

type GoRuntime = {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

type YaegiGlobal = typeof globalThis & {
  Go?: new () => GoRuntime
  runYaegiGo?: (source: string, stdin: string) => string
  fs?: GoWasmFs
}

type GoWasmFs = {
  writeSync?: (fd: number, buffer: Uint8Array) => number
  write?: (
    fd: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number | null,
    callback: (error: Error | null, bytesWritten?: number) => void
  ) => void
  read?: (
    fd: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number | null,
    callback: (error: Error | null, bytesRead?: number) => void
  ) => void
}

type FsRunCapture = {
  stdout: string
  stderr: string
}

const workerScope = globalThis as typeof globalThis & {
  postMessage(message: GoWorkerResponse): void
  onmessage: ((event: MessageEvent<GoWorkerRequest>) => void) | null
}
const yaegiGlobal = globalThis as YaegiGlobal
let initPromise: Promise<void> | null = null
let fsBridge: ReturnType<typeof installFsBridge> | null = null

function runnerAssetUrl(fileName: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return new URL(`${normalizedBase}runners/go/${fileName}`, workerScope.location.origin).toString()
}

async function instantiateWasm(go: GoRuntime): Promise<WebAssembly.Instance> {
  const wasmUrl = runnerAssetUrl('yaegi-runner.wasm')
  const response = await fetch(wasmUrl)
  if (!response.ok) {
    throw new Error(`无法加载 Go Runner WASM：${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (WebAssembly.instantiateStreaming && contentType.includes('application/wasm')) {
    const streamed = await WebAssembly.instantiateStreaming(response, go.importObject)
    return streamed.instance
  }

  const bytes = await response.arrayBuffer()
  const instantiated = await WebAssembly.instantiate(bytes, go.importObject)
  return instantiated.instance
}

async function waitForYaegiFunction(): Promise<void> {
  for (let index = 0; index < 50; index += 1) {
    if (typeof yaegiGlobal.runYaegiGo === 'function') return
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  throw new Error('Go Runner 初始化超时。')
}

function installFsBridge() {
  const fs = yaegiGlobal.fs
  if (!fs) throw new Error('Go WASM fs runtime 未加载。')

  const textDecoder = new TextDecoder()
  const textEncoder = new TextEncoder()
  const originalWriteSync = fs.writeSync?.bind(fs)
  const originalWrite = fs.write?.bind(fs)
  const originalRead = fs.read?.bind(fs)
  let active = false
  let stdout = ''
  let stderr = ''
  let stdin = new Uint8Array()
  let stdinOffset = 0

  fs.writeSync = (fd: number, buffer: Uint8Array) => {
    if (active && (fd === 1 || fd === 2)) {
      const text = textDecoder.decode(buffer)
      if (fd === 1) stdout += text
      else stderr += text
      return buffer.length
    }

    return originalWriteSync ? originalWriteSync(fd, buffer) : buffer.length
  }

  fs.write = (fd, buffer, offset, length, position, callback) => {
    if (active && (fd === 1 || fd === 2)) {
      const chunk = buffer.subarray(offset, offset + length)
      const bytesWritten = fs.writeSync ? fs.writeSync(fd, chunk) : chunk.length
      callback(null, bytesWritten)
      return
    }

    if (originalWrite) {
      originalWrite(fd, buffer, offset, length, position, callback)
      return
    }

    callback(new Error('write not implemented'))
  }

  fs.read = (fd, buffer, offset, length, position, callback) => {
    if (active && fd === 0) {
      const available = stdin.length - stdinOffset
      if (available <= 0) {
        callback(null, 0)
        return
      }

      const bytesRead = Math.min(length, available)
      buffer.set(stdin.subarray(stdinOffset, stdinOffset + bytesRead), offset)
      stdinOffset += bytesRead
      callback(null, bytesRead)
      return
    }

    if (originalRead) {
      originalRead(fd, buffer, offset, length, position, callback)
      return
    }

    callback(new Error('read not implemented'))
  }

  return {
    start(input: string) {
      active = true
      stdout = ''
      stderr = ''
      stdin = textEncoder.encode(input)
      stdinOffset = 0
    },
    finish(): FsRunCapture {
      active = false
      return { stdout, stderr }
    },
  }
}

async function ensureRunner(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    await import(/* @vite-ignore */ runnerAssetUrl('wasm_exec.js'))
    fsBridge = installFsBridge()
    const Go = yaegiGlobal.Go
    if (!Go) throw new Error('Go WASM runtime 未加载。')

    const go = new Go()
    const instance = await instantiateWasm(go)
    void go.run(instance)
    await waitForYaegiFunction()
  })()

  return initPromise
}

function fallbackResult(status: RunResult['status'], message: string, durationMs: number): RunResult {
  return {
    status,
    stdout: '',
    stderr: '',
    durationMs,
    message,
  }
}

workerScope.onmessage = async (event: MessageEvent<GoWorkerRequest>) => {
  const request = event.data
  if (!request || request.type !== 'run') return

  const startedAt = performance.now()
  try {
    await ensureRunner()

    if (typeof yaegiGlobal.runYaegiGo !== 'function') {
      throw new Error('Go Runner 未就绪。')
    }

    fsBridge?.start(request.stdin)
    const rawResult = yaegiGlobal.runYaegiGo(request.source, request.stdin)
    const captured = fsBridge?.finish() || { stdout: '', stderr: '' }
    const result = JSON.parse(rawResult) as Omit<RunResult, 'durationMs'> & { durationMs?: number }
    workerScope.postMessage({
      id: request.id,
      type: 'result',
      result: {
        ...result,
        stdout: `${captured.stdout}${result.stdout || ''}`,
        stderr: `${captured.stderr}${result.stderr || ''}`,
        durationMs: Math.round(performance.now() - startedAt),
      },
    })
  } catch (error) {
    fsBridge?.finish()
    const durationMs = Math.round(performance.now() - startedAt)
    workerScope.postMessage({
      id: request.id,
      type: 'result',
      result: fallbackResult('runtime_error', error instanceof Error ? error.message : String(error), durationMs),
    })
  }
}
