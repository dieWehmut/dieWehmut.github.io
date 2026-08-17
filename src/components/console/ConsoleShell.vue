<template>
  <section class="console-shell" aria-label="Nexus Console">
    <div v-if="history.length" class="console-shell__history" aria-label="Recent commands">
      <span class="console-shell__history-label">recent</span>
      <button v-for="entry in history" :key="entry" type="button" @click="executeCommand(entry)">{{ entry }}</button>
    </div>

    <form class="console-shell__prompt" @submit.prevent="executeCommand()">
      <label class="console-shell__prompt-symbol" for="console-command-input">&gt;_</label>
      <input
        id="console-command-input"
        ref="inputRef"
        data-console-input
        class="console-shell__input"
        role="combobox"
        :value="commandInput"
        :aria-expanded="Boolean(activeListboxId)"
        :aria-controls="activeListboxId || undefined"
        :aria-activedescendant="activeOptionId || undefined"
        aria-autocomplete="list"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        inputmode="text"
        placeholder="/help"
        aria-label="Console command"
        @input="setInput(($event.target as HTMLInputElement).value)"
        @keydown="handleShellKeydown"
      />
      <button class="console-shell__submit" type="submit" aria-label="Run command" title="Run command">Enter</button>
    </form>

    <div
      v-if="suggestions.length || activePanel || (feedback && !activePanel)"
      class="console-shell__transient"
    >
      <div
        v-if="suggestions.length"
        :id="suggestionListboxId"
        ref="suggestionsRef"
        class="console-shell__suggestions"
        role="listbox"
        aria-label="Command suggestions"
      >
        <button
          v-for="(suggestion, index) in suggestions"
          :id="suggestionOptionId(index)"
          :key="suggestion.input"
          class="console-shell__suggestion"
          :class="{ 'is-selected': suggestionCursor === index }"
          type="button"
          role="option"
          tabindex="-1"
          :aria-selected="suggestionCursor === index"
          :data-suggestion-index="index"
          @click="executeCommand(suggestion.input)"
        >
          <code>{{ suggestion.input }}</code>
          <span>{{ suggestion.description }}</span>
        </button>
      </div>

      <p
        v-if="feedback && !activePanel"
        class="console-shell__feedback"
        role="status"
        aria-live="polite"
      >
        {{ feedback }}
      </p>

      <ConsolePanelView
        ref="panelRef"
        :panel="activePanel?.panel || null"
        :value="activePanel?.value"
        :feedback="feedback"
        :listbox-id="panelListboxId"
        @execute="executeCommand"
        @close="closePanel"
        @selection-change="handlePanelSelectionChange"
      />
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ConsolePanelView from './ConsolePanelView.vue'
import { useConsoleSession } from '../../composables/useConsoleSession'
import type { ConsolePanel } from '../../console/commandRegistry'

const inputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<InstanceType<typeof ConsolePanelView> | null>(null)
const suggestionsRef = ref<HTMLElement | null>(null)
const panelActiveOptionId = ref('')
const suggestionListboxId = 'console-command-suggestions'
const panelListboxId = 'console-panel-options'
const optionPanels = new Set<ConsolePanel>([
  'help',
  'mode',
  'theme',
  'color',
  'background',
  'language',
  'note-picker',
  'post-picker',
])

const {
  commandInput,
  history,
  suggestions,
  suggestionCursor,
  activePanel,
  feedback,
  setInput,
  executeCommand: executeSessionCommand,
  handleInputKeydown: handleSessionInputKeydown,
  setPanel,
  returnToPreviousMenu,
} = useConsoleSession()

const hasPanelListbox = computed(() => Boolean(
  activePanel.value && optionPanels.has(activePanel.value.panel),
))
const activeListboxId = computed(() => {
  if (suggestions.value.length) return suggestionListboxId
  return hasPanelListbox.value ? panelListboxId : ''
})
const activeOptionId = computed(() => {
  if (suggestions.value.length && suggestionCursor.value >= 0) {
    return suggestionOptionId(suggestionCursor.value)
  }
  return hasPanelListbox.value ? panelActiveOptionId.value : ''
})

function suggestionOptionId(index: number) {
  return `${suggestionListboxId}-option-${index}`
}

function handlePanelSelectionChange(optionId: string) {
  panelActiveOptionId.value = optionId
}

async function executeCommand(value?: string) {
  const handled = await executeSessionCommand(value)
  if (handled) void nextTick(() => inputRef.value?.focus())
  return handled
}

