import type { ConsoleCommand, ParsedConsoleInput, SilentConsoleInput } from './types'

const FIXED_SEGMENTS = new Set([
  'about',
  'background',
  'capture',
  'classic',
  'color',
  'comment',
  'export',
  'friends',
  'help',
  'home',
  'infra',
  'language',
  'mode',
  'notes',
  'posts',
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
  // Retired from the command line: the archive page answers to /posts instead,
  // so its own path is not something the console accepts.
  'archive',
  'config',
  'doctor',
])

/**
 * Commands whose argument is free text instead of a path id. For these a space
 * after the command word means "all of the rest is the argument", so
 * `/search vue router` reads the way it would in any other terminal. The gate is
 * the command word on purpose: dynamic ids such as `/capture/My Image (1).png`
 * legitimately contain spaces and must keep them.
 */
const ARGUMENT_SEGMENTS = new Set(['search'])

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
    const [, spacedHead = '', spacedText = ''] = /^\/+([^/\s]+)[ \t]+(.*)$/.exec(path) || []
    const argumentHead = ARGUMENT_SEGMENTS.has(spacedHead.toLowerCase()) ? spacedHead.toLowerCase() : ''
    const decodedSegments = argumentHead
      ? [argumentHead, spacedText.trim()].filter(Boolean)
      : path
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
    command.canonicalInput = toConsoleCommandText(command)
    return command
  } catch {
    return silent(rawInput)
  }
}

function commandSuffix(command: ConsoleCommand): string {
  return `${command.query ? `?${command.query}` : ''}${command.hash || ''}`
}

export function toConsoleRoutePath(input: ConsoleCommand | ParsedConsoleInput): string {
  if (input.kind !== 'command') return ''
  const path = input.segments.length
    ? `/${input.segments.map((segment) => encodeURIComponent(segment)).join('/')}`
    : '/'
  return `${path}${commandSuffix(input)}`
}

/**
 * What the console echoes back and keeps in its history. The same as the route
 * path, except that an argument command stays readable: `/search hello world`
 * rather than `/search/hello%20world`. Both spellings parse back to one command,
 * so a history entry can be re-run either way.
 */
function toConsoleCommandText(input: ConsoleCommand): string {
  const [head = '', ...rest] = input.segments
  if (!ARGUMENT_SEGMENTS.has(head) || !rest.length) return toConsoleRoutePath(input)
  return `/${head} ${rest.join(' ')}${commandSuffix(input)}`
}
