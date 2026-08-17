import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  resolveConsoleCommentTarget,
  type ConsoleCommentGroup,
  type ConsoleCommentTarget,
} from '../console/commentState'

/**
 * The comment thread belonging to the route Console mode is showing. Comments
 * are always on screen, so this is state derived from the route rather than
 * something the user opens and closes.
 */
const target = ref<ConsoleCommentTarget | null>(null)
let routeWatcherInstalled = false
let requestedRoute = ''

function decodeRouteParam(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  const text = String(raw || '').trim()
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

async function captureGroups(): Promise<ConsoleCommentGroup[]> {
  const { getCaptureAssets, getCaptureGroupId } = await import('../data/capture')
  const groups = new Map<string, { id: string; assetIds: string[] }>()

  for (const asset of getCaptureAssets()) {
    const id = getCaptureGroupId(asset.date || 'undated')
    const group = groups.get(id) || { id, assetIds: [] }
    if (!group.assetIds.includes(asset.id)) group.assetIds.push(asset.id)
    groups.set(id, group)
  }

  return Array.from(groups.values())
}

async function resolveCurrentTarget(route: ReturnType<typeof useRoute>) {
  const name = String(route.name || '').toLowerCase()
  const captureRouteId = name === 'capture-detail' ? decodeRouteParam(route.params.id) : undefined
  const groups = name === 'capture-detail' ? await captureGroups() : []

  return resolveConsoleCommentTarget(
    {
      name: route.name,
      fullPath: route.fullPath,
      captureRouteId,
    },
    groups,
  )
}

/**
 * Capture routes need the capture index to find their canonical group, so the
 * thread lands an await later than the navigation. The requested path is
 * compared on the way back, otherwise a slow resolution could publish the
 * previous route's thread over a newer one.
 */
async function syncTarget(route: ReturnType<typeof useRoute>) {
  const requested = route.fullPath
  requestedRoute = requested
  const resolved = await resolveCurrentTarget(route)
  if (requestedRoute !== requested) return target.value
  target.value = resolved
  return resolved
}

export function useConsoleCommentSession() {
  const route = useRoute()

  if (!routeWatcherInstalled) {
    routeWatcherInstalled = true
    watch(() => route.fullPath, () => void syncTarget(route), { immediate: true })
  }

  return {
    target: computed(() => target.value),
    /**
     * Resolve the current route's thread right away instead of waiting for the
     * watcher, so a command can act on the same tick it is typed.
     */
    ensureTarget: () => syncTarget(route),
  }
}
