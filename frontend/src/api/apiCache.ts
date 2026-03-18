// Lightweight fetch cache utility
// - in-memory Map for fast reads during the session
// - localStorage for persistence across reloads
// - ETag revalidation once the TTL expires
// Exports: getCache, setCache, fetchWithCache, clearCache

const PREFIX = 'nw:apiCache:';
const pendingRequests = new Map<string, Promise<unknown>>();

// Async localStorage write queue
const writeQueue = new Map<string, string>();
let writeScheduled = false;

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
  if (typeof localStorage === 'undefined') {
    return memory.get(key) || null;
  }

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

function getCache(key: string, options: { allowExpired?: boolean } = {}) {
  try {
    const record = _readStoredRecord(key, options.allowExpired === true);
    return record ? record.value : null;
  } catch (e) {
    return null;
  }
}

function scheduleWrite() {
  if (writeScheduled) return;
  writeScheduled = true;

  // Use requestIdleCallback if available, otherwise fallback to setTimeout
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(flushWrites, { timeout: 1000 });
  } else {
    setTimeout(flushWrites, 0);
  }
}

function flushWrites() {
  writeScheduled = false;
  if (typeof localStorage === 'undefined') return;

  for (const [key, value] of writeQueue) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Silently ignore localStorage errors (quota exceeded, etc.)
    }
  }
  writeQueue.clear();
}

function setCache(key: string, value: unknown, ttl = 0, etag?: string) {
  try {
    const record = _makeRecord(value, ttl, etag);
    memory.set(key, record);

    if (typeof localStorage !== 'undefined') {
      // Queue the write for async processing
      writeQueue.set(PREFIX + key, JSON.stringify(record));
      scheduleWrite();
    }
  } catch (e) {}
}

function clearCache(key?: string) {
  try {
    if (key) {
      memory.delete(key);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(PREFIX + key);
      }
      return;
    }

    memory.clear();
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach((storageKey) => {
        if (storageKey.startsWith(PREFIX)) {
          localStorage.removeItem(storageKey);
        }
      });
    }
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

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
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

  const requestPromise = (async () => {
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
  })();

  pendingRequests.set(key, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(key);
  }
}

export { getCache, setCache, clearCache, fetchWithCache };
