import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { addConsoleHistoryEntry } from '../console/history'
import { parseConsoleInput } from '../console/commandParser'
import {
  listConsoleCommands,
  resolveConsoleCommand,
  type ConsolePanel,
  type ConsoleResolution,
} from '../console/commandRegistry'
import { useColorSchemePreference } from './useColorSchemePreference'
import { useDisplayModePreference } from './useDisplayModePreference'
import { useThemePreference } from './useThemePreference'
import { useBackgroundPreference } from './useBackgroundPreference'
import type { SiteColorScheme } from '../types/content'

const commandInput = ref('')
const history = ref<string[]>([])
const historyCursor = ref<number | null>(null)
const suggestionCursor = ref(-1)
const activePanel = ref<{ panel: ConsolePanel; value?: string } | null>(null)
const lastResolution = ref<ConsoleResolution | null>(null)
const feedback = ref('')
const executing = ref(false)

function normalizePrefix(value: string) {
  return value.trim().toLowerCase()
}

export function useConsoleSession() {
  const router = useRouter()
  const displayMode = useDisplayModePreference()
  const theme = useThemePreference()
  const color = useColorSchemePreference()
  const background = useBackgroundPreference()

  const suggestions = computed(() => {
    const prefix = normalizePrefix(commandInput.value)
    if (!prefix.startsWith('/')) return []

    const options = listConsoleCommands()
    if (prefix === '/') return options.slice(0, 8)
    return options.filter((option) => option.input.startsWith(prefix)).slice(0, 8)
  })

  function resetNavigation() {
    historyCursor.value = null
    suggestionCursor.value = -1
  }

  function setInput(value: string) {
    commandInput.value = value
    resetNavigation()
  }

  function selectSuggestion(value: string) {
    setInput(value)
    void nextTick(() => {
      const input = document.querySelector<HTMLInputElement>('[data-console-input]')
      input?.focus()
      input?.setSelectionRange(input.value.length, input.value.length)
    })
  }

  function setPanel(panel: ConsolePanel | null, value?: string) {
    activePanel.value = panel ? { panel, value } : null
  }

  async function applyPanelValue(panel: ConsolePanel, value?: string) {
    if (!value) return

    if (panel === 'theme' && (value === 'light' || value === 'dark')) {
      theme.setTheme(value)
      feedback.value = `Theme set to ${value}.`
    } else if (panel === 'color' && color.colorSchemeOptions.value.some((option) => option.id === value)) {
      color.setColorScheme(value as SiteColorScheme)
      feedback.value = `Color scheme set to ${value}.`
    } else if (panel === 'background' && (value === 'on' || value === 'off')) {
      background.setDynamicBackgroundEnabled(value === 'on')
      feedback.value = `Dynamic background ${value}.`
    }
  }

  async function executeCommand(rawValue = commandInput.value): Promise<boolean> {
    if (executing.value) return false
    const parsed = parseConsoleInput(rawValue)
    if (parsed.kind === 'silent') return false

    const resolution = resolveConsoleCommand(parsed)
    if (resolution.kind === 'silent') return false

    executing.value = true
    lastResolution.value = resolution
    history.value = addConsoleHistoryEntry(history.value, parsed.canonicalInput)
    resetNavigation()
    commandInput.value = ''
    feedback.value = ''

    try {
      if (resolution.kind === 'route') {
        activePanel.value = null
        await router.push(resolution.path)
      } else if (resolution.kind === 'mode') {
        displayMode.setDisplayMode(resolution.mode)
        feedback.value = resolution.mode === 'console'
          ? 'Nexus Console enabled.'
          : 'Standard layout enabled.'
        activePanel.value = null
      } else {
        setPanel(resolution.panel, resolution.value)
        await applyPanelValue(resolution.panel, resolution.value)
      }
    } catch {
      feedback.value = 'Navigation could not be completed.'
    } finally {
      executing.value = false
    }

    return true
  }

  function moveHistory(delta: number) {
    if (!history.value.length) return
    const current = historyCursor.value === null
      ? history.value.length
      : historyCursor.value
    const next = Math.min(Math.max(current + delta, 0), history.value.length)
    historyCursor.value = next
    commandInput.value = next === history.value.length ? '' : history.value[next] || ''
    suggestionCursor.value = -1
  }

  function moveSuggestion(delta: number) {
    if (!suggestions.value.length) return false
    const next = suggestionCursor.value < 0
      ? delta > 0 ? 0 : suggestions.value.length - 1
      : Math.min(Math.max(suggestionCursor.value + delta, 0), suggestions.value.length - 1)
    suggestionCursor.value = next
    return true
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = suggestions.value[suggestionCursor.value]
      if (selected) selectSuggestion(selected.input)
      else void executeCommand()
      return
    }

    if (event.key === 'ArrowUp') {
      if (moveSuggestion(-1)) event.preventDefault()
      else if (!commandInput.value.trim()) {
        event.preventDefault()
        moveHistory(-1)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      if (moveSuggestion(1)) event.preventDefault()
      else if (historyCursor.value !== null) {
        event.preventDefault()
        moveHistory(1)
      }
      return
    }

    if (event.key === 'Escape') {
      activePanel.value = null
      suggestionCursor.value = -1
    }
  }

  return {
    commandInput,
    history,
    suggestions,
    suggestionCursor,
    activePanel,
    lastResolution,
    feedback,
    executing,
    setInput,
    selectSuggestion,
    executeCommand,
    handleInputKeydown,
    moveHistory,
    setPanel,
  }
}
