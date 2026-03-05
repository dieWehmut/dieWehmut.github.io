const LOCAL_FALLBACK_BASE = 'http://localhost:8080';

function getEnvValue(key: 'VITE_API_BASE' | 'VITE_BACKEND_API_BASE'): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env || {};
  return env[key] || '';
}

function getConfiguredBackendBase(): string {
  return (
    getEnvValue('VITE_API_BASE') ||
    getEnvValue('VITE_BACKEND_API_BASE') ||
    ''
  ).trim().replace(/\/$/, '');
}

export function getBackendApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getConfiguredBackendBase();
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}

export function toLocalFallbackUrl(url: string): string {
  const configuredBase = getConfiguredBackendBase();
  if (!configuredBase) return url;
  if (!url.startsWith(configuredBase)) return url;
  return `${LOCAL_FALLBACK_BASE}${url.slice(configuredBase.length)}`;
}

export async function fetchBackendWithFallback(path: string, init?: RequestInit): Promise<Response> {
  const primaryUrl = getBackendApiUrl(path);
  try {
    const primaryResp = await fetch(primaryUrl, init);
    if (primaryResp.ok) return primaryResp;

    const fallbackUrl = toLocalFallbackUrl(primaryUrl);
    if (fallbackUrl !== primaryUrl) {
      const fallbackResp = await fetch(fallbackUrl, init);
      if (fallbackResp.ok) return fallbackResp;
    }
    return primaryResp;
  } catch (err) {
    const fallbackUrl = toLocalFallbackUrl(primaryUrl);
    if (fallbackUrl !== primaryUrl) {
      return fetch(fallbackUrl, init);
    }
    throw err;
  }
}
