import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { addConsoleHistoryEntry } from '../console/history'
import { parseConsoleInput } from '../console/commandParser'
import { isKnownConsoleCommandTarget, type ConsoleCommandTargetCatalog } from '../console/commandTarget'
import { filterConsoleSuggestions } from '../console/suggestions'
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
import { useConsoleCommentSession } from './useConsoleCommentSession'
import { requestConsoleOutputReveal } from './useConsoleOutputReveal'
import type { SiteColorScheme } from '../types/content'
import { getNotes, getPosts, getTagGroups } from '../data'
import { siteConfig } from '../data/site/config'
import { consoleEscapeTarget, moveConsoleSelection } from '../console/selection'

const commandInput = ref('')
const history = ref<string[]>([])
const historyCursor = ref<number | null>(null)
const suggestionCursor = ref(-1)
const activePanel = ref<{ panel: ConsolePanel; value?: string } | null>(null)
const lastResolution = ref<ConsoleResolution | null>(null)
const feedback = ref('')
const executing = ref(false)
const panelStack = ref<Array<{ panel: ConsolePanel; value?: string }>>([])
const menuReturnState = ref<{ input: string; cursor: number } | null>(null)
/**
 * The panel that was collapsed by choosing one of its values, kept only so the
 * next Escape can put it back. Any other input drops it: "the previous step"
 * means the step just taken, not one from minutes ago.
 */
const committedPanel = ref<{
  panel: ConsolePanel
  stack: Array<{ panel: ConsolePanel; value?: string }>
  menu: { input: string; cursor: number } | null
} | null>(null)

function normalizePrefix(value: string) {
  return value.trim().toLowerCase()
}

