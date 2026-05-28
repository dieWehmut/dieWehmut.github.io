import { reactive, onBeforeUnmount } from 'vue'

export type StatusKind = 'checking' | 'online' | 'offline' | 'unreachable' | 'highLatency' | 'timeout'

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

      if (data.ok && httpStatus >= 200 && httpStatus < 300) {
        const latency: number = data.latency
        if (latency < 1000) {
          statusMap[url] = { status: 'online', latency, httpStatus }
        } else {
          statusMap[url] = { status: 'highLatency', latency, httpStatus }
        }
      } else if (Number.isFinite(httpStatus)) {
        statusMap[url] = { status: 'offline', httpStatus }
      } else if (data.error === 'timeout') {
        statusMap[url] = { status: 'timeout' }
      } else if (data.error === 'offline') {
        statusMap[url] = { status: 'offline' }
      } else {
        statusMap[url] = { status: 'unreachable' }
      }
    } catch (_err: any) {
      if (_err.name === 'AbortError') {
        statusMap[url] = { status: 'timeout' }
      } else {
        statusMap[url] = { status: 'unreachable' }
      }
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

      if (response.ok) {
        if (latency < 1000) {
          statusMap[url] = { status: 'online', latency, httpStatus: response.status }
        } else {
          statusMap[url] = { status: 'highLatency', latency, httpStatus: response.status }
        }
      } else {
        statusMap[url] = { status: 'offline', httpStatus: response.status }
      }
    } catch (corsErr: any) {
      clearTimeout(timeoutId)

      if (corsErr.name === 'AbortError') {
        statusMap[url] = { status: 'timeout' }
        pending.delete(url)
        return
      }

      // CORS blocked — fall back to no-cors
      try {
        const noCorsCtrl = new AbortController()
        pending.set(url, noCorsCtrl)
        const t1 = performance.now()
        const noCorsTimeoutId = setTimeout(() => noCorsCtrl.abort(), 5000)

        await fetch(url, { mode: 'no-cors', signal: noCorsCtrl.signal })

        clearTimeout(noCorsTimeoutId)
        const latency = Math.round(performance.now() - t1)

        if (latency < 1000) {
          statusMap[url] = { status: 'online', latency }
        } else {
          statusMap[url] = { status: 'highLatency', latency }
        }
      } catch (noCorsErr: any) {
        if (noCorsErr.name === 'AbortError') {
          statusMap[url] = { status: 'timeout' }
        } else {
          statusMap[url] = { status: 'unreachable' }
        }
      }
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
