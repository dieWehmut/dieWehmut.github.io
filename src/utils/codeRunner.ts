import siteConfig from '../data/site/config'

export type RunStatus = 'success' | 'compile_error' | 'runtime_error' | 'timeout' | 'unsupported'
export type RunProgressStatus = 'queued' | 'validating' | 'compiling' | 'running'

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
  files?: RunCodeFile[]
  onProgress?: (progress: RunProgress) => void
}

export type RunCodeFile = {
  name: string
  content: string
}

export type RunProgress = {
  status: RunProgressStatus
  jobId?: string
  elapsedMs: number
}

const GO_SOURCE_LIMIT_BYTES = 32 * 1024
const GO_OUTPUT_LIMIT_BYTES = 64 * 1024
const DEFAULT_TIMEOUT_MS = 180000
const MIN_BACKEND_TIMEOUT_MS = 180000
const BACKEND_EXECUTABLE_PATH_PATTERN = /\/(?:var\/lib\/sandkasten\/laeufer|tmp\/sandkasten-laeufer[^/\s"']*)\/[0-9a-fA-F-]{36}\/src\/\.laeufer-bin\/main(?:\.exe)?/g
const BACKEND_SOURCE_PATH_PATTERN = /\/(?:var\/lib\/sandkasten\/laeufer|tmp\/sandkasten-laeufer[^/\s"']*)\/[0-9a-fA-F-]{36}\/src/g
const encoder = new TextEncoder()

function emptyResult(status: RunStatus, message: string, durationMs = 0): RunResult {
  return {
    status,
    stdout: '',
    stderr: '',
    durationMs,
    message,
  }
}

const LANGUAGE_ALIASES: Record<string, string> = {
  'golang': 'go',
  'rscript': 'r',
  'c++': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'hpp': 'cpp',
  'c#': 'csharp', 'cs': 'csharp',
  'f#': 'fsharp', 'fs': 'fsharp', 'fsx': 'fsharp',
  'js': 'javascript', 'node': 'javascript',
  'ts': 'typescript',
  'py': 'python', 'python3': 'python',
  'rb': 'ruby',
  'sh': 'bash', 'shell': 'bash',
  'asm': 'assembly', 'gas': 'assembly',
  'md': 'markdown',
  'dot': 'graphviz',
  'typ': 'typst',
  'vue': 'vue3', 'vuejs': 'vue3',
  'next': 'nextjs', 'next.js': 'nextjs',
  'kt': 'kotlin', 'kts': 'kotlin',
  'jl': 'julia',
  'ex': 'elixir', 'exs': 'elixir',
  'erl': 'erlang',
  'rkt': 'racket',
  'pl': 'prolog',
  'perl5': 'perl',
  'clj': 'clojure', 'cljs': 'clojure',
  'ml': 'ocaml',
  'sqlite': 'sql', 'sqlite3': 'sql',
  'matlab': 'octave',
  'v': 'vlang',
  'tailwind': 'tailwindcss', 'tailwind-css': 'tailwindcss',
  'gd': 'gdscript', 'godot': 'gdscript',
}

function normalizeLanguage(language: string): string {
  const normalized = language.trim().toLowerCase()
  return LANGUAGE_ALIASES[normalized] || normalized
}

function byteLength(value: string): number {
  return encoder.encode(value).byteLength
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

function validateGoSource(source: string): RunResult | null {
  if (byteLength(source) > GO_SOURCE_LIMIT_BYTES) {
    return emptyResult('unsupported', '源码超过 32 KB，已取消运行。')
  }

  const cleanSource = stripGoComments(source)
  if (!/(^|\n)\s*package\s+main\b/.test(cleanSource) || !/\bfunc\s+main\s*\(\s*\)/.test(cleanSource)) {
    return emptyResult('unsupported', '该代码块不是完整 Go 程序，请补全 package main 和 func main()。')
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

function redactBackendDetails(value: string): string {
  if (!value) return ''
  return value
    .replace(BACKEND_EXECUTABLE_PATH_PATTERN, './main')
    .replace(BACKEND_SOURCE_PATH_PATTERN, '/workspace')
}

function normalizeRunResult(result: Omit<RunResult, 'durationMs'> & { durationMs?: number }, durationMs: number): RunResult {
  const stdout = redactBackendDetails(result.stdout || '')
  const stderr = redactBackendDetails(result.stderr || '')
  const message = redactBackendDetails(result.message || '')

  return {
    status: result.status,
    stdout: truncateOutput(stdout),
    stderr: truncateOutput(stderr),
    durationMs: result.durationMs ?? durationMs,
    message,
  }
}

type BackendJobResponse = {
  jobId?: string
  status?: string
  stdout?: string
  stderr?: string
  compileStdout?: string
  compileStderr?: string
  durationMs?: number
  errorMessage?: string
}

type BackendErrorResponse = {
  error?: string
  message?: string
}

function backendStatusToProgressStatus(status: string | undefined): RunProgressStatus | null {
  switch (status) {
    case 'JOB_STATUS_QUEUED':
      return 'queued'
    case 'JOB_STATUS_VALIDATING':
      return 'validating'
    case 'JOB_STATUS_COMPILING':
      return 'compiling'
    case 'JOB_STATUS_RUNNING':
      return 'running'
    default:
      return null
  }
}

function isBackendTerminalStatus(status: string | undefined): boolean {
  switch (status) {
    case 'JOB_STATUS_SUCCEEDED':
    case 'JOB_STATUS_COMPILE_FAILED':
    case 'JOB_STATUS_RUNTIME_FAILED':
    case 'JOB_STATUS_TIME_LIMIT_EXCEEDED':
    case 'JOB_STATUS_MEMORY_LIMIT_EXCEEDED':
    case 'JOB_STATUS_OUTPUT_LIMIT_EXCEEDED':
    case 'JOB_STATUS_CANCELED':
    case 'JOB_STATUS_SYSTEM_ERROR':
      return true
    default:
      return false
  }
}

function backendStatusToRunStatus(status: string | undefined): RunStatus {
  switch (status) {
    case 'JOB_STATUS_SUCCEEDED':
      return 'success'
    case 'JOB_STATUS_COMPILE_FAILED':
      return 'compile_error'
    case 'JOB_STATUS_TIME_LIMIT_EXCEEDED':
      return 'timeout'
    case 'JOB_STATUS_QUEUED':
    case 'JOB_STATUS_VALIDATING':
    case 'JOB_STATUS_RUNNING':
    case 'JOB_STATUS_COMPILING':
      return 'timeout'
    case 'JOB_STATUS_RUNTIME_FAILED':
    case 'JOB_STATUS_MEMORY_LIMIT_EXCEEDED':
    case 'JOB_STATUS_OUTPUT_LIMIT_EXCEEDED':
    case 'JOB_STATUS_CANCELED':
    case 'JOB_STATUS_SYSTEM_ERROR':
      return 'runtime_error'
    default:
      return 'runtime_error'
  }
}

function normalizeBackendApiUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

async function readBackendBody(response: Response): Promise<BackendJobResponse | BackendErrorResponse | null> {
  return await response.json().catch(() => null) as BackendJobResponse | BackendErrorResponse | null
}

async function runInBackend(
  language: string,
  source: string,
  stdin: string,
  timeoutMs: number,
  files: RunCodeFile[] = [],
  onProgress?: (progress: RunProgress) => void
): Promise<RunResult> {
  const apiUrl = normalizeBackendApiUrl(siteConfig.codeRunner.backendApiUrl || '')
  if (!apiUrl) {
    return emptyResult('unsupported', '未配置 Sandkasten API 地址。')
  }

  const backendTimeoutMs = Math.max(timeoutMs, MIN_BACKEND_TIMEOUT_MS)
  const controller = new AbortController()
  const startedAt = performance.now()
  const timeoutId = window.setTimeout(() => controller.abort(), backendTimeoutMs + 5000)

  try {
    const headers: Record<string, string> = {
      'content-type': 'text/plain;charset=UTF-8',
    }
    if (siteConfig.codeRunner.backendToken) {
      headers.authorization = `Bearer ${siteConfig.codeRunner.backendToken}`
    }

    const submitResponse = await fetch(`${apiUrl}/v1/${encodeURIComponent(language)}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source,
        stdin,
        ...(files.length ? { files } : {}),
        wait: false,
      }),
      signal: controller.signal,
    })
    const body = await readBackendBody(submitResponse)
    const durationMs = Math.round(performance.now() - startedAt)

    if (!submitResponse.ok) {
      const message = body && 'message' in body && body.message
        ? body.message
        : `后端 API 返回 ${submitResponse.status}。`
      return emptyResult(submitResponse.status === 408 ? 'timeout' : 'runtime_error', message, durationMs)
    }

    let job = body as BackendJobResponse | null
    if (!job?.jobId && !isBackendTerminalStatus(job?.status)) {
      return emptyResult('runtime_error', '后端 API 没有返回有效任务。', durationMs)
    }

    const emitProgress = (nextJob: BackendJobResponse | null) => {
      const progressStatus = backendStatusToProgressStatus(nextJob?.status)
      if (!progressStatus) return
      onProgress?.({
        status: progressStatus,
        jobId: nextJob?.jobId,
        elapsedMs: Math.round(performance.now() - startedAt),
      })
    }

    emitProgress(job)

    let pollDelayMs = 80
    while (job?.jobId && !isBackendTerminalStatus(job.status)) {
      const elapsedMs = performance.now() - startedAt
      if (elapsedMs >= backendTimeoutMs) {
        return emptyResult('timeout', '后端任务仍在运行，请稍后重试。', Math.round(elapsedMs))
      }

      await sleep(Math.min(pollDelayMs, Math.max(0, backendTimeoutMs - elapsedMs)), controller.signal)
      const pollResponse = await fetch(`${apiUrl}/v1/jobs/${encodeURIComponent(job.jobId)}`, {
        headers,
        signal: controller.signal,
      })
      const pollBody = await readBackendBody(pollResponse)
      if (!pollResponse.ok) {
        const message = pollBody && 'message' in pollBody && pollBody.message
          ? pollBody.message
          : `后端 API 返回 ${pollResponse.status}。`
        return emptyResult('runtime_error', message, Math.round(performance.now() - startedAt))
      }
      job = pollBody as BackendJobResponse | null
      emitProgress(job)
      const nextElapsedMs = performance.now() - startedAt
      pollDelayMs = nextElapsedMs > 5000 ? 300 : nextElapsedMs > 1200 ? 160 : 80
    }

    if (!job) {
      return emptyResult('runtime_error', '后端 API 没有返回有效任务。', durationMs)
    }

    if (!isBackendTerminalStatus(job.status)) {
      return emptyResult('timeout', '后端任务仍在运行，请稍后重试。', durationMs)
    }

    const jobDurationMs = Math.round(performance.now() - startedAt)
    const status = backendStatusToRunStatus(job?.status)
    const stderr = [job?.compileStderr || '', job?.stderr || ''].filter(Boolean).join('\n')
    const message = status === 'timeout' && job?.status !== 'JOB_STATUS_TIME_LIMIT_EXCEEDED'
      ? '后端任务仍在运行，请稍后重试。'
      : job?.errorMessage || ''
    return normalizeRunResult({
      status,
      stdout: job?.stdout || '',
      stderr,
      durationMs: job?.durationMs || jobDurationMs,
      message,
    }, jobDurationMs)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return emptyResult('timeout', '后端运行超过时间限制，已终止等待。', durationMs)
    }
    return emptyResult('runtime_error', error instanceof Error ? error.message : String(error), durationMs)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function runCode(request: RunCodeRequest, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RunResult> {
  const language = normalizeLanguage(request.language)

  if (language === 'go') {
    const validationResult = validateGoSource(request.source)
    if (validationResult) return Promise.resolve(validationResult)
  }

  return runInBackend(
    language,
    request.source,
    request.stdin || '',
    timeoutMs,
    request.files || [],
    request.onProgress,
  )
}
