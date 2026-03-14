export function getBackendApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const runtimeBase = resolveRuntimeApiBase();
  if (!runtimeBase) {
    return normalizedPath;
  }
  return `${runtimeBase}${normalizedPath}`;
}

export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  return fetch(getBackendApiUrl(path), init);
}

function resolveRuntimeApiBase(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const runtime = window as Window & { __API_BASE__?: string };
  const base = (runtime.__API_BASE__ || '').trim().replace(/\/$/, '');
  return base;
}
