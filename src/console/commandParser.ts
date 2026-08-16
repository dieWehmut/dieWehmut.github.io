import type { ConsoleCommand, ParsedConsoleInput, SilentConsoleInput } from './types'

const FIXED_SEGMENTS = new Set([
  'about',
  'archive',
  'capture',
  'classic',
  'config',
  'doctor',
  'friends',
  'help',
  'home',
  'infra',
  'list',
  'mode',
  'model',
  'notes',
  'permissions',
  'project',
  'search',
  'status',
  'tags',
  'theme',
  'terminal',
  'workspace',
  'post',
  'note',
])

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

function normalizeSegment(segment: string, index: number) {
  const decoded = decodeURIComponent(segment)
  const lower = decoded.toLowerCase()

  // Only command vocabulary is normalized. Route IDs and tag labels retain case.
  if (FIXED_SEGMENTS.has(lower) && (index === 0 || lower !== decoded)) return lower
  return decoded
}

export function parseConsoleInput(input: string): ParsedConsoleInput {
  const rawInput = typeof input === 'string' ? input : String(input ?? '')
  const trimmed = rawInput.trim()
  if (!trimmed || !trimmed.startsWith('/')) return silent(rawInput)

  try {
    const { path, query, hash } = splitSuffix(trimmed)
    const segments = path
      .split('/')
      .filter(Boolean)
      .map((segment, index) => normalizeSegment(segment, index))

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

