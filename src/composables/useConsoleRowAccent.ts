import { computed } from 'vue'
import { siteColorSchemeIds, siteColorSchemes } from '../data/site/theme'
import { useColorSchemePreference } from './useColorSchemePreference'
import { useThemePreference } from './useThemePreference'

/**
 * Console rows carry no frame any more, so the cursor has to be marked by
 * colour. Each row answers with the accent of a *different* colour scheme,
 * cycling by row index, which both makes movement visible and leaves the live
 * scheme's own accent reserved for the prompt and the resting rows. Accents are
 * read for the live theme mode, so the monochrome schemes stay legible on
 * either background.
 */
export function useConsoleRowAccent() {
  const { colorScheme } = useColorSchemePreference()
  const { theme } = useThemePreference()

  const rowAccents = computed(() => siteColorSchemeIds
    .filter((id) => id !== colorScheme.value)
    .map((id) => siteColorSchemes[id][theme.value].accent))

  /** The colour the row at `index` takes while the cursor rests on it. */
  function rowAccent(index: number) {
    const accents = rowAccents.value
    return accents[index % accents.length] || ''
  }

  return { rowAccent }
}
