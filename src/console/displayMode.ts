export type DisplayMode = 'console' | 'standard'
export type ConsoleDisplayMode = DisplayMode

export const DEFAULT_DISPLAY_MODE: DisplayMode = 'console'

export function isDisplayMode(value: unknown): value is DisplayMode {
  return value === 'console' || value === 'standard'
}

/** Translate values from the old view-mode preference. */
export function migrateLegacyDisplayMode(value: unknown): DisplayMode | null {
  if (value === 'console' || value === '1' || value === 'true') return 'console'
  if (value === 'standard' || value === 'classic' || value === '0' || value === 'false') {
    return 'standard'
  }
  return null
}

// Kept as a descriptive alias for pure callers and the standalone contract.
export const migrateStoredDisplayMode = migrateLegacyDisplayMode

/** Resolve the raw preference, keeping Console as the first-visit default. */
export function resolveStoredDisplayMode(
  storedValue: unknown,
  legacyValue: unknown,
  _isDesktop: boolean,
): DisplayMode {
  return migrateLegacyDisplayMode(storedValue)
    || migrateLegacyDisplayMode(legacyValue)
    || DEFAULT_DISPLAY_MODE
}

/** Mobile always uses the existing standard shell, regardless of saved mode. */
export function resolveActiveDisplayMode(
  storedMode: DisplayMode,
  isDesktop: boolean,
): DisplayMode {
  return isDesktop ? storedMode : 'standard'
}
