/**
 * The registry deliberately has no Vue/router imports. It is the small,
 * deterministic boundary between terminal text and application actions.
 */
export type ConsoleMode = 'console' | 'standard'

export type ConsolePanel =
  | 'theme'
  | 'color'
  | 'background'
  | 'icon'
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
  help: { path: '/help', routeName: 'help' },
}

const PANEL_VALUES: Record<string, { panel: ConsolePanel; values: Set<string> }> = {
  theme: { panel: 'theme', values: new Set(['light', 'dark']) },
  // 与 src/data/site/theme.ts 的 siteColorSchemeIds 手工同步。本模块顶部声明的「无 import」
  // 边界是硬约束：scripts/test-console-registry.mjs 以 data: URL 加载它，相对 import 无法解析。
  color: { panel: 'color', values: new Set(['green', 'purple', 'pink', 'white', 'black']) },
  background: { panel: 'background', values: new Set(['on', 'off']) },
  // 与 src/composables/useConsoleIconPreference.ts 的 consoleIconForms 手工同步，
  // 原因同上：本模块不得有相对 import。
  icon: { panel: 'icon', values: new Set(['grayscale', 'whiten', 'original', 'pixelated']) },
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

/**
 * Reading order of the command groups, with the i18n key of the heading each one
 * gets on the `/help` page. The grouping lives here rather than in the page so
 * that the suggestion rows and the reference page can never disagree about what a
 * command is for. Keys rather than text, because this module may not import the
 * locale files: see the no-import note at the top.
 */
export const consoleCommandGroups = [
  { id: 'navigate', titleKey: 'console.group.navigate' },
  { id: 'page', titleKey: 'console.group.page' },
  { id: 'appearance', titleKey: 'console.group.appearance' },
  { id: 'console', titleKey: 'console.group.console' },
] as const

export type ConsoleCommandGroup = typeof consoleCommandGroups[number]['id']

/**
 * The command reference, as keys. Sub-commands separate their segments with `_`
 * rather than `.`, since vue-i18n reads a dot as a step down into the message
 * tree and `/mode/classic` is one message, not a `classic` inside a `mode`.
 */
export function listConsoleCommands(availability: ConsoleCommandAvailability = {}) {
  const commands = [
    { input: '/home', descriptionKey: 'console.command.home', group: 'navigate' },
    { input: '/posts', descriptionKey: 'console.command.posts', group: 'navigate' },
    { input: '/notes', descriptionKey: 'console.command.notes', group: 'navigate' },
    { input: '/comment', descriptionKey: 'console.command.comment', group: 'page' },
    { input: '/export', descriptionKey: 'console.command.export', group: 'page' },
    { input: '/post', descriptionKey: 'console.command.post', group: 'navigate' },
    { input: '/note', descriptionKey: 'console.command.note', group: 'navigate' },
    { input: '/capture', descriptionKey: 'console.command.capture', group: 'navigate' },
    { input: '/infra', descriptionKey: 'console.command.infra', group: 'navigate' },
    { input: '/project', descriptionKey: 'console.command.project', group: 'navigate' },
    { input: '/tags', descriptionKey: 'console.command.tags', group: 'navigate' },
    { input: '/about', descriptionKey: 'console.command.about', group: 'navigate' },
    { input: '/friends', descriptionKey: 'console.command.friends', group: 'navigate' },
    { input: '/search', descriptionKey: 'console.command.search', group: 'navigate' },
    { input: '/theme', descriptionKey: 'console.command.theme', group: 'appearance' },
    { input: '/color', descriptionKey: 'console.command.color', group: 'appearance' },
    { input: '/background', descriptionKey: 'console.command.background', group: 'appearance' },
    { input: '/icon', descriptionKey: 'console.command.icon', group: 'appearance' },
    { input: '/language', descriptionKey: 'console.command.language', group: 'appearance' },
    { input: '/mode', descriptionKey: 'console.command.mode', group: 'console' },
    { input: '/mode/classic', descriptionKey: 'console.command.mode_classic', group: 'console' },
    { input: '/mode/console', descriptionKey: 'console.command.mode_console', group: 'console' },
    { input: '/help', descriptionKey: 'console.command.help', group: 'console' },
  ] as const satisfies ReadonlyArray<{
    input: string
    descriptionKey: string
    group: ConsoleCommandGroup
  }>

  return commands.filter((command) => {
    const key = command.input.slice(1)
    return isRouteAvailable(key, availability)
  })
}
