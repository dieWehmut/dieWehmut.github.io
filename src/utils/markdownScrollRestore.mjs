const DEFAULT_MAX_AGE_MS = 30_000
const SETTLE_GRACE_MS = 1_200
const HARD_CAP_MS = 20_000

export const MARKDOWN_SCROLL_STORAGE_KEY = 'md-reload-scroll'

/**
 * Keep reload state limited to views whose primary content is Markdown.
 * @param {string} pathname
 * @param {string} [basePath]
 */
export function isMarkdownDocumentPath(pathname, basePath = '/') {
  let normalizedPath = String(pathname || '')
  let normalizedBase = String(basePath || '/').trim()
  if (!normalizedBase.startsWith('/')) normalizedBase = `/${normalizedBase}`
  if (!normalizedBase.endsWith('/')) normalizedBase += '/'
  if (normalizedBase !== '/' && normalizedPath.startsWith(normalizedBase)) {
    normalizedPath = `/${normalizedPath.slice(normalizedBase.length)}`
  }
  return /^\/(?:note|post)(?:\/|$)/.test(normalizedPath)
}

/**
 * Return a stable same-origin key without the origin, which keeps the value
 * portable across local dev ports and production previews.
 * @param {{ pathname?: string, search?: string, hash?: string }} location
 */
export function markdownLocationKey(location) {
  return `${location?.pathname || ''}${location?.search || ''}${location?.hash || ''}`
}

/**
 * @param {{ pathname?: string, search?: string, hash?: string }} location
 * @param {{ scrollX?: number, scrollY?: number }} view
 * @param {number} [savedAt]
 */
export function createMarkdownScrollSnapshot(location, view, savedAt = Date.now()) {
  return {
    key: markdownLocationKey(location),
    x: Number.isFinite(view?.scrollX) ? Math.max(0, view.scrollX) : 0,
    y: Number.isFinite(view?.scrollY) ? Math.max(0, view.scrollY) : 0,
    savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
  }
}

/**
 * @param {{ key?: string, x?: number, y?: number, savedAt?: number } | null | undefined} snapshot
 * @param {{ pathname?: string, search?: string, hash?: string }} location
 * @param {string} navigationType
 * @param {number} [now]
 * @param {number} [maxAgeMs]
 * @param {string} [basePath]
 */
export function shouldRestoreMarkdownScroll(
  snapshot,
  location,
  navigationType,
  now = Date.now(),
  maxAgeMs = DEFAULT_MAX_AGE_MS,
  basePath = '/',
) {
  if (navigationType !== 'reload' || !snapshot) return false
  if (!isMarkdownDocumentPath(location?.pathname, basePath)) return false
  if (location?.hash) return false
  if (snapshot.key !== markdownLocationKey(location)) return false
  if (!Number.isFinite(snapshot.y) || snapshot.y < 0) return false
  if (!Number.isFinite(snapshot.savedAt) || snapshot.savedAt > now) return false
  return now - snapshot.savedAt <= maxAgeMs
}

function navigationType(view) {
  try {
    const entry = view.performance?.getEntriesByType?.('navigation')?.[0]
    if (entry?.type) return entry.type
  } catch {
    // Older browsers may not expose Navigation Timing entries.
  }
  try {
    return view.performance?.navigation?.type === 1 ? 'reload' : 'navigate'
  } catch {
    return 'navigate'
  }
}

function readSnapshot(view) {
  try {
    const raw = view.sessionStorage?.getItem(MARKDOWN_SCROLL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeSnapshot(view, snapshot) {
  try {
    view.sessionStorage?.setItem(MARKDOWN_SCROLL_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage can be disabled or unavailable in a private browsing context.
  }
}

function clearSnapshot(view) {
  try {
    view.sessionStorage?.removeItem(MARKDOWN_SCROLL_STORAGE_KEY)
  } catch {
    // Best effort; a stale value is rejected by URL and age checks next time.
  }
}

function currentHeight(doc, view) {
  return Math.max(
    0,
    Math.max(
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0,
    ) - (view.innerHeight || 0),
  )
}

function restoreSnapshot(view, doc, snapshot) {
  const startedAt = performance.now()
  let settleUntil = startedAt + SETTLE_GRACE_MS
  let previousHeight = -1
  let timer = 0
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    if (timer) view.clearTimeout(timer)
    clearSnapshot(view)
  }

  const tick = () => {
    if (finished) return
    const now = performance.now()
    const height = currentHeight(doc, view)
    if (height !== previousHeight) {
      previousHeight = height
      settleUntil = now + SETTLE_GRACE_MS
    }

    const targetY = Math.min(snapshot.y, height)
    const targetX = Math.max(0, snapshot.x || 0)
    if (Math.abs(view.scrollY - targetY) > 1 || Math.abs(view.scrollX - targetX) > 1) {
      view.scrollTo({ left: targetX, top: targetY, behavior: 'auto' })
    }

    const documentReady = doc.readyState === 'complete'
    if ((documentReady && now >= settleUntil) || now - startedAt >= HARD_CAP_MS) {
      // Apply one final clamped position before dropping the guard. Images and
      // progressive Markdown chunks may have changed the maximum meanwhile.
      view.scrollTo({ left: targetX, top: targetY, behavior: 'auto' })
      finish()
      return
    }

    timer = view.setTimeout(tick, 32)
  }

  timer = view.setTimeout(tick, 0)
  return finish
}

/**
 * Install reload-only position persistence for Markdown document views.
 * The returned cleanup function is useful for tests and isolated embeds.
 */
export function installMarkdownReloadScrollRestore(basePath = '/') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  const view = window
  const location = view.location
  if (!isMarkdownDocumentPath(location.pathname, basePath)) return () => {}

  // Vue Router has its own savedPosition handling for back/forward entries;
  // manual mode prevents the browser's automatic restore from racing this
  // reload-specific loop.
  try {
    if ('scrollRestoration' in view.history) view.history.scrollRestoration = 'manual'
  } catch {
    // History may be read-only in embedded browsers.
  }

  const save = () => {
    const snapshot = createMarkdownScrollSnapshot(location, view)
    if (snapshot.y <= 0 && snapshot.x <= 0) {
      clearSnapshot(view)
      return
    }
    writeSnapshot(view, snapshot)
  }

  view.addEventListener('pagehide', save, { capture: true })
  view.addEventListener('beforeunload', save, { capture: true })

  const snapshot = readSnapshot(view)
  const restore = shouldRestoreMarkdownScroll(
    snapshot,
    location,
    navigationType(view),
    Date.now(),
    DEFAULT_MAX_AGE_MS,
    basePath,
  )
  const finishRestore = restore ? restoreSnapshot(view, document, snapshot) : null
  if (!restore && snapshot?.key === markdownLocationKey(location)) clearSnapshot(view)

  return () => {
    view.removeEventListener('pagehide', save, { capture: true })
    view.removeEventListener('beforeunload', save, { capture: true })
    finishRestore?.()
  }
}
