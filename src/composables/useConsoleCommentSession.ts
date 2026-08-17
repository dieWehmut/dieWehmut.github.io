import { computed, readonly, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  closeConsoleCommentStateForRoute,
  resolveConsoleCommentTarget,
  toggleConsoleCommentState,
  type ConsoleCommentGroup,
  type ConsoleCommentState,
} from '../console/commentState'

const state = ref<ConsoleCommentState>({ openRouteKey: null, target: null })
let routeWatcherInstalled = false

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

export function useConsoleCommentSession() {
  const route = useRoute()

  if (!routeWatcherInstalled) {
    routeWatcherInstalled = true
    watch(
      () => route.fullPath,
      (fullPath) => {
        state.value = closeConsoleCommentStateForRoute(state.value, fullPath)
      },
    )
  }

  const isOpen = computed(() => Boolean(state.value.openRouteKey))

  async function canToggleCurrentPage() {
    return Boolean(await resolveCurrentTarget(route))
  }

  async function toggleCurrentPage() {
    const target = await resolveCurrentTarget(route)
    if (!target) return false

    state.value = toggleConsoleCommentState(state.value, target)
    return true
  }

  function close() {
    state.value = { openRouteKey: null, target: null }
  }

  return {
    state: readonly(state),
    target: computed(() => state.value.target),
    isOpen,
    canToggleCurrentPage,
    toggleCurrentPage,
    close,
  }
}
