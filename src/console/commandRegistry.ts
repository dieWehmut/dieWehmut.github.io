/**
 * The registry deliberately has no Vue/router imports. It is the small,
 * deterministic boundary between terminal text and application actions.
 */
export type ConsoleMode = 'console' | 'standard'

export type ConsolePanel =
  | 'agent'
  | 'help'
  | 'status'
  | 'config'
  | 'permissions'
  | 'list'
  | 'doctor'
  | 'model'
  | 'workspace'
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

export type ConsoleResolution =
  | { kind: 'route'; path: string; routeName: string }
  | { kind: 'panel'; panel: ConsolePanel; value?: string }
  | { kind: 'mode'; mode: ConsoleMode }
  | { kind: 'silent' }

const ROUTES: Record<string, { path: string; routeName: string }> = {
  archive: { path: '/archive', routeName: 'archive' },
  notes: { path: '/notes', routeName: 'notes' },
  capture: { path: '/capture', routeName: 'capture' },
  infra: { path: '/infra', routeName: 'infra' },
  project: { path: '/project', routeName: 'project' },
  tags: { path: '/tags', routeName: 'tags' },
  about: { path: '/about', routeName: 'about' },
  friends: { path: '/friends', routeName: 'friends' },
  search: { path: '/search', routeName: 'search' },
}

const PANELS: Record<string, ConsolePanel> = {
  agent: 'agent',
  help: 'help',
  status: 'status',
  config: 'config',
  permissions: 'permissions',
  list: 'list',
  doctor: 'doctor',
  model: 'model',
  workspace: 'workspace',
  theme: 'theme',
  color: 'color',
  background: 'background',
  language: 'language',
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

export function resolveConsoleCommand(command: ConsoleCommandShape): ConsoleResolution {
  if (command.kind !== 'command') return { kind: 'silent' }

  const [head = '', second, ...rest] = command.segments
  const key = head.toLowerCase()
  const secondKey = second?.toLowerCase()

  if (!head) return { kind: 'route', path: routeWithSuffix('/', command), routeName: 'home' }
  if (key === 'home') return { kind: 'route', path: routeWithSuffix('/', command), routeName: 'home' }

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
  if (panel) return { kind: 'panel', panel, value: second }

  const route = ROUTES[key]
  if (route && second === undefined) {
    return { kind: 'route', path: routeWithSuffix(route.path, command), routeName: route.routeName }
  }

  if (key === 'theme' || key === 'color' || key === 'background' || key === 'language') {
    return { kind: 'panel', panel: key, value: second }
  }

  return { kind: 'silent' }
}

export function listConsoleCommands() {
  return [
    { input: '/', description: 'Home overview' },
    { input: '/agent', description: 'Show agent workspace' },
    { input: '/status', description: 'Show workspace status' },
    { input: '/config', description: 'Show resolved configuration' },
    { input: '/permissions', description: 'Show effective permissions' },
    { input: '/doctor', description: 'Run availability checks' },
    { input: '/workspace', description: 'Show workspace details' },
    { input: '/model', description: 'Show configured model' },
    { input: '/archive', description: 'Browse posts by date' },
    { input: '/post', description: 'Select a post' },
    { input: '/notes', description: 'Browse notes by date' },
    { input: '/note', description: 'Select a note' },
    { input: '/capture', description: 'Browse captured assets' },
    { input: '/infra', description: 'Inspect service status' },
    { input: '/project', description: 'Browse projects' },
    { input: '/tags', description: 'Browse tags' },
    { input: '/search', description: 'Search the workspace' },
    { input: '/theme', description: 'Choose light or dark theme' },
    { input: '/color', description: 'Choose green, purple, or pink' },
    { input: '/background', description: 'Configure the dynamic background' },
    { input: '/language', description: 'Choose interface language' },
    { input: '/mode', description: 'Choose Console or standard layout' },
    { input: '/mode/classic', description: 'Return to the standard layout' },
    { input: '/mode/console', description: 'Use Nexus Console' },
    { input: '/help', description: 'Show command reference' },
  ] as const
}
