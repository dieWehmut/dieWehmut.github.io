import { computed, readonly, ref } from 'vue'

/**
 * The two site shells. `console` is the desktop-first shell, while `standard`
 * is the existing sidebar/drawer experience.
 */
export type DisplayMode = 'console' | 'standard'

export const DISPLAY_MODE_STORAGE_KEY = 'displayMode'
export const LEGACY_DISPLAY_MODE_STORAGE_KEY = 'viewMode'
export const DESKTOP_MEDIA_QUERY = '(min-width: 901px)'

const DEFAULT_DESKTOP_MODE: DisplayMode = 'console'
const DEFAULT_MOBILE_MODE: DisplayMode = 'standard'

const displayMode = ref<DisplayMode>(DEFAULT_DESKTOP_MODE)
const isDesktop = ref(true)
let initialized = false
let desktopMediaQuery: MediaQueryList | null = null

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === 'console' || value === 'standard'
}

/** Convert values written by the removed Focus/view-mode preference. */
export function migrateLegacyDisplayMode(value: unknown): DisplayMode | null {
  if (value === '1' || value === 'true' || value === 'console') return 'console'
  if (value === '0' || value === 'false' || value === 'standard' || value === 'classic') {
    return 'standard'
  }
  return null
}

function readStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private/embedded documents. The in-memory
    // preference remains useful in that case.
  }
}

function detectDesktop(): boolean {
  if (typeof window === 'undefined') return true

  try {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
    }
  } catch {
    // Fall through to the width check when matchMedia is unavailable or throws.
  }

  return typeof window.innerWidth !== 'number' || window.innerWidth > 900
}

function syncDesktopMediaQuery() {
  isDesktop.value = desktopMediaQuery?.matches ?? detectDesktop()
}

function bindDesktopMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  if (desktopMediaQuery) return

  try {
    desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    syncDesktopMediaQuery()

    if (desktopMediaQuery.addEventListener) {
      desktopMediaQuery.addEventListener('change', syncDesktopMediaQuery)
    } else {
      // Safari <= 13 and a few embedded WebViews only expose the old API.
      desktopMediaQuery.addListener(syncDesktopMediaQuery)
    }
  } catch {
    desktopMediaQuery = null
    isDesktop.value = detectDesktop()
  }
}

function readInitialMode(desktop: boolean): DisplayMode {
  const stored = readStorage(DISPLAY_MODE_STORAGE_KEY)
  if (isDisplayMode(stored)) return stored

  const migrated = migrateLegacyDisplayMode(readStorage(LEGACY_DISPLAY_MODE_STORAGE_KEY))
  if (migrated) {
    // Write the new key once so future sessions do not depend on the removed
    // preference module. Keep the legacy key untouched for backwards safety.
    writeStorage(DISPLAY_MODE_STORAGE_KEY, migrated)
    return migrated
  }

  return desktop ? DEFAULT_DESKTOP_MODE : DEFAULT_MOBILE_MODE
}

/** Initialise the singleton and return the raw persisted mode. */
export function initDisplayModePreference(): DisplayMode {
  if (initialized) return displayMode.value

  isDesktop.value = detectDesktop()
  displayMode.value = readInitialMode(isDesktop.value)
  initialized = true
  bindDesktopMediaQuery()

  return displayMode.value
}

export function setDisplayModePreference(nextMode: DisplayMode): DisplayMode {
  if (!isDisplayMode(nextMode)) return displayMode.value

  displayMode.value = nextMode
  writeStorage(DISPLAY_MODE_STORAGE_KEY, nextMode)
  return nextMode
}

export function toggleDisplayModePreference(): DisplayMode {
  return setDisplayModePreference(displayMode.value === 'console' ? 'standard' : 'console')
}

export function useDisplayModePreference() {
  initDisplayModePreference()

  // Keep the raw preference available for the settings UI, but make all shell
  // decisions use `activeMode` so a saved desktop choice never changes mobile.
  const activeMode = computed<DisplayMode>(() =>
    isDesktop.value ? displayMode.value : DEFAULT_MOBILE_MODE,
  )
  const isConsole = computed(() => activeMode.value === 'console')
  const isStandard = computed(() => activeMode.value === 'standard')

  return {
    displayMode: readonly(displayMode),
    mode: readonly(displayMode),
    activeMode,
    isDesktop: readonly(isDesktop),
    isConsole,
    isStandard,
    setDisplayMode: setDisplayModePreference,
    setMode: setDisplayModePreference,
    toggleDisplayMode: toggleDisplayModePreference,
    toggleMode: toggleDisplayModePreference,
  }
}
