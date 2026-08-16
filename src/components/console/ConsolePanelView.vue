<template>
  <section v-if="panel" class="console-panel" aria-live="polite" @keydown="handlePanelKeydown">
    <div class="console-panel__heading">
      <span class="console-panel__marker" aria-hidden="true">›</span>
      <h2>{{ heading }}</h2>
      <button class="console-panel__close" type="button" aria-label="Close panel" title="Close panel" @click="$emit('close')">×</button>
    </div>

    <p v-if="feedback" class="console-panel__feedback">{{ feedback }}</p>

    <div
      v-if="panelOptions !== null"
      ref="rowsRef"
      class="console-panel__rows"
      role="listbox"
      :aria-label="listLabel"
    >
      <button
        v-for="(option, index) in panelOptions"
        :key="option.command"
        class="console-panel__row"
        :class="{ 'is-selected': selectedIndex === index }"
        type="button"
        role="option"
        :aria-selected="selectedIndex === index"
        :data-option-index="index"
        @focus="selectIndex(index)"
        @pointerenter="selectIndex(index)"
        @click="$emit('execute', option.command)"
      >
        <code :class="{ 'is-current': option.current }">{{ option.code }}</code>
        <span>{{ option.label }}</span>
      </button>
      <p v-if="!panelOptions.length" class="console-panel__empty">No options available.</p>
    </div>

    <div v-else class="console-panel__details">
      <p v-for="line in detailLines" :key="line.label">
        <span>{{ line.label }}</span>
        <strong>{{ line.value }}</strong>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { getNotes, getPosts } from '../../data'
import { siteConfig } from '../../data/site/config'
import { listConsoleCommands, type ConsolePanel } from '../../console/commandRegistry'
import { useColorSchemePreference } from '../../composables/useColorSchemePreference'
import { useBackgroundPreference } from '../../composables/useBackgroundPreference'
import { useThemePreference } from '../../composables/useThemePreference'

const props = defineProps<{
  panel: ConsolePanel | null
  value?: string
  currentPath?: string
  feedback?: string
}>()

const emit = defineEmits<{
  execute: [command: string]
  close: []
}>()

const { theme } = useThemePreference()
const { colorScheme, colorSchemeOptions } = useColorSchemePreference()
const { dynamicBackgroundEnabled } = useBackgroundPreference()

const commands = listConsoleCommands()
const notes = getNotes()
const posts = getPosts()
const themeOptions = [
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

type PanelOption = {
  command: string
  code: string
  label: string
  current?: boolean
}

const selectedIndex = ref(0)
const rowsRef = ref<HTMLElement | null>(null)

const heading = computed(() => {
  const labels: Record<string, string> = {
    agent: 'Agent workspace',
    help: 'Command reference',
    list: 'Available commands',
    status: 'Workspace status',
    config: 'Resolved configuration',
    permissions: 'Effective permissions',
    doctor: 'Availability checks',
    model: 'Configured model',
    workspace: 'Workspace details',
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
    list: 'Console commands',
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

const panelOptions = computed<PanelOption[] | null>(() => {
  switch (props.panel) {
    case 'help':
    case 'list':
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
      }))
    case 'color':
      return colorSchemeOptions.value.map((option) => ({
        command: `/color/${option.id}`,
        code: option.id,
        label: option.label,
        current: colorScheme.value === option.id,
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
      return null
  }
})

function selectIndex(index: number) {
  if (!panelOptions.value?.length) return
  selectedIndex.value = Math.min(Math.max(index, 0), panelOptions.value.length - 1)
}

function scrollSelectionIntoView() {
  void nextTick(() => {
    rowsRef.value
      ?.querySelector<HTMLElement>(`[data-option-index="${selectedIndex.value}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function moveSelection(delta: number): boolean {
  const count = panelOptions.value?.length || 0
  if (!count) return false
  selectedIndex.value = (selectedIndex.value + delta + count) % count
  scrollSelectionIntoView()
  return true
}

function activateSelection(): boolean {
  const option = panelOptions.value?.[selectedIndex.value]
  if (!option) return false
  emit('execute', option.command)
  return true
}

function handlePanelKeydown(event: KeyboardEvent) {
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
    selectedIndex.value = 0
    scrollSelectionIntoView()
  },
)

defineExpose({ moveSelection, activateSelection })

const detailLines = computed(() => {
  switch (props.panel) {
    case 'agent':
      return [
        { label: 'name', value: 'Nexus Console' },
        { label: 'version', value: '0.1.0' },
        { label: 'mode', value: 'desktop terminal workspace' },
        { label: 'owner', value: siteConfig.owner },
      ]
    case 'status':
      return [
        { label: 'directory', value: 'browser workspace' },
        { label: 'route', value: props.currentPath || '/' },
        { label: 'theme', value: theme.value },
        { label: 'color', value: colorScheme.value },
        { label: 'background', value: backgroundEnabled.value },
      ]
    case 'config':
      return [
        { label: 'site', value: siteConfig.title },
        { label: 'repository', value: `${siteConfig.githubUser}/${siteConfig.githubRepo}` },
        { label: 'locale', value: 'user preference' },
        { label: 'scroll', value: 'document + terminal viewport' },
      ]
    case 'permissions':
      return [
        { label: 'read', value: 'allow' },
        { label: 'navigate', value: 'allow' },
        { label: 'external links', value: 'ask' },
        { label: 'write / upload', value: 'gated by existing page rules' },
      ]
    case 'doctor':
      return [
        { label: 'router', value: 'ready' },
        { label: 'markdown renderer', value: 'ready' },
        { label: 'capture index', value: 'ready' },
        { label: 'comments', value: 'deferred until route mount' },
      ]
    case 'model':
      return [
        { label: 'site agent', value: 'Nexus Console' },
        { label: 'runner', value: 'existing page integration' },
      ]
    case 'workspace':
      return [
        { label: 'site', value: siteConfig.title },
        { label: 'host', value: typeof window === 'undefined' ? 'static render' : window.location.host },
        { label: 'base', value: import.meta.env.BASE_URL },
      ]
    default:
      return [{ label: 'info', value: props.value || 'No additional details.' }]
  }
})
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
  color: var(--console-muted);
}

.console-panel__rows {
  display: grid;
  gap: 2px;
  margin-top: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.console-panel__row {
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr;
  align-items: baseline;
  gap: 18px;
  min-height: 30px;
  padding: 3px 8px;
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

.console-panel__details {
  display: grid;
  gap: 3px;
  margin: 10px 0 2px 18px;
}

.console-panel__details p {
  display: grid;
  grid-template-columns: minmax(140px, 220px) 1fr;
  gap: 16px;
  margin: 0;
  color: var(--console-muted);
}

.console-panel__details strong {
  color: var(--console-text);
  font-weight: 500;
}

@media (max-width: 1100px) {
  .console-panel__row,
  .console-panel__details p {
    grid-template-columns: minmax(130px, 1fr) 2fr;
  }
}

@media (max-width: 900px) {
  .console-panel {
    display: none;
  }
}
</style>
