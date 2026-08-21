import { reactive, onBeforeUnmount } from 'vue'
import {
  probeUrl,
  type BinaryUrlStatus,
} from './urlProbe'
import { fetchInfraStatusSnapshot } from './infraStatusSnapshot'

export type StatusKind = BinaryUrlStatus

export interface UrlStatus {
  status: StatusKind
}

interface CheckOptions {
  force?: boolean
}

const SNAPSHOT_TTL_MS = 60_000
const SNAPSHOT_TIMEOUT_MS = 2_000
let sharedSnapshotPromise: Promise<Record<string, BinaryUrlStatus> | null> | null = null
let sharedSnapshotStartedAt = 0

function loadSharedSnapshot() {
  if (import.meta.env.DEV) return Promise.resolve(null)

  const now = Date.now()
  if (sharedSnapshotPromise && now - sharedSnapshotStartedAt < SNAPSHOT_TTL_MS) {
    return sharedSnapshotPromise
  }

  sharedSnapshotStartedAt = now
  sharedSnapshotPromise = fetchInfraStatusSnapshot(fetch, undefined, SNAPSHOT_TIMEOUT_MS)
  return sharedSnapshotPromise
}

export function useUrlStatus() {
  const statusMap = reactive<Record<string, UrlStatus>>({})
  const pending = new Map<string, AbortController>()
  const batchTimers = new Set<ReturnType<typeof setTimeout>>()

  function loadSnapshot() {
    return loadSharedSnapshot()
  }

  async function checkUrl(url: string, options: CheckOptions = {}) {
    if (!url || url === '#') return
    if (pending.has(url)) return
    if (!options.force && statusMap[url]) return

    // Every visible endpoint always has one of the two requested states.
    // Refreshes keep the last result visible while the new request is in flight.
    if (!statusMap[url]) {
      statusMap[url] = { status: 'offline' }
    }

    const controller = new AbortController()
    pending.set(url, controller)
    const timeoutId = setTimeout(() => controller.abort(), import.meta.env.DEV ? 6000 : 5000)

    try {
      const snapshot = await loadSnapshot()
      const snapshotStatus = snapshot?.[url]
      const status = snapshotStatus ?? await probeUrl(url, {
        isDev: import.meta.env.DEV,
        proxyBase: import.meta.env.VITE_INFRA_PROBE_URL,
        fetchImpl: fetch,
        signal: controller.signal,
      })
      statusMap[url] = { status }
    } finally {
      clearTimeout(timeoutId)
      pending.delete(url)
    }
  }

  function checkUrls(urls: string[], options: CheckOptions = {}) {
    const unique = [...new Set(urls.filter(u => u && u !== '#'))]
    let i = 0
    const batch = () => {
      const chunk = unique.slice(i, i + 3)
      chunk.forEach(u => checkUrl(u, options))
      i += 3
      if (i < unique.length) {
        const timer = setTimeout(() => {
          batchTimers.delete(timer)
          batch()
        }, 400)
        batchTimers.add(timer)
      }
    }
    batch()
  }

  onBeforeUnmount(() => {
    pending.forEach(ctrl => ctrl.abort())
    pending.clear()
    batchTimers.forEach(timer => clearTimeout(timer))
    batchTimers.clear()
  })

  return { statusMap, checkUrls, checkUrl }
}
