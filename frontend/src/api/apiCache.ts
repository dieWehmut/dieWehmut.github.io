// Lightweight fetch cache utility
// - in-memory Map for fast reads during the session
// - localStorage for persistence across reloads
// - ETag revalidation once the TTL expires
// Exports: getCache, setCache, fetchWithCache, clearCache

const PREFIX = 'nw:apiCache:';

type CacheRecord<T = unknown> = {
  ts: number;
  ttl: number;
  value: T;
  etag?: string;
};

const memory = new Map<string, CacheRecord>();

function _now() {
  return Date.now();
}

function _makeRecord<T>(value: T, ttl: number, etag?: string): CacheRecord<T> {
  return { ts: _now(), ttl: ttl || 0, value, etag };
}

function _isExpired(record: CacheRecord | null | undefined) {
  if (!record) return true;
  if (!record.ttl || record.ttl <= 0) return false;
  return (_now() - record.ts) > record.ttl;
}

function _readStoredRecord(key: string, allowExpired = false): CacheRecord | null {
  if (memory.has(key)) {
    const record = memory.get(key) || null;
    if (!allowExpired && _isExpired(record)) {
      memory.delete(key);
      try { localStorage.removeItem(PREFIX + key); } catch (e) {}
      return null;
    }
    return record;
  }

  const raw = localStorage.getItem(PREFIX + key);
  if (!raw) return null;

  const record = JSON.parse(raw) as CacheRecord;
  if (!allowExpired && _isExpired(record)) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) {}
    return null;
  }

  memory.set(key, record);
  return record;
}

function getCache(key: string) {
  try {
    const record = _readStoredRecord(key);
    return record ? record.value : null;
  } catch (e) {
    return null;
  }
}

function setCache(key: string, value: unknown, ttl = 0, etag?: string) {
  try {
    const record = _makeRecord(value, ttl, etag);
    memory.set(key, record);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(record)); } catch (e) {}
  } catch (e) {}
}

function clearCache(key?: string) {
  try {
    if (key) {
      memory.delete(key);
      localStorage.removeItem(PREFIX + key);
      return;
    }

    memory.clear();
    Object.keys(localStorage).forEach((storageKey) => {
      if (storageKey.startsWith(PREFIX)) {
        localStorage.removeItem(storageKey);
      }
    });
  } catch (e) {}
}

async function fetchWithCache(url: string, options: RequestInit = {}, ttl = 1000 * 60 * 15) {
  const method = ((options.method as string) || 'GET').toUpperCase();
  let bodyKey = '';

  try {
    const body = (options as RequestInit & { body?: unknown }).body;
    bodyKey = body ? JSON.stringify(body) : '';
  } catch (e) {}

  const key = `${method}:${url}:${bodyKey}`;
  const cachedRecord = (() => {
    try {
      return _readStoredRecord(key);
    } catch (e) {
      return null;
    }
  })();

  if (cachedRecord && typeof cachedRecord.value !== 'undefined') {
    return cachedRecord.value;
  }

  const staleRecord = (() => {
    try {
      return _readStoredRecord(key, true);
    } catch (e) {
      return null;
    }
  })();

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if ((method === 'GET' || method === 'HEAD') && staleRecord?.etag) {
    headers.set('If-None-Match', staleRecord.etag);
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, requestInit);

  if (response.status === 304 && staleRecord) {
    setCache(key, staleRecord.value, ttl, response.headers.get('etag') || staleRecord.etag);
    return staleRecord.value;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    const err = new Error(`Fetch error ${response.status}`) as Error & { status?: number; body?: string | null };
    err.status = response.status;
    err.body = text;
    throw err;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  setCache(key, data, ttl, response.headers.get('etag') || undefined);
  return data;
}

export { getCache, setCache, clearCache, fetchWithCache };
