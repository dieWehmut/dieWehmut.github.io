/**
 * Pure route helpers deciding which comment thread a Console route owns.
 *
 * Console mode always shows the thread of the route it is displaying, so the
 * only question left is "which thread, if any" — there is no open/closed state.
 * Keeping this module free of Vue/router imports makes the route contract easy
 * to exercise in a small Node test.
 */

export type ConsoleCommentSource = 'site' | 'capture'

export interface ConsoleCommentRoute {
  name?: unknown
  fullPath: string
  captureRouteId?: string
}

export interface ConsoleCommentGroup {
  id: string
  assetIds: readonly string[]
}

export interface ConsoleCommentTarget {
  source: ConsoleCommentSource
  routeKey: string
  term?: string
}

/**
 * Giscus should keep the same thread while the user changes only a heading
 * hash. Query changes represent a different view/filter and therefore get a
 * fresh comment session.
 */
export function getConsoleCommentRouteKey(fullPath: string): string {
  const value = String(fullPath || '')
  const hashIndex = value.indexOf('#')
  return hashIndex >= 0 ? value.slice(0, hashIndex) : value
}

function routeName(route: ConsoleCommentRoute): string {
  return String(route.name || '').trim().toLowerCase()
}

function captureGroupForRoute(
  route: ConsoleCommentRoute,
  captureGroups: readonly ConsoleCommentGroup[],
): ConsoleCommentGroup | null {
  const rawId = String(route.captureRouteId || '').trim()
  if (!rawId) return null

  return captureGroups.find((group) =>
    group.id === rawId || group.assetIds.some((assetId) => assetId === rawId)
  ) || null
}

/**
 * Resolve the current route to an explicit comment target.
 *
 * The Console's blank root, search and not-found views intentionally have no
 * comment thread. Capture details use a canonical group term so an individual
 * asset and its grouped route share one discussion.
 */
export function resolveConsoleCommentTarget(
  route: ConsoleCommentRoute,
  captureGroups: readonly ConsoleCommentGroup[] = [],
): ConsoleCommentTarget | null {
  const routeKey = getConsoleCommentRouteKey(route.fullPath)
  const name = routeName(route)

  if (!routeKey || routeKey === '/') return null
  if (name === 'root' || name === 'console-root' || name === 'search' || name === 'not-found') return null

  if (name === 'capture-detail') {
    const group = captureGroupForRoute(route, captureGroups)
    if (!group) return null
    return {
      source: 'capture',
      routeKey,
      term: `capture-group:${group.id}`,
    }
  }

  return { source: 'site', routeKey }
}
