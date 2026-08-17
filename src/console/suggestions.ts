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
