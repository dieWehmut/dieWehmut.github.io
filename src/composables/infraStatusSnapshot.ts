export type SnapshotStatus = 'online' | 'offline'

interface SnapshotDocument {
  version?: unknown
  generatedAt?: unknown
  statuses?: Record<string, unknown>
}

const SNAPSHOT_MAX_AGE_MS = 45 * 60_000

export async function fetchInfraStatusSnapshot(
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
  timeoutMs = 5000,
): Promise<Record<string, SnapshotStatus> | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const abortSnapshot = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', abortSnapshot, { once: true })
  }

  try {
    const baseUrl = import.meta.env?.BASE_URL ?? '/'
    const response = await fetchImpl(`${baseUrl}infra-status.json`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (response.status !== 200) return null
    const document = (await response.json()) as SnapshotDocument
    const generatedAt = typeof document.generatedAt === 'string'
      ? Date.parse(document.generatedAt)
      : Number.NaN
    if (
      document.version !== 1 ||
      !Number.isFinite(generatedAt) ||
      Date.now() - generatedAt > SNAPSHOT_MAX_AGE_MS ||
      !document.statuses ||
      typeof document.statuses !== 'object' ||
      Array.isArray(document.statuses)
    ) return null
    const statuses = Object.fromEntries(
      Object.entries(document.statuses).filter(([, status]) => status === 'online' || status === 'offline'),
    ) as Record<string, SnapshotStatus>
    return Object.keys(statuses).length ? statuses : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortSnapshot)
  }
}
