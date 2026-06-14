import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const docPath = process.env.SANDKASTEN_DOC_PATH ||
  path.join(root, 'src/data/docs/posts/testSandkasten.md')
const apiUrl = (process.env.VITE_CODE_RUNNER_API_URL || process.env.CODE_RUNNER_API_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
const token = process.env.VITE_CODE_RUNNER_API_TOKEN || process.env.SANDKASTEN_API_TOKEN || ''
const waitTimeoutMs = Number(process.env.SANDKASTEN_DOC_SMOKE_WAIT_TIMEOUT_MS || 180000)

const languageAliases = {
  golang: 'go',
  rscript: 'r',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  'f#': 'fsharp',
  fs: 'fsharp',
  fsx: 'fsharp',
  js: 'javascript',
  node: 'javascript',
  ts: 'typescript',
  py: 'python',
  python3: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  asm: 'assembly',
  gas: 'assembly',
  md: 'markdown',
  dot: 'graphviz',
  typ: 'typst',
  vue: 'vue3',
  vuejs: 'vue3',
  next: 'nextjs',
  'next.js': 'nextjs',
  kt: 'kotlin',
  kts: 'kotlin',
  jl: 'julia',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  rkt: 'racket',
  pl: 'prolog',
  perl5: 'perl',
  clj: 'clojure',
  cljs: 'clojure',
  ml: 'ocaml',
  sqlite: 'sql',
  sqlite3: 'sql',
  matlab: 'octave',
  v: 'vlang',
  tailwind: 'tailwindcss',
  'tailwind-css': 'tailwindcss',
  gd: 'gdscript',
  godot: 'gdscript',
}

const selected = new Set(
  (process.env.SANDKASTEN_DOC_SMOKE_LANGUAGES || '')
    .split(/[,\s]+/)
    .map((item) => normalizeLanguage(item))
    .filter(Boolean),
)

const terminalStatuses = new Set([
  'JOB_STATUS_SUCCEEDED',
  'JOB_STATUS_COMPILE_FAILED',
  'JOB_STATUS_RUNTIME_FAILED',
  'JOB_STATUS_TIME_LIMIT_EXCEEDED',
  'JOB_STATUS_MEMORY_LIMIT_EXCEEDED',
  'JOB_STATUS_OUTPUT_LIMIT_EXCEEDED',
  'JOB_STATUS_CANCELED',
  'JOB_STATUS_SYSTEM_ERROR',
])

const knownRunners = new Set([
  'go', 'assembly', 'c', 'cpp', 'rust', 'zig', 'vlang', 'nim', 'pascal', 'fortran',
  'python', 'javascript', 'typescript', 'ruby', 'perl', 'php', 'lua', 'r', 'julia', 'dart', 'crystal', 'bash',
  'java', 'kotlin', 'scala', 'clojure', 'gleam',
  'csharp', 'fsharp',
  'haskell', 'ocaml', 'elixir', 'erlang', 'racket', 'lean4', 'coq', 'prolog',
  'html', 'css', 'scss', 'tsx', 'vue3', 'qml', 'nextjs',
  'tailwindcss',
  'markdown', 'mdx', 'latex', 'typst', 'graphviz',
  'octave',
  'sql',
  'gdscript', 'nextflow', 'wdl',
  'mojo', 'cangjie', 'swift',
])

function normalizeLanguage(language) {
  const normalized = String(language || '').trim().toLowerCase()
  return languageAliases[normalized] || normalized
}

function stripFenceMetaQuotes(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '')
}

function parseFenceInfo(info) {
  const tokens = String(info || '').trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return { language: '', fileName: '' }

  const firstToken = tokens[0]
  const firstLower = firstToken.toLowerCase()
  if (firstLower === 'file') {
    const fileName = stripFenceMetaQuotes(tokens[1] || '')
    const explicitLang = tokens
      .slice(2)
      .map((token) => token.match(/^(?:lang|language)=(.+)$/i)?.[1] || '')
      .find(Boolean)
    return { language: explicitLang ? stripFenceMetaQuotes(explicitLang) : '', fileName }
  }

  const fileToken = tokens
    .slice(1)
    .map((token) => token.match(/^(?:file|filename|path)=(.+)$/i)?.[1] || '')
    .find(Boolean)

  return {
    language: firstToken,
    fileName: fileToken ? stripFenceMetaQuotes(fileToken) : '',
  }
}

