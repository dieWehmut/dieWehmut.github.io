import type { ConsoleCommand, ParsedConsoleInput, SilentConsoleInput } from './types'

const FIXED_SEGMENTS = new Set([
  'about',
  'background',
  'capture',
  'classic',
  'color',
  'comment',
  'friends',
  'help',
  'home',
  'infra',
  'language',
  'mode',
  'project',
  'search',
  'tags',
  'theme',
  'terminal',
  'post',
  'note',
])

const REMOVED_COMMANDS = new Set([
  'agent',
  'list',
  'status',
  'permissions',
  'docker',
  'workspace',
  'model',
  // Retired from the command line. /archive and /notes remain routable pages,
  // reached from the CONTENT stat cards rather than by typing.
  'archive',
  'notes',
  'config',
  'doctor',
])

const MODE_VALUES = new Set(['classic', 'standard', 'console', 'terminal'])
const FIXED_CHILD_VALUES: Record<string, Set<string>> = {
  mode: MODE_VALUES,
  theme: new Set(['light', 'dark']),
  // 与 src/data/site/theme.ts 的 siteColorSchemeIds 手工同步。不能 import：本模块会被
  // scripts/test-console-command.mjs 转译后以 data: URL 动态加载，data URL 没有 base URL，
  // 任何相对 import 都会以 ERR_UNSUPPORTED_ESM_URL_SCHEME 失败。漂移由测试断言看住。
  color: new Set(['green', 'purple', 'pink', 'white', 'black']),
  background: new Set(['on', 'off']),
  language: new Set(['zh', 'zh_tw', 'en', 'ja', 'de', 'la']),
}

function silent(rawInput: string): SilentConsoleInput {
  return { kind: 'silent', rawInput }
}

function splitSuffix(value: string) {
  const queryIndex = value.indexOf('?')
  const hashIndex = value.indexOf('#')
  let pathEnd = value.length

  if (queryIndex >= 0) pathEnd = Math.min(pathEnd, queryIndex)
  if (hashIndex >= 0) pathEnd = Math.min(pathEnd, hashIndex)

  const path = value.slice(0, pathEnd)
  const suffix = value.slice(pathEnd)
  const suffixHashIndex = suffix.indexOf('#')
  const query = suffix.startsWith('?')
    ? suffix.slice(1, suffixHashIndex >= 0 ? suffixHashIndex : undefined)
    : ''
  const hash = suffixHashIndex >= 0 ? suffix.slice(suffixHashIndex) : ''

  return { path, query, hash }
}

export function parseConsoleInput(input: string): ParsedConsoleInput {
  const rawInput = typeof input === 'string' ? input : String(input ?? '')
  const trimmed = rawInput.trim()
  if (!trimmed || !trimmed.startsWith('/')) return silent(rawInput)

  try {
    const { path, query, hash } = splitSuffix(trimmed)
    const decodedSegments = path
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))

    const head = decodedSegments[0]?.toLowerCase() || ''
    if (REMOVED_COMMANDS.has(head)) return silent(rawInput)

    const segments = decodedSegments.map((segment, index) => {
      const lower = segment.toLowerCase()

      // Fixed command vocabulary is case-insensitive. Dynamic IDs and tags
      // are intentionally untouched, even when they resemble a command.
      if (index === 0 && FIXED_SEGMENTS.has(lower)) return lower
      if (index === 1 && FIXED_CHILD_VALUES[head]?.has(lower)) return lower
      return segment
    })

    const command: ConsoleCommand = {
      kind: 'command',
      rawInput,
      segments,
      canonicalInput: '/',
      query,
      hash,
    }
    command.canonicalInput = toConsoleRoutePath(command)
    return command
  } catch {
    return silent(rawInput)
  }
}

export function toConsoleRoutePath(input: ConsoleCommand | ParsedConsoleInput): string {
  if (input.kind !== 'command') return ''
  const path = input.segments.length
    ? `/${input.segments.map((segment) => encodeURIComponent(segment)).join('/')}`
    : '/'
  return `${path}${input.query ? `?${input.query}` : ''}${input.hash || ''}`
}
