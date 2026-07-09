import { computed, readonly, ref } from 'vue'
import { siteConfig } from '../data/site/config'
import {
  DEFAULT_SITE_COLOR_SCHEME,
  applySiteColorScheme,
  isSiteColorScheme,
  resolveSiteColorScheme,
  siteColorSchemeOptions,
  type SiteThemeMode,
} from '../data/site/theme'
import type { SiteColorScheme } from '../types/content'

const STORAGE_KEY = 'color-scheme'
const DEFAULT_COLOR_SCHEME = resolveSiteColorScheme(siteConfig.colorScheme || DEFAULT_SITE_COLOR_SCHEME)

const colorScheme = ref<SiteColorScheme>(DEFAULT_COLOR_SCHEME)
let initialized = false

function isThemeMode(value: unknown): value is SiteThemeMode {
  return value === 'light' || value === 'dark'
}

function readStoredColorScheme(): SiteColorScheme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isSiteColorScheme(saved) ? saved : null
  } catch {
    return null
  }
}

function readDocumentColorScheme(): SiteColorScheme | null {
  if (typeof document === 'undefined') return null
  const current = document.documentElement.getAttribute('data-color-scheme')
  return current === 'green' || current === 'purple' ? current : null
}

function readDocumentTheme(): SiteThemeMode {
  if (typeof document === 'undefined') return 'dark'
  const current = document.documentElement.getAttribute('data-theme')
  return isThemeMode(current) ? current : 'dark'
}

export function applyCurrentColorScheme(themeMode?: SiteThemeMode) {
  applySiteColorScheme(colorScheme.value, themeMode || readDocumentTheme())
}

export function initColorSchemePreference(themeMode?: SiteThemeMode) {
  const storedColorScheme = readStoredColorScheme()
  const nextColorScheme = storedColorScheme || readDocumentColorScheme() || DEFAULT_COLOR_SCHEME

  colorScheme.value = nextColorScheme
  applyCurrentColorScheme(themeMode)
  initialized = true

  return nextColorScheme
}

export function setColorSchemePreference(nextColorScheme: SiteColorScheme) {
  colorScheme.value = resolveSiteColorScheme(nextColorScheme)
  applyCurrentColorScheme()

  try {
    localStorage.setItem(STORAGE_KEY, colorScheme.value)
  } catch {}
}

export function useColorSchemePreference() {
  if (!initialized) initColorSchemePreference()

  return {
    colorScheme: readonly(colorScheme),
    colorSchemeOptions: computed(() => siteColorSchemeOptions),
    setColorScheme: setColorSchemePreference,
  }
}
