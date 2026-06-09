export type RunStatus = 'success' | 'compile_error' | 'runtime_error' | 'timeout' | 'unsupported'

export type RunResult = {
  status: RunStatus
  stdout: string
  stderr: string
  durationMs: number
  message: string
}

export type RunCodeRequest = {
  language: string
  source: string
  stdin?: string
}

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

const GO_SOURCE_LIMIT_BYTES = 32 * 1024
const GO_OUTPUT_LIMIT_BYTES = 64 * 1024
const DEFAULT_TIMEOUT_MS = 8000
const GO_IMPORT_ALLOW_LIST = [
  'bufio',
  'container/list',
  'encoding/json',
  'errors',
  'fmt',
  'io',
  'log',
  'math',
  'math/cmplx',
  'math/rand',
  'os',
  'regexp',
  'sort',
  'strconv',
  'strings',
  'sync',
  'time',
]
const GO_IMPORT_ALLOW_SET = new Set(GO_IMPORT_ALLOW_LIST)
const encoder = new TextEncoder()

let goWorker: Worker | null = null
let nextRunId = 1
let goQueue: Promise<void> = Promise.resolve()

function emptyResult(status: RunStatus, message: string, durationMs = 0): RunResult {
  return {
    status,
    stdout: '',
    stderr: '',
    durationMs,
    message,
  }
}

function normalizeLanguage(language: string): string {
  return language.trim().toLowerCase()
}

function byteLength(value: string): number {
  return encoder.encode(value).byteLength
}

function normalizeGoSourceForRunner(source: string): string {
  let output = ''
  let index = 0
  let mode: 'code' | 'line-comment' | 'block-comment' | 'string' | 'raw-string' | 'rune' = 'code'
  let escaped = false

  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]

    if (mode === 'line-comment') {
      output += char
      if (char === '\n') mode = 'code'
      index += 1
      continue
    }

    if (mode === 'block-comment') {
      output += char
      if (char === '*' && next === '/') {
        output += next
        index += 2
        mode = 'code'
      } else {
        index += 1
      }
      continue
    }

    if (mode === 'string') {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        mode = 'code'
      }
      index += 1
      continue
    }

    if (mode === 'raw-string') {
      output += char
      if (char === '`') mode = 'code'
      index += 1
      continue
    }

    if (mode === 'rune') {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === "'") {
        mode = 'code'
      }
      index += 1
      continue
    }

    if (char === '/' && next === '/') {
      output += '//'
      index += 2
      mode = 'line-comment'
      continue
    }

    if (char === '/' && next === '*') {
      output += '/*'
      index += 2
      mode = 'block-comment'
      continue
    }

    if (char === '#') {
      output += '//'
      index += 1
      continue
    }

    output += char
    if (char === '"') mode = 'string'
    else if (char === '`') mode = 'raw-string'
    else if (char === "'") mode = 'rune'
    index += 1
  }

  return output
}

function stripGoComments(source: string): string {
  let output = ''
  let index = 0
  let mode: 'code' | 'line-comment' | 'block-comment' | 'string' | 'raw-string' | 'rune' = 'code'
  let escaped = false

  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]

    if (mode === 'line-comment') {
      if (char === '\n') {
        output += char
        mode = 'code'
      } else {
        output += ' '
      }
      index += 1
      continue
    }

    if (mode === 'block-comment') {
      if (char === '*' && next === '/') {
        output += '  '
        index += 2
        mode = 'code'
      } else {
        output += char === '\n' ? '\n' : ' '
        index += 1
      }
      continue
    }

    if (mode === 'string') {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        mode = 'code'
      }
      index += 1
      continue
    }

    if (mode === 'raw-string') {
      output += char
      if (char === '`') mode = 'code'
      index += 1
      continue
    }

    if (mode === 'rune') {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === "'") {
        mode = 'code'
      }
      index += 1
      continue
    }

    if (char === '/' && next === '/') {
      output += '  '
      index += 2
      mode = 'line-comment'
      continue
    }

    if (char === '/' && next === '*') {
      output += '  '
      index += 2
      mode = 'block-comment'
      continue
    }

    output += char
    if (char === '"') mode = 'string'
    else if (char === '`') mode = 'raw-string'
    else if (char === "'") mode = 'rune'
    index += 1
  }

  return output
}

