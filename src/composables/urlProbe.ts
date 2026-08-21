export type BinaryUrlStatus = 'online' | 'offline'

interface ProbeUrlOptions {
  isDev: boolean
  proxyBase?: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}

export async function probeUrl(
  url: string,
  { isDev, proxyBase, fetchImpl = fetch, signal }: ProbeUrlOptions,
): Promise<BinaryUrlStatus> {
  if (isDev) return probeProxyUrl(url, fetchImpl, signal)
  if (proxyBase?.trim()) {
    const proxyStatus = await probeRemoteProxyUrl(url, proxyBase, fetchImpl, signal)
    if (proxyStatus === 'online') return proxyStatus
  }
  return probeDirectUrl(url, fetchImpl, signal)
}

export async function probeDirectUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      redirect: 'manual',
      signal,
    })
    const status = response.status === 200 ? 'online' : 'offline'
    try {
      await response.body?.cancel()
    } catch {
      // The HTTP status is authoritative even if body cleanup fails.
    }
    return status
  } catch {
    return 'offline'
  }
}

export async function probeProxyUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  return probeProxyEndpoint('/api/ping?url=' + encodeURIComponent(url), fetchImpl, signal)
}

export async function probeRemoteProxyUrl(
  url: string,
  proxyBase: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  const base = proxyBase.trim().replace(/\/+$/, '')
  if (!base) return 'offline'
  return probeProxyEndpoint(
    base + '/api/ping?url=' + encodeURIComponent(url),
    fetchImpl,
    signal,
  )
}

async function probeProxyEndpoint(
  endpoint: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  try {
    const response = await fetchImpl(endpoint, {
      cache: 'no-store',
      redirect: 'manual',
      signal,
    })
    if (response.status !== 200) return 'offline'

    const data = (await response.json()) as { online?: unknown }
    return data.online === true ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}
