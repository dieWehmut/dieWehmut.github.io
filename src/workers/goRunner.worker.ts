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
  exited?: boolean
}

type YaegiGlobal = typeof globalThis & {
  Go?: new () => GoRuntime
  runYaegiGo?: (source: string, stdin: string) => string
  fs?: GoWasmFs
}

type GoWasmFs = {
  writeSync?: (fd: number, buffer: Uint8Array) => number
  open?: (path: string, flags: number, mode: number, callback: (error: Error | null, fd?: number) => void) => void
  close?: (fd: number, callback: (error: Error | null) => void) => void
  fstat?: (fd: number, callback: (error: Error | null, stat?: GoWasmFileStat) => void) => void
  stat?: (path: string, callback: (error: Error | null, stat?: GoWasmFileStat) => void) => void
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

type GoWasmFileStat = {
  dev: number
  ino: number
  mode: number
  nlink: number
  uid: number
  gid: number
  rdev: number
  size: number
  blksize: number
  blocks: number
  atimeMs: number
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
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
let activeGoRuntime: GoRuntime | null = null

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
  const files = new Map<string, Uint8Array>()
  const handles = new Map<number, { path: string; offset: number }>()
  let nextFd = 100
  let active = false
  let stdout = ''
  let stderr = ''
  let stdin = new Uint8Array()
  let stdinOffset = 0

  const makeStat = (size: number): GoWasmFileStat => ({
    dev: 1,
    ino: 1,
    mode: 0o100644,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    size,
    blksize: 4096,
    blocks: Math.ceil(size / 4096),
    atimeMs: Date.now(),
    mtimeMs: Date.now(),
    ctimeMs: Date.now(),
    birthtimeMs: Date.now(),
  })

  const missingFileError = (operation: string, path: string) => {
    const error = new Error(`ENOENT: no such file or directory, ${operation} '${path}'`)
    ;(error as Error & { code?: string }).code = 'ENOENT'
    return error
  }

  fs.open = (path, flags, _mode, callback) => {
    const normalizedPath = String(path)
    const fd = nextFd
    nextFd += 1
    const wantsWrite = Boolean(flags & 1) || Boolean(flags & 2)
    const wantsCreate = Boolean(flags & 64)
    const wantsTruncate = Boolean(flags & 512)

    if (!files.has(normalizedPath)) {
      if (!wantsCreate && !wantsWrite) {
        callback(missingFileError('open', normalizedPath))
        return
      }
      files.set(normalizedPath, new Uint8Array())
    } else if (wantsTruncate) {
      files.set(normalizedPath, new Uint8Array())
    }

    handles.set(fd, { path: normalizedPath, offset: 0 })
    callback(null, fd)
  }

  fs.close = (fd, callback) => {
    handles.delete(fd)
    callback(null)
  }

  fs.fstat = (fd, callback) => {
    const handle = handles.get(fd)
    if (!handle) {
      callback(new Error(`EBADF: bad file descriptor, fstat '${fd}'`))
      return
    }
    callback(null, makeStat(files.get(handle.path)?.length || 0))
  }

  fs.stat = (path, callback) => {
    const normalizedPath = String(path)
    const data = files.get(normalizedPath)
    if (!data) {
      callback(missingFileError('stat', normalizedPath))
      return
    }
    callback(null, makeStat(data.length))
  }

  fs.writeSync = (fd: number, buffer: Uint8Array) => {
    if (active && (fd === 1 || fd === 2)) {
      const text = textDecoder.decode(buffer)
      if (fd === 1) stdout += text
      else stderr += text
      return buffer.length
    }

    const handle = handles.get(fd)
    if (handle) {
      const previous = files.get(handle.path) || new Uint8Array()
      const nextSize = Math.max(previous.length, handle.offset + buffer.length)
      const next = new Uint8Array(nextSize)
      next.set(previous)
      next.set(buffer, handle.offset)
      files.set(handle.path, next)
      handle.offset += buffer.length
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

    const handle = handles.get(fd)
    if (handle) {
      const chunk = buffer.subarray(offset, offset + length)
      const previous = files.get(handle.path) || new Uint8Array()
      const writeOffset = position ?? handle.offset
      const nextSize = Math.max(previous.length, writeOffset + chunk.length)
      const next = new Uint8Array(nextSize)
      next.set(previous)
      next.set(chunk, writeOffset)
      files.set(handle.path, next)
      if (position === null) handle.offset += chunk.length
      callback(null, chunk.length)
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

    const handle = handles.get(fd)
    if (handle) {
      const data = files.get(handle.path) || new Uint8Array()
      const readOffset = position ?? handle.offset
      const available = data.length - readOffset
      if (available <= 0) {
        callback(null, 0)
        return
      }

      const bytesRead = Math.min(length, available)
      buffer.set(data.subarray(readOffset, readOffset + bytesRead), offset)
      if (position === null) handle.offset += bytesRead
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
  if (initPromise && !activeGoRuntime?.exited) return initPromise
  if (activeGoRuntime?.exited) {
    initPromise = null
    activeGoRuntime = null
    delete yaegiGlobal.runYaegiGo
  }

  initPromise = (async () => {
    await import(/* @vite-ignore */ runnerAssetUrl('wasm_exec.js'))
    if (!fsBridge) fsBridge = installFsBridge()
    const Go = yaegiGlobal.Go
    if (!Go) throw new Error('Go WASM runtime 未加载。')

    const go = new Go()
    activeGoRuntime = go
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
    if (typeof rawResult !== 'string' || !rawResult) {
      initPromise = null
      activeGoRuntime = null
      delete yaegiGlobal.runYaegiGo
      throw new Error('Go Runner did not return a result.')
    }
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
