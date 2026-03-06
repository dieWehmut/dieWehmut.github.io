// Lightweight fetch cache utility
// - in-memory Map for fast reads during the session
// - localStorage for persistence across reloads
// Exports: getCache, setCache, fetchWithCache, clearCache

import { toLocalFallbackUrl } from './backendApi';

const PREFIX = 'nw:apiCache:';
const memory = new Map<string, { ts: number; ttl: number; value: any }>();

function _now() { return Date.now(); }

function _makeRecord(value: any, ttl: number) {
  return { ts: _now(), ttl: ttl || 0, value };
}

function _isExpired(record: { ts: number; ttl: number; value: any } | null | undefined) {
  if (!record) return true;
  if (!record.ttl || record.ttl <= 0) return false; // ttl 0 means never expire
  return (_now() - record.ts) > record.ttl;
}

function getCache(key: string) {
  try {
    if (memory.has(key)) {
      const r = memory.get(key);
      if (!r || _isExpired(r)) {
        memory.delete(key);
        try { localStorage.removeItem(PREFIX + key); } catch(e) {}
        return null;
      }
      return r.value;
    }
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (_isExpired(record)) {
      try { localStorage.removeItem(PREFIX + key); } catch(e) {}
      return null;
    }
    memory.set(key, record);
    return record.value;
  } catch (e) {
    // fail open
    return null;
  }
}

function setCache(key: string, value: any, ttl = 0) {
  try {
    const record = _makeRecord(value, ttl);
    memory.set(key, record);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(record)); } catch(e) {
      // localStorage can fail on quota; ignore
    }
  } catch (e) {
    // ignore
  }
}

function clearCache(key?: string) {
  try {
    if (key) {
      memory.delete(key);
      localStorage.removeItem(PREFIX + key);
    }
    else {
      // clear all our keys
      Object.keys(localStorage).forEach(k => {
        if (k && k.indexOf && k.indexOf(PREFIX) === 0) localStorage.removeItem(k);
      });
    }
  } catch (e) {}
}

async function fetchWithCache(url: string, options: RequestInit = {}, ttl = 1000 * 60 * 15) {
  // key by URL + method + body (stringified) to avoid collisions
  const method = ((options.method as string) || 'GET').toUpperCase();
  let bodyKey = '';
  try {
    const body = (options as RequestInit & { body?: any }).body;
    bodyKey = body ? JSON.stringify(body) : '';
  } catch {}
  const key = `${method}:${url}:${bodyKey}`;

  const cached = getCache(key);
  if (cached !== null && typeof cached !== 'undefined') {
    return cached;
  }

  const requestInit = {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  async function doFetch(targetUrl: string) {
    return fetch(targetUrl, requestInit);
  }

  let res;
  const fallbackUrl = toLocalFallbackUrl(url);

  try {
    res = await doFetch(url);
  } catch (e) {
    if (fallbackUrl !== url) {
      res = await doFetch(fallbackUrl);
    } else {
      throw e;
    }
  }

  if (!res.ok && fallbackUrl !== url) {
    const retry = await doFetch(fallbackUrl);
    if (retry.ok) {
      res = retry;
    }
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    const err = new Error(`Fetch error ${res.status}`) as Error & { status?: number; body?: string | null };
    err.status = res.status;
    err.body = text;
    throw err;
  }

  // try to parse JSON; if fails, return text
  const contentType = res.headers.get && res.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  // store result
  setCache(key, data, ttl);
  return data;
}

export { getCache, setCache, clearCache, fetchWithCache };
