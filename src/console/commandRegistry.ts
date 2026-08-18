/**
 * The registry deliberately has no Vue/router imports. It is the small,
 * deterministic boundary between terminal text and application actions.
 */
export type ConsoleMode = 'console' | 'standard'

export type ConsolePanel =
  | 'help'
  | 'theme'
  | 'color'
  | 'background'
  | 'language'
  | 'mode'
  | 'note-picker'
  | 'post-picker'

export interface ConsoleCommandShape {
  kind: 'command'
  segments: string[]
  query?: string
  hash?: string
  canonicalInput?: string
}

export interface ConsoleCommandAvailability {
  infra?: boolean
  project?: boolean
}

export type ConsoleResolution =
  | { kind: 'route'; path: string; routeName: string }
  | { kind: 'comment' }
  | { kind: 'export' }
  | { kind: 'panel'; panel: ConsolePanel; value?: string }
  | { kind: 'mode'; mode: ConsoleMode }
  | { kind: 'silent' }

/**
 * Only routes that the command line can reach. `/posts` is the command name for
 * the archive route: the console speaks in posts and notes, so the pair reads as
 * one family instead of borrowing the page's own title.
 */
const ROUTES: Record<string, { path: string; routeName: string }> = {
  posts: { path: '/archive', routeName: 'archive' },
  notes: { path: '/notes', routeName: 'notes' },
  capture: { path: '/capture', routeName: 'capture' },
  infra: { path: '/infra', routeName: 'infra' },
  project: { path: '/project', routeName: 'project' },
  tags: { path: '/tags', routeName: 'tags' },
  about: { path: '/about', routeName: 'about' },
  friends: { path: '/friends', routeName: 'friends' },
}

const PANELS: Record<string, ConsolePanel> = {
  help: 'help',
}

const PANEL_VALUES: Record<string, { panel: ConsolePanel; values: Set<string> }> = {
  theme: { panel: 'theme', values: new Set(['light', 'dark']) },
  // 与 src/data/site/theme.ts 的 siteColorSchemeIds 手工同步。本模块顶部声明的「无 import」
  // 边界是硬约束：scripts/test-console-registry.mjs 以 data: URL 加载它，相对 import 无法解析。
  color: { panel: 'color', values: new Set(['green', 'purple', 'pink', 'white', 'black']) },
  background: { panel: 'background', values: new Set(['on', 'off']) },
  language: { panel: 'language', values: new Set(['zh', 'zh_tw', 'en', 'ja', 'de', 'la']) },
}

function suffix(command: ConsoleCommandShape): string {
  return `${command.query ? `?${command.query}` : ''}${command.hash || ''}`
}

function encoded(value: string): string {
  return encodeURIComponent(value)
}

function routeWithSuffix(path: string, command: ConsoleCommandShape): string {
  return `${path}${suffix(command)}`
}

function isRouteAvailable(key: string, availability: ConsoleCommandAvailability): boolean {
  if (key === 'infra') return availability.infra !== false
  if (key === 'project') return availability.project !== false
  return true
}

