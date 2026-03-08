import { getCache, setCache } from '../api/apiCache'

const SNAPSHOT_PREFIX = 'snapshot:'

export const LIST_SNAPSHOT_TTL = 1000 * 60 * 60 * 24 * 7

function snapshotKey(key: string) {
  return `${SNAPSHOT_PREFIX}${key}`
}

export function readSnapshot<T = unknown>(key: string, fallback: T | null = null): T | null {
  const value = getCache(snapshotKey(key), { allowExpired: true })
  return value == null ? fallback : (value as T)
}

export function writeSnapshot(key: string, value: unknown, ttl = LIST_SNAPSHOT_TTL) {
  setCache(snapshotKey(key), value, ttl)
}

export function replaceReactiveRecord(target: Record<string, unknown>, source: Record<string, unknown> = {}) {
  Object.keys(target).forEach((key) => {
    delete target[key]
  })

  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}
