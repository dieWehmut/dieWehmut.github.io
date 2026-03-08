function getEnvValue(key: 'VITE_API_BASE'): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env || {};
  return env[key] || '';
}

export function getConfiguredBackendBase(): string {
  return getEnvValue('VITE_API_BASE').trim().replace(/\/$/, '');
}

export function getBackendApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getConfiguredBackendBase();
  if (!base) {
    throw new Error('Missing VITE_API_BASE. Set it to the backend base URL for the active environment.');
  }
  return `${base}${normalizedPath}`;
}

export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  return fetch(getBackendApiUrl(path), init);
}
