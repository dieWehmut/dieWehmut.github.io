import { reactive, onBeforeUnmount } from 'vue'

export type StatusKind = 'checking' | 'online' | 'offline' | 'unreachable' | 'highLatency' | 'timeout'

export interface UrlStatus {
  status: StatusKind
  latency?: number
}

export function useUrlStatus() {
  const statusMap = reactive<Record<string, UrlStatus>>({})
  const pending = new Map<string, AbortController>()

  async function checkUrl(url: string) {
    if (!url || url === '#') return
    if (statusMap[url] && statusMap[url].status !== 'checking') return

    statusMap[url] = { status: 'checking' }

    const controller = new AbortController()
    pending.set(url, controller)

    const t0 = performance.now()

    try {
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      await fetch(url, {
        mode: 'no-cors',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const latency = Math.round(performance.now() - t0)

      if (latency < 1000) {
        statusMap[url] = { status: 'online', latency }
      } else {
        statusMap[url] = { status: 'highLatency', latency }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        statusMap[url] = { status: 'timeout' }
      } else {
        statusMap[url] = { status: 'unreachable' }
      }
    } finally {
      pending.delete(url)
    }
  }

  function checkUrls(urls: string[]) {
    const unique = [...new Set(urls.filter(u => u && u !== '#'))]
    let i = 0
    const batch = () => {
      const chunk = unique.slice(i, i + 3)
      chunk.forEach(u => checkUrl(u))
      i += 3
      if (i < unique.length) setTimeout(batch, 400)
    }
    batch()
  }

  onBeforeUnmount(() => {
    pending.forEach(ctrl => ctrl.abort())
    pending.clear()
  })

  return { statusMap, checkUrls, checkUrl }
}
