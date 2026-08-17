<template>
  <section v-if="panel" class="console-panel" @keydown="handlePanelKeydown">
    <div class="console-panel__heading">
      <span class="console-panel__marker" aria-hidden="true">›</span>
      <h2>{{ heading }}</h2>
      <button class="console-panel__close" type="button" aria-label="Back to previous menu" title="Back to previous menu" @click="closePanel">×</button>
    </div>

    <p v-if="feedback" class="console-panel__feedback">{{ feedback }}</p>

    <div
      ref="rowsRef"
      :id="listboxId"
      class="console-panel__rows"
      role="listbox"
      :aria-label="listLabel"
    >
      <button
        v-for="{ option, index } in visibleOptions"
        :id="optionId(index)"
        :key="option.command"
        class="console-panel__row"
        :class="{ 'is-selected': selectedIndex === index }"
        type="button"
        role="option"
        :aria-selected="selectedIndex === index"
        :data-option-index="index"
        @focus="selectIndex(index)"
        @pointerenter="selectIndex(index)"
        @click="commitIndex(index)"
      >
        <code :class="{ 'is-current': option.current }">{{ option.code }}</code>
        <span>{{ option.label }}</span>
      </button>
      <p v-if="!panelOptions.length" class="console-panel__empty">No options available.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { getNotes, getPosts } from '../../data'
import { siteConfig } from '../../data/site/config'
import { listConsoleCommands, type ConsolePanel } from '../../console/commandRegistry'
import { CONSOLE_OPTION_WINDOW, consoleOptionWindowStart } from '../../console/suggestions'
import { useColorSchemePreference } from '../../composables/useColorSchemePreference'
import { useBackgroundPreference } from '../../composables/useBackgroundPreference'
import { useThemePreference, type ThemeMode } from '../../composables/useThemePreference'
import type { SiteColorScheme } from '../../types/content'

const props = defineProps<{
  panel: ConsolePanel | null
  feedback?: string
  listboxId: string
}>()

const emit = defineEmits<{
  execute: [command: string]
  close: []
  'selection-change': [optionId: string]
}>()

const { theme, setTheme } = useThemePreference()
const { colorScheme, colorSchemeOptions, setColorScheme } = useColorSchemePreference()
const { dynamicBackgroundEnabled } = useBackgroundPreference()

const commands = listConsoleCommands({
  infra: siteConfig.enableInfra,
  project: siteConfig.enableProject,
})
const notes = getNotes()
const posts = getPosts()
const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'dark', label: 'Low-light terminal palette' },
  { value: 'light', label: 'High-contrast light palette' },
]
const backgroundOptions = [
  { value: 'on', label: 'Keep the animated site background enabled' },
  { value: 'off', label: 'Disable the animated site background' },
]
const languages = [
  { value: 'zh', label: '简体中文' },
  { value: 'zh_tw', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'de', label: 'Deutsch' },
  { value: 'la', label: 'Latina' },
]

/**
 * A preference this row can apply the moment the cursor lands on it, so the
 * selection doubles as a live preview. Committing (click / Enter) just keeps it.
 */
type LivePreview =
  | { kind: 'theme'; value: ThemeMode }
  | { kind: 'color'; value: SiteColorScheme }

type PanelOption = {
  command: string
  code: string
  label: string
  current?: boolean
  livePreview?: LivePreview
}

const selectedIndex = ref(0)
const rowsRef = ref<HTMLElement | null>(null)

const heading = computed(() => {
  const labels: Record<string, string> = {
    help: 'Command reference',
    theme: 'Select theme',
    color: 'Select color scheme',
    background: 'Dynamic background',
    language: 'Select language',
    mode: 'Select display mode',
    'note-picker': 'Select a note',
    'post-picker': 'Select a post',
  }
  return labels[props.panel || ''] || 'Console'
})

const backgroundEnabled = computed(() => dynamicBackgroundEnabled.value ? 'on' : 'off')

const listLabel = computed(() => {
  const labels: Partial<Record<ConsolePanel, string>> = {
    help: 'Console commands',
    mode: 'Display mode options',
    theme: 'Theme options',
    color: 'Color scheme options',
    background: 'Background options',
    language: 'Language options',
    'note-picker': 'Notes',
    'post-picker': 'Posts',
  }
  return props.panel ? labels[props.panel] || 'Console options' : 'Console options'
})

const panelOptions = computed<PanelOption[]>(() => {
  switch (props.panel) {
    case 'help':
      return commands.map((item) => ({
        command: item.input,
        code: item.input,
        label: item.description,
      }))
    case 'mode':
      return [
        { command: '/mode/console', code: 'console', label: 'Nexus Console desktop workspace', current: true },
        { command: '/mode/classic', code: 'classic', label: 'Standard sidebar layout' },
      ]
    case 'theme':
      return themeOptions.map((option) => ({
        command: `/theme/${option.value}`,
        code: option.value,
        label: option.label,
        current: theme.value === option.value,
        livePreview: { kind: 'theme', value: option.value },
      }))
    case 'color':
      return colorSchemeOptions.value.map((option) => ({
        command: `/color/${option.id}`,
        code: option.id,
        label: option.label,
        current: colorScheme.value === option.id,
        livePreview: { kind: 'color', value: option.id },
      }))
    case 'background':
      return backgroundOptions.map((option) => ({
        command: `/background/${option.value}`,
        code: option.value,
        label: option.label,
        current: backgroundEnabled.value === option.value,
      }))
    case 'language':
      return languages.map((option) => ({
        command: `/language/${option.value}`,
        code: option.value,
        label: option.label,
      }))
    case 'note-picker':
      return notes.map((note) => ({
        command: `/note/${encodeURIComponent(note.id)}`,
        code: `/note/${note.id}`,
        label: note.title || note.id,
      }))
    case 'post-picker':
      return posts.map((post) => ({
        command: `/post/${encodeURIComponent(post.id)}`,
        code: `/post/${post.id}`,
        label: post.title || post.id,
      }))
    default:
      return []
  }
})

