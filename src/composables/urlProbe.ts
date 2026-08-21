export type BinaryUrlStatus = 'online' | 'offline'

interface ProbeUrlOptions {
  isDev: boolean
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}

export function probeUrl(
  url: string,
  { isDev, fetchImpl = fetch, signal }: ProbeUrlOptions,
): Promise<BinaryUrlStatus> {
  return isDev
    ? probeProxyUrl(url, fetchImpl, signal)
    : probeDirectUrl(url, fetchImpl, signal)
}

export async function probeDirectUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      signal,
    })
    return response.status === 200 ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}

export async function probeProxyUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  try {
    const response = await fetchImpl('/api/ping?url=' + encodeURIComponent(url), {
      cache: 'no-store',
      signal,
    })
    if (!response.ok) return 'offline'

    const data = (await response.json()) as { online?: unknown }
    return data.online === true ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}
