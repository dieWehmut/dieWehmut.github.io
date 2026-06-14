export type GiscusViewer = {
  avatarUrl?: string
  login: string
  url?: string
}

export type GiscusAuthState = {
  authenticated: boolean
  hasSession: boolean
  viewer: GiscusViewer | null
}

type GiscusAuthChangeReason = 'init' | 'metadata' | 'session' | 'signout' | 'error'
type GiscusAuthListener = (state: GiscusAuthState, reason: GiscusAuthChangeReason) => void
type PendingLogin = {
  resolve: (state: GiscusAuthState) => void
  reject: (error: Error) => void
  timeoutId: number
}

const GISCUS_ORIGIN = 'https://giscus.app'
const GISCUS_SESSION_KEY = 'giscus-session'
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000

let initialized = false
let viewer: GiscusViewer | null = null
let hasSession = false
let loginWindow: Window | null = null
const listeners = new Set<GiscusAuthListener>()
const pendingLogins = new Set<PendingLogin>()

function browserAvailable(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function readStoredSession(): boolean {
  if (!browserAvailable()) return false

  try {
    return Boolean(localStorage.getItem(GISCUS_SESSION_KEY))
  } catch {
    return false
  }
}

function currentState(): GiscusAuthState {
  return {
    authenticated: Boolean(viewer?.login || hasSession),
    hasSession,
    viewer,
  }
}

function notify(reason: GiscusAuthChangeReason) {
  const state = currentState()
  listeners.forEach((listener) => listener(state, reason))

  if (!state.authenticated) return

  pendingLogins.forEach((pending) => {
    window.clearTimeout(pending.timeoutId)
    pending.resolve(state)
  })
  pendingLogins.clear()
  loginWindow = null
}

function clearAuth(reason: GiscusAuthChangeReason) {
  viewer = null
  hasSession = false
  notify(reason)
}

function updateSession(reason: GiscusAuthChangeReason) {
  const nextHasSession = readStoredSession()
  if (nextHasSession === hasSession && reason !== 'init') return
  hasSession = nextHasSession
  notify(reason)
}

function updateViewer(nextViewer: unknown) {
  const login = typeof nextViewer === 'object' && nextViewer !== null && 'login' in nextViewer
    ? String((nextViewer as { login?: unknown }).login || '').trim()
    : ''
  if (!login) return

  viewer = {
    avatarUrl: String((nextViewer as { avatarUrl?: unknown }).avatarUrl || ''),
    login,
    url: String((nextViewer as { url?: unknown }).url || ''),
  }
  hasSession = true
  notify('metadata')
}

function handleGiscusMessage(event: MessageEvent) {
  if (event.origin !== GISCUS_ORIGIN) return
  const data = event.data
  if (typeof data !== 'object' || data === null || !('giscus' in data)) return

  const giscusData = (data as { giscus?: unknown }).giscus
  if (typeof giscusData !== 'object' || giscusData === null) return

  if ('viewer' in giscusData) {
    updateViewer((giscusData as { viewer?: unknown }).viewer)
    return
  }

  if ('signOut' in giscusData) {
    clearAuth('signout')
    return
  }

  const error = 'error' in giscusData ? String((giscusData as { error?: unknown }).error || '') : ''
  if (
    error.includes('Bad credentials') ||
    error.includes('Invalid state value') ||
    error.includes('State has expired')
  ) {
    clearAuth('error')
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key !== GISCUS_SESSION_KEY) return
  updateSession(event.newValue ? 'session' : 'signout')
}

export function initGiscusAuthBridge(): GiscusAuthState {
  if (!browserAvailable()) return currentState()

  if (!initialized) {
    initialized = true
    window.addEventListener('message', handleGiscusMessage)
    window.addEventListener('storage', handleStorage)
  }

  updateSession('init')
  return currentState()
}

export function getGiscusAuthState(): GiscusAuthState {
  initGiscusAuthBridge()
  hasSession = readStoredSession()
  return currentState()
}

export function watchGiscusAuth(listener: GiscusAuthListener): () => void {
  initGiscusAuthBridge()
  listeners.add(listener)
  listener(currentState(), 'init')
  return () => listeners.delete(listener)
}

export function giscusLoginUrl(returnUrl = window.location.href): string {
  const cleanReturnUrl = new URL(returnUrl)
  cleanReturnUrl.searchParams.delete('giscus')

  const loginUrl = new URL('/api/oauth/authorize', GISCUS_ORIGIN)
  loginUrl.searchParams.set('redirect_uri', cleanReturnUrl.toString())
  return loginUrl.toString()
}

export function beginGiscusLogin(): Window | null {
  initGiscusAuthBridge()
  const loginUrl = giscusLoginUrl()
  if (!loginWindow || loginWindow.closed) {
    loginWindow = window.open(loginUrl, 'giscus-github-login', 'popup,width=980,height=720')
  } else {
    loginWindow.focus()
  }
  return loginWindow
}

export function ensureGiscusLogin(): Promise<GiscusAuthState> {
  const state = getGiscusAuthState()
  if (state.authenticated) return Promise.resolve(state)

  const openedWindow = beginGiscusLogin()
  if (!openedWindow) {
    return Promise.reject(new Error('GitHub 登录窗口被浏览器拦截，请允许弹窗后重试。'))
  }

  return new Promise((resolve, reject) => {
    let pending: PendingLogin
    const timeoutId = window.setTimeout(() => {
      pendingLogins.delete(pending)
      reject(new Error('GitHub 登录没有完成。'))
      if (!pendingLogins.size) loginWindow = null
    }, LOGIN_TIMEOUT_MS)

    pending = { resolve, reject, timeoutId }
    pendingLogins.add(pending)
  })
}
