import { reactive, onBeforeUnmount } from 'vue'

export type StatusKind = 'checking' | 'online' | 'offline'

export interface UrlStatus {
  status: StatusKind
  latency?: number
  httpStatus?: number
}

interface CheckOptions {
  force?: boolean
}

export function useUrlStatus() {
  const statusMap = reactive<Record<string, UrlStatus>>({})
  const pending = new Map<string, AbortController>()
  const batchTimers = new Set<ReturnType<typeof setTimeout>>()

  async function checkUrl(url: string, options: CheckOptions = {}) {
    if (!url || url === '#') return
    if (pending.has(url)) return
    if (!options.force && statusMap[url] && statusMap[url].status !== 'checking') return

    // Only show "checking" on initial load; on refresh, keep the old status visible
    if (!statusMap[url]) {
      statusMap[url] = { status: 'checking' }
    }

    // In dev mode, use the Vite /api/ping proxy — same-origin request,
    // server-side forward from the user's machine → target sees user's real IP.
    // In production, fall back to direct fetch (CORS → no-cors).
    if (import.meta.env.DEV) {
      await checkViaProxy(url)
    } else {
      await checkDirect(url)
    }
  }

  /** Dev mode: call same-origin /api/ping proxy for real HTTP status */
  async function checkViaProxy(url: string) {
    const controller = new AbortController()
    pending.set(url, controller)

    try {
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const res = await fetch('/api/ping?url=' + encodeURIComponent(url), {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      if (!res.ok) {
        statusMap[url] = { status: 'offline', httpStatus: res.status }
        return
      }

      const data = await res.json()
      const httpStatus = Number(data.status)

      if (data.ok && httpStatus === 200) {
        statusMap[url] = { status: 'online', latency: Number(data.latency), httpStatus }
      } else if (Number.isFinite(httpStatus)) {
        statusMap[url] = { status: 'offline', httpStatus }
      } else {
        statusMap[url] = { status: 'offline' }
      }
    } catch {
      statusMap[url] = { status: 'offline' }
    } finally {
      pending.delete(url)
    }
  }

  /** Production: direct fetch — CORS first, then no-cors fallback */
  async function checkDirect(url: string) {
    const controller = new AbortController()
    pending.set(url, controller)

    const t0 = performance.now()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      const latency = Math.round(performance.now() - t0)

      // 只有 HTTP 200 才算 online，其余（含 3xx 之后的非 200、4xx、5xx）一律 offline
      if (response.status === 200) {
        statusMap[url] = { status: 'online', latency, httpStatus: response.status }
      } else {
        statusMap[url] = { status: 'offline', httpStatus: response.status }
      }
    } catch {
      // 超时 / 网络错误 / CORS 拦截：无法证明是 200，一律 offline
      // （no-cors 兜底响应不透明，读不到状态码，按规则不能判为 online，故不再尝试）
      clearTimeout(timeoutId)
      statusMap[url] = { status: 'offline' }
    } finally {
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
