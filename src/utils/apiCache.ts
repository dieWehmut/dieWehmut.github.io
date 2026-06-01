type CacheRecord<T> = {
  ts: number
  ttl: number
  value: T
}

type CacheMap = Map<string, CacheRecord<unknown>>

interface CachedFetchError extends Error {
  status?: number
  resetTime?: Date
  body?: string | null
}

const PREFIX = 'nw:apiCache:'
const memory: CacheMap = new Map()

function now(): number {
  return Date.now()
}

function makeRecord<T>(value: T, ttl: number): CacheRecord<T> {
  return { ts: now(), ttl, value }
}

function isExpired<T>(record: CacheRecord<T> | null | undefined): boolean {
  if (!record) return true
  if (!record.ttl || record.ttl <= 0) return false
  return now() - record.ts > record.ttl
}

export function getCache<T>(key: string): T | null {
  try {
    if (memory.has(key)) {
      const record = memory.get(key) as CacheRecord<T> | undefined
      if (isExpired(record)) {
        memory.delete(key)
        try {
          localStorage.removeItem(PREFIX + key)
        } catch {}
        return null
      }
      return record?.value ?? null
    }

    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null

    const record = JSON.parse(raw) as CacheRecord<T>
    if (isExpired(record)) {
      try {
        localStorage.removeItem(PREFIX + key)
      } catch {}
      return null
    }

    memory.set(key, record as CacheRecord<unknown>)
    return record.value
  } catch {
    return null
  }
}

export function setCache<T>(key: string, value: T, ttl = 0): void {
  try {
    const record = makeRecord(value, ttl)
    memory.set(key, record as CacheRecord<unknown>)
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(record))
    } catch {}
  } catch {}
}

export function clearCache(key?: string): void {
  try {
    if (key) {
      memory.delete(key)
      localStorage.removeItem(PREFIX + key)
      return
    }

    memory.clear()
    Object.keys(localStorage).forEach((storageKey) => {
      if (storageKey.startsWith(PREFIX)) localStorage.removeItem(storageKey)
    })
  } catch {}
}

export async function fetchWithCache<T = unknown>(
  url: string,
  options: RequestInit = {},
  ttl = 1000 * 60 * 15
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  let bodyKey = ''
  try {
    bodyKey = options.body ? JSON.stringify(options.body) : ''
  } catch {}

  const key = `${method}:${url}:${bodyKey}`
  const cached = getCache<T>(key)
  if (cached !== null && typeof cached !== 'undefined') {
    return cached
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const remaining = res.headers.get('X-RateLimit-Remaining')
    const resetTime = res.headers.get('X-RateLimit-Reset')

    if (res.status === 403 && remaining === '0' && resetTime) {
      const resetDate = new Date(Number.parseInt(resetTime, 10) * 1000)
      const err: CachedFetchError = new Error(
        `GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`
      )
      err.status = res.status
      err.resetTime = resetDate
      throw err
    }

    const text = await res.text().catch(() => null)
    const err: CachedFetchError = new Error(`Fetch error ${res.status}`)
    err.status = res.status
    err.body = text
    throw err
  }

  const contentType = res.headers.get('content-type')
  let data: T
  if (contentType?.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text() as T
  }

  setCache(key, data, ttl)
  return data
}
