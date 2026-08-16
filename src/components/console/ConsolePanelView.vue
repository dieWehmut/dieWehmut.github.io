<template>
  <section v-if="panel" class="console-panel" aria-live="polite">
    <div class="console-panel__heading">
      <span class="console-panel__marker" aria-hidden="true">›</span>
      <h2>{{ heading }}</h2>
      <button class="console-panel__close" type="button" aria-label="Close panel" title="Close panel" @click="$emit('close')">×</button>
    </div>

    <p v-if="feedback" class="console-panel__feedback">{{ feedback }}</p>

    <div v-if="isCommandList" class="console-panel__rows" role="listbox" aria-label="Console commands">
      <button
        v-for="item in commands"
        :key="item.input"
        class="console-panel__row"
        type="button"
        role="option"
        @click="$emit('execute', item.input)"
      >
        <code>{{ item.input }}</code>
        <span>{{ item.description }}</span>
      </button>
    </div>

    <div v-else-if="panel === 'mode'" class="console-panel__rows" role="listbox" aria-label="Display mode options">
      <button class="console-panel__row" type="button" @click="$emit('execute', '/mode/console')">
        <code class="is-current">console</code>
        <span>Nexus Console desktop workspace</span>
      </button>
      <button class="console-panel__row" type="button" @click="$emit('execute', '/mode/classic')">
        <code>classic</code>
        <span>Standard sidebar layout</span>
      </button>
    </div>

    <div v-else-if="panel === 'theme'" class="console-panel__rows" role="listbox" aria-label="Theme options">
      <button v-for="option in themeOptions" :key="option.value" class="console-panel__row" type="button" @click="$emit('execute', `/theme/${option.value}`)">
        <code :class="{ 'is-current': theme === option.value }">{{ option.value }}</code>
        <span>{{ option.label }}</span>
      </button>
    </div>

    <div v-else-if="panel === 'color'" class="console-panel__rows" role="listbox" aria-label="Color scheme options">
      <button v-for="option in colorSchemeOptions" :key="option.id" class="console-panel__row" type="button" @click="$emit('execute', `/color/${option.id}`)">
        <code :class="{ 'is-current': colorScheme === option.id }">{{ option.id }}</code>
        <span>{{ option.label }}</span>
      </button>
    </div>

    <div v-else-if="panel === 'background'" class="console-panel__rows" role="listbox" aria-label="Background options">
      <button v-for="option in backgroundOptions" :key="option.value" class="console-panel__row" type="button" @click="$emit('execute', `/background/${option.value}`)">
        <code :class="{ 'is-current': backgroundEnabled === option.value }">{{ option.value }}</code>
        <span>{{ option.label }}</span>
      </button>
    </div>

    <div v-else-if="panel === 'language'" class="console-panel__rows" role="listbox" aria-label="Language options">
      <button v-for="option in languages" :key="option.value" class="console-panel__row" type="button" @click="$emit('execute', `/language/${option.value}`)">
        <code>{{ option.value }}</code>
        <span>{{ option.label }}</span>
      </button>
    </div>

    <div v-else-if="panel === 'note-picker'" class="console-panel__rows" role="listbox" aria-label="Notes">
      <button v-for="note in notes" :key="note.id" class="console-panel__row" type="button" @click="$emit('execute', `/note/${note.id}`)">
        <code>/note/{{ note.id }}</code>
        <span>{{ note.title || note.id }}</span>
      </button>
      <p v-if="!notes.length" class="console-panel__empty">No notes available.</p>
    </div>

    <div v-else-if="panel === 'post-picker'" class="console-panel__rows" role="listbox" aria-label="Posts">
      <button v-for="post in posts" :key="post.id" class="console-panel__row" type="button" @click="$emit('execute', `/post/${post.id}`)">
        <code>/post/{{ post.id }}</code>
        <span>{{ post.title || post.id }}</span>
      </button>
      <p v-if="!posts.length" class="console-panel__empty">No posts available.</p>
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
import { computed } from 'vue'
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

defineEmits<{
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

const isCommandList = computed(() => props.panel === 'help' || props.panel === 'list')
const backgroundEnabled = computed(() => dynamicBackgroundEnabled.value ? 'on' : 'off')

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
.console-panel__row:focus-visible {
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
