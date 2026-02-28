// Lightweight fetch cache utility
// - in-memory Map for fast reads during the session
// - localStorage for persistence across reloads
// Exports: getCache, setCache, fetchWithCache, clearCache

const PREFIX = 'nw:apiCache:';
const memory = new Map();

function _now() { return Date.now(); }

function _makeRecord(value, ttl) {
  return { ts: _now(), ttl: ttl || 0, value };
}

function _isExpired(record) {
  if (!record) return true;
  if (!record.ttl || record.ttl <= 0) return false; // ttl 0 means never expire
  return (_now() - record.ts) > record.ttl;
}

function getCache(key) {
  try {
    if (memory.has(key)) {
      const r = memory.get(key);
      if (_isExpired(r)) {
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

function setCache(key, value, ttl = 0) {
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

function clearCache(key) {
  try {
    memory.delete(key);
    if (key) localStorage.removeItem(PREFIX + key);
    else {
      // clear all our keys
      Object.keys(localStorage).forEach(k => {
        if (k && k.indexOf && k.indexOf(PREFIX) === 0) localStorage.removeItem(k);
      });
    }
  } catch (e) {}
}

async function fetchWithCache(url, options = {}, ttl = 1000 * 60 * 15) {
  // key by URL + method + body (stringified) to avoid collisions
  const method = (options.method || 'GET').toUpperCase();
  let bodyKey = '';
  try { bodyKey = options.body ? JSON.stringify(options.body) : ''; } catch {}
  const key = `${method}:${url}:${bodyKey}`;

  const cached = getCache(key);
  if (cached !== null && typeof cached !== 'undefined') {
    return cached;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    // Check GitHub rate limit
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const resetTime = res.headers.get('X-RateLimit-Reset');
    
    if (res.status === 403 && remaining === '0') {
      const resetDate = new Date(parseInt(resetTime) * 1000);
      const err = new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
      err.status = res.status;
      err.resetTime = resetDate;
      throw err;
    }
    
    const text = await res.text().catch(() => null);
    const err = new Error(`Fetch error ${res.status}`);
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
