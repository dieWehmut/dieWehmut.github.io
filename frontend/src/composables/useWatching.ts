import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { getBackendApiUrl } from '../api/backendApi'

interface WatchingMessage {
  type: string
  count: number
  timestamp: string
}

export function useWatching() {
  const count = ref<number | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const error = ref<string | null>(null)
  const retryCount = ref(0)

  let eventSource: EventSource | null = null
  let retryTimer: number | null = null
  let pingInterval: number | null = null

  const countText = computed(() =>
    count.value === null ? '--' : String(count.value)
  )

  const connect = () => {
    if (eventSource || isConnecting.value) return

    isConnecting.value = true
    error.value = null

    try {
      const url = getBackendApiUrl('/api/watching/stream')
      eventSource = new EventSource(url)

      eventSource.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        retryCount.value = 0
        error.value = null

        // 开始心跳
        startPing()
        console.log('SSE connection established')
      }

      eventSource.onmessage = (event) => {
        try {
          const data: WatchingMessage = JSON.parse(event.data)
          if (data.type === 'online_count') {
            count.value = data.count
          }
        } catch (e) {
          console.warn('Failed to parse SSE message:', e)
        }
      }

      eventSource.onerror = () => {
        isConnected.value = false
        isConnecting.value = false
        error.value = 'Connection failed'

        // 停止心跳
        stopPing()

        // 关闭并清理
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }

        // 自动重连（指数退避）
        scheduleRetry()
      }
    } catch (e) {
      isConnecting.value = false
      error.value = 'Failed to create connection'
      console.error('EventSource creation failed:', e)
      scheduleRetry()
    }
  }

  const disconnect = () => {
    stopPing()

    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }

    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    isConnected.value = false
    isConnecting.value = false
  }

  const scheduleRetry = () => {
    if (retryTimer) return

    // 指数退避：1s, 2s, 4s, 8s, 最大30s
    const delay = Math.min(1000 * Math.pow(2, retryCount.value), 30000)

    retryTimer = setTimeout(() => {
      retryTimer = null
      retryCount.value++

      // 如果重试次数过多，停止自动重连
      if (retryCount.value <= 6) {
        connect()
      } else {
        error.value = 'Connection failed after multiple attempts'
      }
    }, delay)
  }

  const startPing = () => {
    if (pingInterval) return

    // 每10秒发送一次心跳
    pingInterval = setInterval(async () => {
      try {
        const url = getBackendApiUrl('/api/watching/ping')
        await fetch(url, {
          method: 'POST',
          headers: {
            'X-Connection-ID': generateConnectionId()
          }
        })
      } catch (e) {
        console.warn('Ping failed:', e)
      }
    }, 10000)
  }

  const stopPing = () => {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  const generateConnectionId = (): string => {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 页面可见性监听
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面不可见时暂停连接以节省资源
      disconnect()
    } else {
      // 页面重新可见时重新连接
      if (!isConnected.value && !isConnecting.value) {
        connect()
      }
    }
  }

  // 网络状态监听
  const handleOnline = () => {
    if (!isConnected.value && !isConnecting.value) {
      connect()
    }
  }

  const handleOffline = () => {
    disconnect()
    error.value = 'Network offline'
  }

  onMounted(() => {
    connect()

    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 添加网络状态监听
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onBeforeUnmount(() => {
    disconnect()

    // 清理事件监听器
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    count,
    countText,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  }
}