function collectGoImports(source: string): string[] {
  const imports = new Set<string>()
  const cleanSource = stripGoComments(source)
  const importBlockPattern = /^\s*import\s*\(([\s\S]*?)^\s*\)/gm
  const importLinePattern = /^\s*import\s+(?:[._A-Za-z]\w*\s+)?"([^"\\]*(?:\\.[^"\\]*)*)"/gm
  let match: RegExpExecArray | null

  while ((match = importBlockPattern.exec(cleanSource)) !== null) {
    const block = match[1]
    const blockLinePattern = /(?:^|\n)\s*(?:[._A-Za-z]\w*\s+)?"([^"\\]*(?:\\.[^"\\]*)*)"/g
    let lineMatch: RegExpExecArray | null
    while ((lineMatch = blockLinePattern.exec(block)) !== null) {
      imports.add(lineMatch[1])
    }
  }

  while ((match = importLinePattern.exec(cleanSource)) !== null) {
    imports.add(match[1])
  }

  return Array.from(imports)
}

function validateGoSource(source: string): RunResult | null {
  if (byteLength(source) > GO_SOURCE_LIMIT_BYTES) {
    return emptyResult('unsupported', '源码超过 32 KB，已取消运行。')
  }

  const cleanSource = stripGoComments(source)
  if (!/(^|\n)\s*package\s+main\b/.test(cleanSource) || !/\bfunc\s+main\s*\(\s*\)/.test(cleanSource)) {
    return emptyResult('unsupported', '该代码块不是完整 Go 程序，请补全 package main 和 func main()。')
  }

  const unsupportedImports = collectGoImports(source).filter((importPath) => !GO_IMPORT_ALLOW_SET.has(importPath))
  if (unsupportedImports.length) {
    return emptyResult(
      'compile_error',
      `不支持导入 ${unsupportedImports.map((item) => `"${item}"`).join('、')}。当前 Go Runner 只允许：${GO_IMPORT_ALLOW_LIST.map((item) => `"${item}"`).join('、')}。`
    )
  }

  return null
}

function truncateOutput(value: string): string {
  if (byteLength(value) <= GO_OUTPUT_LIMIT_BYTES) return value

  let end = value.length
  while (end > 0 && byteLength(value.slice(0, end)) > GO_OUTPUT_LIMIT_BYTES) {
    end = Math.floor(end * 0.9)
  }

  return `${value.slice(0, end)}\n[output truncated at 64 KB]`
}

function normalizeRunResult(result: Omit<RunResult, 'durationMs'> & { durationMs?: number }, durationMs: number): RunResult {
  return {
    status: result.status,
    stdout: truncateOutput(result.stdout || ''),
    stderr: truncateOutput(result.stderr || ''),
    durationMs: result.durationMs ?? durationMs,
    message: result.message || '',
  }
}

function getGoWorker(): Worker {
  if (!goWorker) {
    goWorker = new Worker(new URL('../workers/goRunner.worker.ts', import.meta.url), { type: 'module' })
  }
  return goWorker
}

function terminateGoWorker(): void {
  goWorker?.terminate()
  goWorker = null
}

function runGoInWorker(source: string, stdin: string, timeoutMs: number): Promise<RunResult> {
  const id = nextRunId
  nextRunId += 1
  const worker = getGoWorker()
  const startedAt = performance.now()

  return new Promise((resolve) => {
    let settled = false
    let timeoutId = 0

    const settle = (result: RunResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      resolve(result)
    }

    const onMessage = (event: MessageEvent<GoWorkerResponse>) => {
      const message = event.data
      if (!message || message.id !== id) return

      const durationMs = Math.round(performance.now() - startedAt)
      if (message.type === 'result') {
        settle(normalizeRunResult(message.result, durationMs))
        return
      }

      settle(emptyResult('runtime_error', message.message || 'Go Runner 运行失败。', message.durationMs ?? durationMs))
    }

    const onError = (event: ErrorEvent) => {
      const durationMs = Math.round(performance.now() - startedAt)
      terminateGoWorker()
      settle(emptyResult('runtime_error', event.message || 'Go Runner 加载失败。', durationMs))
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)

    timeoutId = window.setTimeout(() => {
      const durationMs = Math.round(performance.now() - startedAt)
      terminateGoWorker()
      settle(emptyResult('timeout', '运行超过 8 秒，已终止。', durationMs))
    }, timeoutMs)

    try {
      const request: GoWorkerRequest = { id, type: 'run', source, stdin }
      worker.postMessage(request)
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt)
      terminateGoWorker()
      settle(emptyResult('runtime_error', error instanceof Error ? error.message : String(error), durationMs))
    }
  })
}

function enqueueGoRun(source: string, stdin: string, timeoutMs: number): Promise<RunResult> {
  const run = () => runGoInWorker(source, stdin, timeoutMs)
  const queuedRun = goQueue.then(run, run)
  goQueue = queuedRun.then(() => undefined, () => undefined)
  return queuedRun
}

export function runCode(request: RunCodeRequest, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RunResult> {
  const language = normalizeLanguage(request.language)

  if (language !== 'go') {
    return Promise.resolve(emptyResult('unsupported', `暂不支持运行 ${request.language || 'unknown'} 代码块。`))
  }

  const source = normalizeGoSourceForRunner(request.source)
  const validationResult = validateGoSource(source)
  if (validationResult) return Promise.resolve(validationResult)

  return enqueueGoRun(source, request.stdin || '', timeoutMs)
}
