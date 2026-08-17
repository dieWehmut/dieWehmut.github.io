/**
 * Suggestion filtering, kept free of Vue and of relative imports so the tests
 * can transpile this module and load it from a `data:` URL.
 */
export interface ConsoleSuggestion {
  input: string
  description: string
}

/**
 * How deep the typed prefix has drilled. `/` and `/mo` are still at the root,
 * while a trailing slash (`/mode/`) opens the next level.
 */
export function typedConsoleDepth(prefix: string): number {
  const segments = prefix.split('/').filter(Boolean).length
  return Math.max(1, segments + (prefix.endsWith('/') ? 1 : 0))
}

function commandDepth(input: string): number {
  return input.split('/').filter(Boolean).length
}

/**
 * Sub-entries such as `/mode/classic` stay hidden until their parent has been
 * spelled out, so the root listing is one line per command.
 */
export function filterConsoleSuggestions(
  prefix: string,
  rootOptions: readonly ConsoleSuggestion[],
  dynamicOptions: readonly ConsoleSuggestion[] = [],
): ConsoleSuggestion[] {
  const normalized = prefix.trim().toLowerCase()
  if (!normalized.startsWith('/')) return []

  const depth = typedConsoleDepth(normalized)
  const withinDepth = (option: ConsoleSuggestion) => commandDepth(option.input) <= depth
  const options = rootOptions.filter(withinDepth)
  if (normalized === '/') return [...options]

  return [...dynamicOptions.filter(withinDepth), ...options]
    .filter((option) => option.input.toLowerCase().startsWith(normalized))
}

/** How many option rows the console shows at once, suggestions and panels alike. */
export const CONSOLE_OPTION_WINDOW = 5

/**
 * First index of the visible window. The cursor is kept centred while there is
 * room on both sides, then the window parks against whichever end it reaches,
 * so a list of any length still occupies exactly `size` rows.
 */
export function consoleOptionWindowStart(
  cursor: number,
  total: number,
  size: number = CONSOLE_OPTION_WINDOW,
): number {
  if (total <= size) return 0
  const centred = (cursor < 0 ? 0 : cursor) - Math.floor(size / 2)
  return Math.min(Math.max(centred, 0), total - size)
}