export function resolveConsoleCommand(
  command: ConsoleCommandShape,
  availability: ConsoleCommandAvailability = {},
): ConsoleResolution {
  if (command.kind !== 'command') return { kind: 'silent' }

  const [head = '', second, ...rest] = command.segments
  const key = head.toLowerCase()
  const secondKey = second?.toLowerCase()

  if (!head) return { kind: 'route', path: routeWithSuffix('/', command), routeName: 'root' }
  if (key === 'home' && second === undefined) {
    return { kind: 'route', path: routeWithSuffix('/home', command), routeName: 'home' }
  }
  if (key === 'comment') {
    return second === undefined && !rest.length && !command.query && !command.hash
      ? { kind: 'comment' }
      : { kind: 'silent' }
  }
  if (key === 'export') {
    return second === undefined && !rest.length && !command.query && !command.hash
      ? { kind: 'export' }
      : { kind: 'silent' }
  }

  /**
   * `/search` is the only command that carries free text: everything after the
   * command word is the query, so `/search vue router` reaches
   * `/search?q=vue%20router`. The term travels as a query parameter rather than a
   * path segment, which keeps the result page linkable outside the console.
   */
  if (key === 'search') {
    const term = command.segments.slice(1).join(' ').trim()
    if (!term) return { kind: 'route', path: routeWithSuffix('/search', command), routeName: 'search' }
    if (command.query || command.hash) return { kind: 'silent' }
    return { kind: 'route', path: `/search?q=${encoded(term)}`, routeName: 'search' }
  }

  if (key === 'mode') {
    if (!secondKey && !rest.length) return { kind: 'panel', panel: 'mode' }
    if (rest.length) return { kind: 'silent' }
    if (secondKey === 'classic' || secondKey === 'standard') return { kind: 'mode', mode: 'standard' }
    if (secondKey === 'console' || secondKey === 'terminal') return { kind: 'mode', mode: 'console' }
    return { kind: 'silent' }
  }

  if (key === 'post' && second !== undefined && !rest.length) {
    return { kind: 'route', path: routeWithSuffix(`/post/${encoded(second)}`, command), routeName: 'post-detail' }
  }
  if (key === 'note' && second !== undefined && !rest.length) {
    return { kind: 'route', path: routeWithSuffix(`/note/${encoded(second)}`, command), routeName: 'note-detail' }
  }
  if (key === 'capture' && second !== undefined && !rest.length) {
    return { kind: 'route', path: routeWithSuffix(`/capture/${encoded(second)}`, command), routeName: 'capture-detail' }
  }
  if (key === 'tags' && second !== undefined && !rest.length) {
    return { kind: 'route', path: routeWithSuffix(`/tags/${encoded(second)}`, command), routeName: 'tag-detail' }
  }

  if (key === 'note' && second === undefined) return { kind: 'panel', panel: 'note-picker' }
  if (key === 'post' && second === undefined) return { kind: 'panel', panel: 'post-picker' }
  if (key === 'capture' && (second === undefined || !second)) {
    return { kind: 'route', path: routeWithSuffix('/capture', command), routeName: 'capture' }
  }

  const panel = PANELS[key]
  if (panel) {
    return second === undefined && !rest.length
      ? { kind: 'panel', panel }
      : { kind: 'silent' }
  }

  const panelValue = PANEL_VALUES[key]
  if (panelValue) {
    if (rest.length || (secondKey && !panelValue.values.has(secondKey))) return { kind: 'silent' }
    return { kind: 'panel', panel: panelValue.panel, value: secondKey }
  }

  const route = ROUTES[key]
  if (route && second === undefined && isRouteAvailable(key, availability)) {
    return { kind: 'route', path: routeWithSuffix(route.path, command), routeName: route.routeName }
  }

  return { kind: 'silent' }
}

export function listConsoleCommands(availability: ConsoleCommandAvailability = {}) {
  const commands = [
    { input: '/home', description: 'Browse the Home timeline' },
    { input: '/posts', description: 'Browse the post archive' },
    { input: '/notes', description: 'Browse the note index' },
    { input: '/comment', description: 'Jump to the comment box for this page' },
    { input: '/export', description: 'Export this article as PDF' },
    { input: '/post', description: 'Select a post' },
    { input: '/note', description: 'Select a note' },
    { input: '/capture', description: 'Browse captured assets' },
    { input: '/infra', description: 'Inspect service status' },
    { input: '/project', description: 'Browse projects' },
    { input: '/tags', description: 'Browse tags' },
    { input: '/about', description: 'Read site information' },
    { input: '/friends', description: 'Browse friend links' },
    { input: '/search', description: 'Search as you type, e.g. /search vue' },
    { input: '/theme', description: 'Choose light or dark theme' },
    { input: '/color', description: 'Choose a color scheme' },
    { input: '/background', description: 'Configure the dynamic background' },
    { input: '/language', description: 'Choose interface language' },
    { input: '/mode', description: 'Choose Console or standard layout' },
    { input: '/mode/classic', description: 'Return to the standard layout' },
    { input: '/mode/console', description: 'Use Nexus Console' },
    { input: '/help', description: 'Show command reference' },
  ] as const

  return commands.filter((command) => {
    const key = command.input.slice(1)
    return isRouteAvailable(key, availability)
  })
}
