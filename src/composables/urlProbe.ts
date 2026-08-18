export type BinaryUrlStatus = 'online' | 'offline'

export async function probeDirectUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  try {
    await fetchImpl(url, {
      mode: 'no-cors',
      cache: 'no-store',
      signal,
    })
    return 'online'
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
