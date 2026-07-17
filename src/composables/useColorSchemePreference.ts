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
  return isSiteColorScheme(current) ? current : null
}

function readDocumentTheme(): SiteThemeMode {
  if (typeof document === 'undefined') return 'dark'
  const current = document.documentElement.getAttribute('data-theme')
  return isThemeMode(current) ? current : 'dark'
}

export function applyCurrentColorScheme(themeMode?: SiteThemeMode) {
  applySiteColorScheme(colorScheme.value, themeMode || readDocumentTheme())
}

/** 从所有配色方案里随机选一个（green / purple / pink…） */
function pickRandomColorScheme(): SiteColorScheme {
  const options = siteColorSchemeOptions
  if (!options.length) return DEFAULT_COLOR_SCHEME
  const index = Math.floor(Math.random() * options.length)
  return options[index]?.id ?? DEFAULT_COLOR_SCHEME
}

export function initColorSchemePreference(themeMode?: SiteThemeMode) {
  // 用户手动保存过 → 用保存值；否则本次打开随机选定一个配色
  // 随机结果不写入 localStorage，保证每次刷新都可能是不同颜色
  const storedColorScheme = readStoredColorScheme()
  const nextColorScheme =
    storedColorScheme || readDocumentColorScheme() || pickRandomColorScheme()

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