export function useConsoleSession() {
  const router = useRouter()
  const { locale } = useI18n()
  const displayMode = useDisplayModePreference()
  const theme = useThemePreference()
  const color = useColorSchemePreference()
  const background = useBackgroundPreference()
  const comments = useConsoleCommentSession()
  const commandAvailability = {
    infra: siteConfig.enableInfra,
    project: siteConfig.enableProject,
  }

  const suggestions = computed(() => {
    const prefix = normalizePrefix(commandInput.value)
    if (!prefix.startsWith('/')) return []

    const dynamicOptions = prefix.startsWith('/note/')
      ? getNotes().map((note) => ({ input: `/note/${note.id}`, description: note.title || note.id }))
      : prefix.startsWith('/post/')
        ? getPosts().map((post) => ({ input: `/post/${post.id}`, description: post.title || post.id }))
        : prefix.startsWith('/tags/')
          ? getTagGroups().map((group) => ({ input: `/tags/${group.tag}`, description: `${group.count} entries` }))
          : []

    return filterConsoleSuggestions(prefix, listConsoleCommands(commandAvailability), dynamicOptions)
  })

  function resetNavigation() {
    historyCursor.value = null
    suggestionCursor.value = -1
  }

  function setInput(value: string) {
    commandInput.value = value
    committedPanel.value = null
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
    if (!panel) {
      clearPanelNavigation()
      return
    }
    activePanel.value = { panel, value }
  }

  function clearPanelNavigation() {
    activePanel.value = null
    panelStack.value = []
    menuReturnState.value = null
    committedPanel.value = null
  }

  /**
   * A chosen value ends the interaction: the rows have nothing left to offer, so
   * the dock drops back to the bare prompt instead of sitting there showing the
   * menu the choice came from. The panel is remembered as the Escape
   * destination, so revisiting or changing the choice is one key away.
   */
  function collapseCommittedPanel(panel: ConsolePanel) {
    committedPanel.value = {
      panel,
      stack: [...panelStack.value],
      menu: menuReturnState.value,
    }
    activePanel.value = null
    feedback.value = ''
  }

  function reopenCommittedPanel() {
    const committed = committedPanel.value
    if (!committed) return false

    panelStack.value = committed.stack
    menuReturnState.value = committed.menu
    activePanel.value = { panel: committed.panel }
    committedPanel.value = null
    feedback.value = ''
    commandInput.value = ''
    resetNavigation()
    return true
  }

  function returnToPreviousMenu() {
    if (activePanel.value) {
      const previousPanel = panelStack.value.pop()
      if (previousPanel) {
        activePanel.value = previousPanel
        feedback.value = ''
        return true
      }

      const previousMenu = menuReturnState.value
      const target = previousMenu?.input
        ?? consoleEscapeTarget({ input: commandInput.value, hasPanel: true })
      activePanel.value = null
      menuReturnState.value = null
      feedback.value = ''
      historyCursor.value = null
      commandInput.value = target || ''
      suggestionCursor.value = previousMenu?.cursor ?? -1
      return true
    }

    const target = consoleEscapeTarget({ input: commandInput.value, hasPanel: false })
    if (target === null) return reopenCommittedPanel()
    commandInput.value = target
    feedback.value = ''
    resetNavigation()
    return true
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
    } else if (panel === 'language' && ['zh', 'zh_tw', 'en', 'ja', 'de', 'la'].includes(value)) {
      locale.value = value
      try {
        localStorage.setItem('locale', value)
      } catch {
        // Locale remains active in memory when storage is unavailable.
      }
      feedback.value = `Language set to ${value}.`
    }
  }

  async function executeCommand(rawValue = commandInput.value): Promise<boolean> {
    if (executing.value) return false
    const parsed = parseConsoleInput(rawValue)
    if (parsed.kind === 'silent') return false

    const resolution = resolveConsoleCommand(parsed, commandAvailability)
    if (resolution.kind === 'silent') return false

    if (resolution.kind === 'route') {
      const catalog: ConsoleCommandTargetCatalog = {
        postIds: getPosts().map((post) => post.id),
        noteIds: getNotes().map((note) => note.id),
        tags: getTagGroups().map((group) => group.tag),
      }
      if (
        (parsed.segments[0] === 'capture' || parsed.segments[0] === 'tags')
        && parsed.segments[1] !== undefined
      ) {
        const { getCaptureRouteIds, getCaptureTagCounts } = await import('../data/capture')
        if (parsed.segments[0] === 'capture') catalog.captureIds = getCaptureRouteIds()
        else catalog.tags = [...(catalog.tags || []), ...getCaptureTagCounts().keys()]
      }
      if (!isKnownConsoleCommandTarget(parsed, catalog)) return false
    }

    if (resolution.kind === 'comment' && !(await comments.ensureTarget())) return false

    const sourceMenu = {
      input: commandInput.value,
      cursor: suggestionCursor.value,
    }
    const sourcePanel = activePanel.value ? { ...activePanel.value } : null

    executing.value = true
    lastResolution.value = resolution
    history.value = addConsoleHistoryEntry(history.value, parsed.canonicalInput)
    resetNavigation()
    commandInput.value = ''
    feedback.value = ''
    committedPanel.value = null

    try {
      if (resolution.kind === 'route') {
        clearPanelNavigation()
        await router.push(resolution.path)
        requestConsoleOutputReveal(resolution.path.split(/[?#]/)[0] === '/' ? 'root' : 'route')
      } else if (resolution.kind === 'mode') {
        displayMode.setDisplayMode(resolution.mode)
        feedback.value = resolution.mode === 'console'
          ? 'Nexus Console enabled.'
          : 'Standard layout enabled.'
        clearPanelNavigation()
      } else if (resolution.kind === 'comment') {
        // The thread is already on the page; `/comment` only takes the user to
        // it. Leaving feedback empty keeps the dock collapsed so nothing hides
        // the comment box the command just scrolled to.
        clearPanelNavigation()
        requestConsoleOutputReveal('comment')
      } else {
        const commits = Boolean(resolution.value)
        if (!commits && sourcePanel && sourcePanel.panel !== resolution.panel) {
          panelStack.value.push(sourcePanel)
        } else if (!commits && !sourcePanel) {
          menuReturnState.value = {
            input: sourceMenu.input.startsWith('/') ? sourceMenu.input : '/',
            cursor: sourceMenu.cursor,
          }
        }
        setPanel(resolution.panel, resolution.value)
        await applyPanelValue(resolution.panel, resolution.value)
        if (commits) collapseCommittedPanel(resolution.panel)
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
    suggestionCursor.value = moveConsoleSelection(
      suggestionCursor.value,
      delta,
      suggestions.value.length,
    )
    return true
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = suggestions.value[suggestionCursor.value]
      if (selected) void executeCommand(selected.input)
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
      if (returnToPreviousMenu()) event.preventDefault()
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
    returnToPreviousMenu,
  }
}
