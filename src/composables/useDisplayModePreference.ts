import { computed, readonly, ref } from 'vue'
import {
  DEFAULT_DISPLAY_MODE,
  isDisplayMode,
  migrateLegacyDisplayMode,
  resolveActiveDisplayMode,
  resolveStoredDisplayMode,
  type DisplayMode,
} from '../console/displayMode'

export type { DisplayMode } from '../console/displayMode'

/**
 * The two site shells. `console` is the desktop-first shell, while `standard`
 * is the existing sidebar/drawer experience.
 */
export const DISPLAY_MODE_STORAGE_KEY = 'displayMode'
export const LEGACY_DISPLAY_MODE_STORAGE_KEY = 'viewMode'
export const DESKTOP_MEDIA_QUERY = '(min-width: 901px)'

const displayMode = ref<DisplayMode>(DEFAULT_DISPLAY_MODE)
const isDesktop = ref(true)
let initialized = false
let desktopMediaQuery: MediaQueryList | null = null

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

function applyDocumentDisplayMode() {
  if (typeof document === 'undefined') return

  const consoleActive = resolveActiveDisplayMode(displayMode.value, isDesktop.value) === 'console'
  document.documentElement.classList.toggle('console-mode-active', consoleActive)

  if (consoleActive) {
    document.documentElement.classList.remove(
      'heart-bounce-active',
      'sakura-hover',
      'sakura-grabbing',
    )
  }
}

function syncDesktopMediaQuery() {
  isDesktop.value = desktopMediaQuery?.matches ?? detectDesktop()
  applyDocumentDisplayMode()
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
    applyDocumentDisplayMode()
  }
}

function readInitialMode(): DisplayMode {
  const stored = readStorage(DISPLAY_MODE_STORAGE_KEY)
  if (isDisplayMode(stored)) return stored

  const legacy = readStorage(LEGACY_DISPLAY_MODE_STORAGE_KEY)
  const migrated = migrateLegacyDisplayMode(legacy)
  if (migrated) {
    // Write the new key once so future sessions do not depend on the removed
    // preference module. Keep the legacy key untouched for backwards safety.
    writeStorage(DISPLAY_MODE_STORAGE_KEY, migrated)
    return migrated
  }

  // The raw value remains the desktop-first default even on a mobile
  // first visit. `activeMode` below gates it to standard while mobile, so a
  // later resize to desktop can still reveal the intended first-visit shell.
  return resolveStoredDisplayMode(stored, legacy, isDesktop.value)
}

export { migrateLegacyDisplayMode }

/** Initialise the singleton and return the raw persisted mode. */
export function initDisplayModePreference(): DisplayMode {
  if (initialized) return displayMode.value

  isDesktop.value = detectDesktop()
  displayMode.value = readInitialMode()
  applyDocumentDisplayMode()
  initialized = true
  bindDesktopMediaQuery()

  return displayMode.value
}

export function setDisplayModePreference(nextMode: DisplayMode): DisplayMode {
  if (!isDisplayMode(nextMode)) return displayMode.value

  displayMode.value = nextMode
  writeStorage(DISPLAY_MODE_STORAGE_KEY, nextMode)
  applyDocumentDisplayMode()
  return nextMode
}

export function toggleDisplayModePreference(): DisplayMode {
  return setDisplayModePreference(displayMode.value === 'console' ? 'standard' : 'console')
}

export function useDisplayModePreference() {
  initDisplayModePreference()

  // Keep the raw preference available for the settings UI, but make all shell
  // decisions use `activeMode` so a saved desktop choice never changes mobile.
  const activeMode = computed<DisplayMode>(() => resolveActiveDisplayMode(displayMode.value, isDesktop.value))
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
