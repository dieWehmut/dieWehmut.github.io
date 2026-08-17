export const CONSOLE_RESULT_NAVIGATION_EVENT = 'nexus:console-result-navigate'

export type ConsoleResultNavigationAction = 'previous' | 'next' | 'activate'

export function moveConsoleSelection(index: number, delta: number, count: number): number {
  if (count <= 0) return -1
  if (index < 0) return delta < 0 ? count - 1 : 0
  return (index + delta + count) % count
}

export function consoleEscapeTarget({
  input,
  hasPanel,
}: {
  input: string
  hasPanel: boolean
}): string | null {
  if (hasPanel) return '/'
  if (input.trim().startsWith('/')) return ''
  return null
}
