import { computed, readonly, ref } from 'vue'
import { applyCurrentColorScheme } from './useColorSchemePreference'

export type ThemeMode = 'light' | 'dark'

/**
 * What each theme is called wherever a reader can see it. The stored value stays
 * `dark` — `data-theme="dark"` is written into a hundred stylesheet selectors and
 * a directory name — but nothing shows that word any more. Beside a `/color`
 * panel offering white and black, "dark" reads as one more colour; `night` names
 * the light the page is read under instead of the ink it is drawn in.
 */
export const themeModeNames: Record<ThemeMode, string> = {
  dark: 'night',
  light: 'light',
}

/** The inverse, derived from the same table so the two can never disagree. */
export function resolveThemeModeName(name: string): ThemeMode | null {
  const modes = Object.keys(themeModeNames) as ThemeMode[]
  return modes.find((mode) => themeModeNames[mode] === name) ?? null
}


const STORAGE_KEY = 'theme'
const DEFAULT_THEME: ThemeMode = 'dark'

const theme = ref<ThemeMode>(DEFAULT_THEME)
let initialized = false

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function readStoredTheme(): ThemeMode | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isThemeMode(saved) ? saved : null
  } catch {
    return null
  }
}

function readDocumentTheme(): ThemeMode | null {
  if (typeof document === 'undefined') return null
  const current = document.documentElement.getAttribute('data-theme')
  return isThemeMode(current) ? current : null
}

function applyTheme(nextTheme: ThemeMode) {
  theme.value = nextTheme

  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme', nextTheme)
  root.style.colorScheme = nextTheme
  applyCurrentColorScheme(nextTheme)
}

export function initThemePreference() {
  const storedTheme = readStoredTheme()
  const nextTheme = storedTheme || readDocumentTheme() || DEFAULT_THEME

  applyTheme(nextTheme)
  initialized = true

  return nextTheme
}

export function setThemePreference(nextTheme: ThemeMode) {
  applyTheme(nextTheme)

  try {
    localStorage.setItem(STORAGE_KEY, nextTheme)
  } catch {}
}

export function toggleThemePreference() {
  setThemePreference(theme.value === 'light' ? 'dark' : 'light')
}

export function useThemePreference() {
  if (!initialized) initThemePreference()

  const isLight = computed(() => theme.value === 'light')
  const isDark = computed(() => theme.value === 'dark')

  return {
    theme: readonly(theme),
    isLight,
    isDark,
    setTheme: setThemePreference,
    toggleTheme: toggleThemePreference,
  }
}
