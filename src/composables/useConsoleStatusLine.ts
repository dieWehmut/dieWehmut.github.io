import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBackgroundPreference } from './useBackgroundPreference'
import { useColorSchemePreference } from './useColorSchemePreference'
import { useConsoleIconPreference } from './useConsoleIconPreference'
import { useDisplayModePreference } from './useDisplayModePreference'
import { useThemePreference, themeModeNames } from './useThemePreference'

export interface ConsoleStatusSegment {
  /** Stable identity for the rendered span, and the hook a test or theme can aim at. */
  key: string
  value: string
}

/**
 * The line under the prompt reads back the state a command would change: where
 * the reader currently is, plus every preference `/mode`, `/theme`, `/color`,
 * `/icon`, `/language` and `/background` own.
 *
 * It is deliberately one flat array rather than a fixed row of spans — a fork
 * adds a reading by appending an entry here, and the template keeps rendering
 * whatever it is handed, separators and all.
 */
export function useConsoleStatusLine(): { segments: ComputedRef<ConsoleStatusSegment[]> } {
  const route = useRoute()
  const { activeMode } = useDisplayModePreference()
  const { theme } = useThemePreference()
  const { colorScheme } = useColorSchemePreference()
  const { dynamicBackgroundEnabled } = useBackgroundPreference()
  const { iconForm } = useConsoleIconPreference()
  const { locale } = useI18n()

  const segments = computed<ConsoleStatusSegment[]>(() => [
    { key: 'path', value: route.path },
    { key: 'mode', value: activeMode.value },
    // The reading is the name `/theme` answers to, not the one the value is stored
    // under, so what the line reports is what the reader could type back.
    { key: 'theme', value: themeModeNames[theme.value] },
    { key: 'color', value: colorScheme.value },
    // The portrait plate cycles this by click and nothing else says so out loud,
    // which left the one appearance preference with no reading of its own.
    { key: 'icon', value: iconForm.value },
    { key: 'language', value: locale.value },
    // Every other reading is a name that says what it is on its own. This one is
    // a switch, so it carries the name of the switch it reports.
    { key: 'background', value: `background ${dynamicBackgroundEnabled.value ? 'on' : 'off'}` },
  ])

  return { segments }
}
