import { reactive, onBeforeUnmount, onMounted, watch, type ComputedRef } from 'vue'
import type { InfraEntry } from '../types/content'
import type { UrlStatus } from './useUrlStatus'
import { siteConfig } from '../data/site/config'

interface KumaMonitor {
  id: number
  name: string
}

interface KumaGroup {
  monitorList: KumaMonitor[]
}

interface KumaStatusPageResponse {
  publicGroupList?: KumaGroup[]
}

interface KumaHeartbeat {
  status: 0 | 1 | 2 | 3
  time: string
  msg: string
  ping: number | null
}

interface KumaHeartbeatResponse {
  heartbeatList?: Record<string, KumaHeartbeat[]>
  uptimeList?: Record<string, number>
}

const DEFAULT_REFRESH_MS = 60_000
function safeHostname(url?: string): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Match an InfraEntry to a Kuma monitor.
 * 1) Hostname substring on monitor.name (case-insensitive)
 * 2) Exact name match (case-insensitive)
 */
function findMonitorForItem(item: InfraEntry, monitors: KumaMonitor[]): KumaMonitor | undefined {
  const host = safeHostname(item.url)
  const itemName = item.name.trim().toLowerCase()

  if (host) {
    // Try full hostname first, then the leading subdomain label.
    const hostHead = host.split('.')[0]
    const byHost = monitors.find((m) => {
      const n = m.name.toLowerCase()
      return n.includes(host) || (hostHead && n.includes(hostHead))
    })
    if (byHost) return byHost
  }

  return monitors.find((m) => m.name.trim().toLowerCase() === itemName)
}

function heartbeatToStatus(hb: KumaHeartbeat | undefined): UrlStatus | null {
  if (!hb) return null
  const ping = typeof hb.ping === 'number' ? hb.ping : undefined

  switch (hb.status) {
    case 1:
      return { status: 'online', latency: ping }
    case 0:
      return { status: 'offline', latency: ping }
    case 2:
      return { status: 'checking' }
    case 3:
      // Maintenance — fold into offline to keep existing UI semantics.
      return { status: 'offline', latency: ping }
    default:
      return null
  }
}

export function useKumaStatus(items: ComputedRef<InfraEntry[]>) {
  const statusMap = reactive<Record<string, UrlStatus>>({})
  const coveredUrls = reactive<Set<string>>(new Set<string>())

  const kumaCfg = siteConfig.kuma
  const enabled = Boolean(kumaCfg?.baseUrl && kumaCfg?.slug)
  const refreshMs = kumaCfg?.refreshMs ?? DEFAULT_REFRESH_MS

  let timer: ReturnType<typeof setInterval> | null = null
  let inflight: AbortController | null = null

  async function fetchOnce(): Promise<void> {
    if (!enabled || !kumaCfg) return

    if (inflight) inflight.abort()
    const controller = new AbortController()
    inflight = controller

    const base = kumaCfg.baseUrl.replace(/\/+$/, '')
    const slug = encodeURIComponent(kumaCfg.slug)
    const pageUrl = `${base}/api/status-page/${slug}`
    const hbUrl = `${base}/api/status-page/heartbeat/${slug}`

    try {
      const [pageRes, hbRes] = await Promise.all([
        fetch(pageUrl, { signal: controller.signal, headers: { Accept: 'application/json' } }),
        fetch(hbUrl, { signal: controller.signal, headers: { Accept: 'application/json' } }),
      ])

      if (!pageRes.ok || !hbRes.ok) return

      const page = (await pageRes.json()) as KumaStatusPageResponse
      const hb = (await hbRes.json()) as KumaHeartbeatResponse

      const monitors: KumaMonitor[] = (page.publicGroupList ?? []).flatMap(
        (g) => g.monitorList ?? []
      )
      const heartbeatList = hb.heartbeatList ?? {}

      const nextCovered = new Set<string>()
      for (const item of items.value) {
        if (!item.url) continue
        const monitor = findMonitorForItem(item, monitors)
        if (!monitor) continue

        const beats = heartbeatList[String(monitor.id)]
        const last = Array.isArray(beats) && beats.length ? beats[beats.length - 1] : undefined
        const mapped = heartbeatToStatus(last)
        if (!mapped) continue

        statusMap[item.url] = mapped
        nextCovered.add(item.url)
      }

      // Drop entries no longer covered (monitor removed or URL changed).
      for (const url of Array.from(coveredUrls)) {
        if (!nextCovered.has(url)) {
          coveredUrls.delete(url)
          delete statusMap[url]
        }
      }
      for (const url of nextCovered) coveredUrls.add(url)
    } catch {
      // Silent — let fallback probe take over.
    } finally {
      if (inflight === controller) inflight = null
    }
  }

  function refresh() {
    void fetchOnce()
  }

  onMounted(() => {
    if (!enabled) return
    void fetchOnce()
    timer = setInterval(() => void fetchOnce(), refreshMs)
  })

  // Re-run mapping when the items list changes (e.g., async load).
  watch(items, () => {
    if (enabled) void fetchOnce()
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    timer = null
    if (inflight) inflight.abort()
    inflight = null
  })

  return { statusMap, coveredUrls, refresh, enabled }
}