function parseFences(source) {
  const entries = []
  let title = ''
  let inFence = false
  let marker = ''
  let info = ''
  let body = []

  for (const line of source.split(/\n/)) {
    const heading = line.match(/^###\s+(.+)$/)
    if (!inFence && heading) title = heading[1].trim()

    const fence = line.match(/^(```|~~~)(.*)$/)
    if (!fence) {
      if (inFence) body.push(line)
      continue
    }

    if (!inFence) {
      inFence = true
      marker = fence[1]
      info = fence[2].trim()
      body = []
      continue
    }

    if (fence[1] === marker) {
      const parsed = parseFenceInfo(info)
      const rawLanguage = parsed.language.toLowerCase()
      const language = normalizeLanguage(rawLanguage)
      entries.push({
        title,
        rawLanguage,
        language,
        fileName: parsed.fileName,
        source: body.join('\n'),
      })
      inFence = false
      continue
    }

    body.push(line)
  }

  return entries
}

function collectAdjacentFiles(entries, index) {
  const files = []
  const title = entries[index].title

  for (let cursor = index - 1; cursor >= 0 && entries[cursor].title === title && entries[cursor].fileName; cursor -= 1) {
    files.unshift({ name: entries[cursor].fileName, content: entries[cursor].source })
  }
  for (let cursor = index + 1; cursor < entries.length && entries[cursor].title === title && entries[cursor].fileName; cursor += 1) {
    files.push({ name: entries[cursor].fileName, content: entries[cursor].source })
  }

  return files
}

function outputLooksRenderable(entry, stdout) {
  switch (entry.language) {
    case 'html':
    case 'markdown':
    case 'mdx':
    case 'tsx':
    case 'vue3':
    case 'nextjs':
      return /<[^>]+>/.test(stdout)
    case 'graphviz':
    case 'typst':
      return stdout.includes('<svg')
    case 'css':
    case 'scss':
    case 'tailwindcss':
      return stdout.includes('{') || stdout.includes('--tw-')
    case 'latex':
      return stdout.includes('latex compiled')
    default:
      return true
  }
}

function summarize(value, limit = 180) {
  const normalized = String(value || '').replace(/\0/g, '\\0').replace(/\n/g, '\\n')
  return JSON.stringify(normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readJson(response) {
  return await response.json().catch(() => null)
}

async function runEntry(entry, files) {
  const headers = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`

  const response = await fetch(`${apiUrl}/v1/${encodeURIComponent(entry.language)}/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: entry.source,
      files,
      wait: true,
      waitTimeoutMs,
    }),
  })

  let body = await readJson(response)
  if (!response.ok) return { response, body }

  for (let attempt = 0; body?.jobId && !terminalStatuses.has(body.status) && attempt < 360; attempt += 1) {
    await sleep(500)
    const pollResponse = await fetch(`${apiUrl}/v1/jobs/${encodeURIComponent(body.jobId)}`, { headers })
    body = await readJson(pollResponse)
    if (!pollResponse.ok) return { response: pollResponse, body }
  }

  return { response, body }
}

const entries = parseFences(fs.readFileSync(docPath, 'utf8'))
const runnableEntries = entries
  .map((entry, index) => ({ entry, index, files: collectAdjacentFiles(entries, index) }))
  .filter(({ entry }) => !entry.fileName && knownRunners.has(entry.language))
  .filter(({ entry }) => selected.size === 0 || selected.has(entry.language))

if (runnableEntries.length === 0) {
  throw new Error(`No runnable Sandkasten fences found in ${docPath}`)
}

let failures = 0
for (const [runIndex, item] of runnableEntries.entries()) {
  const { entry, files } = item
  const { response, body } = await runEntry(entry, files)
  const status = body?.status || `HTTP_${response.status}`
  const stdout = String(body?.stdout || '')
  const stderr = [body?.compileStderr || '', body?.stderr || '', body?.errorMessage || ''].filter(Boolean).join('\n')
  const ok = response.ok && status === 'JOB_STATUS_SUCCEEDED' && outputLooksRenderable(entry, stdout)

  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${String(runIndex + 1).padStart(2, '0')}/${runnableEntries.length} ` +
    `${entry.title} [${entry.rawLanguage || entry.language}->${entry.language}] ${status} ` +
    `stdout=${summarize(stdout)}${stderr ? ` stderr=${summarize(stderr, 240)}` : ''}`,
  )

  if (!ok) failures += 1
}

console.log(`RESULT total=${runnableEntries.length} failures=${failures} api=${apiUrl}`)
process.exitCode = failures ? 1 : 0