/**
 * The rows actually rendered. Like the suggestion list, the panel shows a fixed
 * number of options and travels the window with the selection, so a long list
 * such as the note picker never stretches the dock.
 */
const visibleOptions = computed(() => {
  const start = consoleOptionWindowStart(selectedIndex.value, panelOptions.value.length)
  return panelOptions.value
    .slice(start, start + CONSOLE_OPTION_WINDOW)
    .map((option, offset) => ({ option, index: start + offset }))
})

/**
 * The preference value that was live before the cursor started roaming. Kept
 * outside reactive state because it only ever feeds the rollback, never render.
 */
let previewBaseline: LivePreview | null = null

function applyPreference(preference: LivePreview) {
  if (preference.kind === 'theme') setTheme(preference.value)
  else setColorScheme(preference.value)
}

function currentPreference(kind: LivePreview['kind']): LivePreview {
  return kind === 'theme'
    ? { kind: 'theme', value: theme.value }
    : { kind: 'color', value: colorScheme.value }
}

function previewIndex(index: number) {
  const preference = panelOptions.value?.[index]?.livePreview
  if (!preference) return
  if (!previewBaseline) previewBaseline = currentPreference(preference.kind)
  applyPreference(preference)
}

/** Roll the roaming preview back to whatever was live before it started. */
function cancelPreview() {
  if (!previewBaseline) return
  applyPreference(previewBaseline)
  previewBaseline = null
}

function closePanel() {
  cancelPreview()
  emit('close')
}

/** Keep the previewed preference: the roaming value is now the chosen one. */
function commitIndex(index: number) {
  const option = panelOptions.value?.[index]
  if (!option) return false
  previewBaseline = null
  emit('execute', option.command)
  return true
}

function selectIndex(index: number) {
  if (!panelOptions.value?.length) {
    emit('selection-change', '')
    return
  }
  selectedIndex.value = Math.min(Math.max(index, 0), panelOptions.value.length - 1)
  previewIndex(selectedIndex.value)
  emit('selection-change', optionId(selectedIndex.value))
}

function optionId(index: number) {
  return `${props.listboxId}-option-${index}`
}

function moveSelection(delta: number): boolean {
  const count = panelOptions.value?.length || 0
  if (!count) return false
  selectedIndex.value = (selectedIndex.value + delta + count) % count
  previewIndex(selectedIndex.value)
  emit('selection-change', optionId(selectedIndex.value))
  return true
}

function activateSelection(): boolean {
  return commitIndex(selectedIndex.value)
}

function handlePanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancelPreview()
    emit('close')
    return
  }

  const delta = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    ? -1
    : event.key === 'ArrowDown' || event.key === 'ArrowRight'
      ? 1
      : 0
  if (!delta || !moveSelection(delta)) return
  event.preventDefault()
  void nextTick(() => {
    rowsRef.value
      ?.querySelector<HTMLButtonElement>(`[data-option-index="${selectedIndex.value}"]`)
      ?.focus()
  })
}

watch(
  [() => props.panel, () => panelOptions.value?.length || 0],
  () => {
    cancelPreview()
    const options = panelOptions.value || []
    // Start on the option that is already live, so merely opening the panel
    // previews nothing — only moving the cursor does.
    const currentIndex = options.findIndex((option) => option.current)
    selectedIndex.value = currentIndex >= 0 ? currentIndex : 0
    emit('selection-change', options.length ? optionId(selectedIndex.value) : '')
  },
  { immediate: true },
)

defineExpose({ moveSelection, activateSelection })
</script>

<style scoped>
.console-panel {
  border-top: 1px solid var(--console-border);
  padding: 14px 0 10px;
  color: var(--console-text);
}

.console-panel__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding-left: var(--console-prompt-indent, 34px);
}

.console-panel__marker {
  color: var(--console-accent);
  font-size: 24px;
  line-height: 1;
}

.console-panel h2 {
  margin: 0;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0;
}

.console-panel__close {
  margin-left: auto;
  border: 0;
  color: var(--console-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 1.25rem;
  line-height: 1;
}

.console-panel__close:hover,
.console-panel__close:focus-visible {
  color: var(--console-accent);
  outline: none;
}

.console-panel__feedback,
.console-panel__empty {
  margin: 8px 0;
  padding-left: var(--console-prompt-indent, 34px);
  color: var(--console-muted);
}

.console-panel__rows {
  display: grid;
  gap: 2px;
  margin-top: 8px;
}

.console-panel__row {
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr;
  align-items: baseline;
  gap: 18px;
  min-height: 30px;
  padding: 3px 9px 3px var(--console-prompt-indent, 34px);
  border: 1px solid transparent;
  color: var(--console-muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.console-panel__row:hover,
.console-panel__row:focus-visible,
.console-panel__row.is-selected {
  border-color: var(--console-border-strong);
  color: var(--console-text);
  background: var(--console-selection);
  outline: none;
}

.console-panel__row code {
  color: var(--console-accent);
  font: inherit;
}

.console-panel__row code.is-current {
  font-weight: 700;
}

@media (max-width: 1100px) {
  .console-panel__row {
    grid-template-columns: minmax(130px, 1fr) 2fr;
  }
}

@media (max-width: 900px) {
  .console-panel {
    display: none;
  }
}
</style>
