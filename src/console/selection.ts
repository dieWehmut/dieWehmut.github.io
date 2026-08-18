export const CONSOLE_RESULT_NAVIGATION_EVENT = 'nexus:console-result-navigate'

/**
 * Left/Right on an empty prompt steers whichever horizontal row the current page
 * puts at its top: the month strip on a list, the section chips on an article.
 * Only one of those is ever mounted, so they share one event and the shell never
 * has to know which page it is driving.
 */
export const CONSOLE_ROW_NAVIGATION_EVENT = 'nexus:console-row-navigate'

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