function closePanel() {
  panelActiveOptionId.value = ''
  returnToPreviousMenu()
  void nextTick(() => inputRef.value?.focus())
}

function handleShellKeydown(event: KeyboardEvent) {
  if (activePanel.value && !commandInput.value.trim()) {
    const delta = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
      ? -1
      : event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : 0
    if (delta && panelRef.value?.moveSelection(delta)) {
      event.preventDefault()
      return
    }
    if (event.key === 'Enter' && panelRef.value?.activateSelection()) {
      event.preventDefault()
      return
    }
  }
  handleSessionInputKeydown(event)
}

watch(suggestionCursor, (index) => {
  if (index < 0) return
  void nextTick(() => {
    suggestionsRef.value
      ?.querySelector<HTMLElement>(`[data-suggestion-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
})

watch(activePanel, (panel) => {
  if (!panel) panelActiveOptionId.value = ''
})

onMounted(() => {
  setPanel(null)
  void nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.console-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  max-height: calc(100vh - 72px);
  min-height: 0;
  overflow: hidden;
  color: var(--console-text);
  border-top: 1px solid var(--console-border-strong);
  background: var(--console-bg);
  font-family: var(--console-font);
}

.console-shell__history {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px 10px;
  min-height: 28px;
  padding: 2px 8px;
  overflow-x: auto;
  border-bottom: 1px solid var(--console-border);
  color: var(--console-muted);
  font-size: 0.76rem;
}

.console-shell__history-label {
  color: var(--console-dim);
  text-transform: uppercase;
  letter-spacing: 0;
}

.console-shell__history button {
  flex: 0 0 auto;
  padding: 2px 5px;
  border: 1px solid transparent;
  color: var(--console-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.console-shell__history button:hover,
.console-shell__history button:focus-visible {
  border-color: var(--console-border-strong);
  color: var(--console-accent);
  outline: none;
}

.console-shell__prompt {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  min-height: 46px;
  border-top: 0;
  border-bottom: 1px solid var(--console-border-strong);
  background: var(--console-surface);
}

.console-shell__transient {
  flex: 0 1 auto;
  min-height: 0;
  max-height: min(38vh, calc(100vh - 190px));
  overflow-y: auto;
  border-bottom: 1px solid var(--console-border);
  scrollbar-color: var(--console-border-strong) transparent;
  scrollbar-width: thin;
}

.console-shell__transient::-webkit-scrollbar {
  width: 8px;
}

.console-shell__transient::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 0;
  background: var(--console-border-strong);
  background-clip: padding-box;
}

.console-shell__feedback {
  margin: 0;
  padding: 9px 8px;
  color: var(--console-muted);
}

.console-shell__prompt-symbol {
  flex: 0 0 auto;
  padding: 0 12px;
  color: var(--console-accent);
  font-weight: 700;
}

.console-shell__input {
  min-width: 0;
  flex: 1;
  height: 44px;
  border: 0;
  color: var(--console-text);
  outline: none;
  background: transparent;
  caret-color: var(--console-accent);
  font: inherit;
  font-size: 0.95rem;
}

.console-shell__input::placeholder {
  color: var(--console-dim);
}

.console-shell__submit {
  flex: 0 0 auto;
  height: 30px;
  margin-right: 8px;
  padding: 0 9px;
  border: 1px solid var(--console-border-strong);
  color: var(--console-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
}

.console-shell__submit:hover,
.console-shell__submit:focus-visible {
  border-color: var(--console-accent);
  color: var(--console-accent);
  outline: none;
}

.console-shell__suggestions {
  display: grid;
  gap: 2px;
  padding: 3px 0;
}

.console-shell__suggestion {
  display: grid;
  grid-template-columns: minmax(170px, 260px) 1fr;
  gap: 16px;
  min-height: 30px;
  padding: 4px 9px;
  border: 1px solid transparent;
  color: var(--console-muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.console-shell__suggestion:hover,
.console-shell__suggestion:focus-visible,
.console-shell__suggestion.is-selected {
  border-color: var(--console-border-strong);
  color: var(--console-text);
  background: var(--console-selection);
  outline: none;
}

.console-shell__suggestion code {
  color: var(--console-accent);
  font: inherit;
}

@media (max-width: 1100px) {
  .console-shell__suggestion {
    grid-template-columns: minmax(130px, 1fr) 2fr;
  }
}

@media (max-width: 900px) {
  .console-shell {
    display: none;
  }
}
</style>
