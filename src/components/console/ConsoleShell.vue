<template>
  <section
    class="console-shell"
    :class="{ 'console-shell--expanded': hasTransient }"
    aria-label="Nexus Console"
  >
    <div v-if="history.length" class="console-shell__history" aria-label="Recent commands">
      <span class="console-shell__history-label">recent</span>
      <button v-for="entry in history" :key="entry" type="button" @click="executeCommand(entry)">{{ entry }}</button>
    </div>

    <form class="console-shell__prompt" @submit.prevent="executeCommand()">
      <label class="console-shell__prompt-symbol" for="console-command-input">&gt;_</label>
      <span class="console-shell__field">
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
        <span
          v-if="caretActive"
          class="console-shell__caret"
          aria-hidden="true"
          :style="{ width: `${caretWidth}px`, transform: `translate(${caretOffset}px, -50%)` }"
        >{{ caretGlyph }}</span>
      </span>
      <span v-if="caretActive" class="console-shell__mode" aria-hidden="true">-- INSERT --</span>
      <button class="console-shell__submit" type="submit" aria-label="Run command" title="Run command">Enter</button>
    </form>

    <div
      v-if="hasTransient"
      class="console-shell__transient"
    >
      <div
        v-if="suggestions.length"
        :id="suggestionListboxId"
        class="console-shell__suggestions"
        role="listbox"
        aria-label="Command suggestions"
      >
        <button
          v-for="{ suggestion, index } in visibleSuggestions"
          :id="suggestionOptionId(index)"
          :key="suggestion.input"
          class="console-shell__suggestion"
          :class="{ 'is-selected': suggestionCursor === index }"
          :style="{ '--console-row-accent': rowAccent(index) }"
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
import { useConsoleBlockCaret } from '../../composables/useConsoleBlockCaret'
import { useConsoleRowAccent } from '../../composables/useConsoleRowAccent'
import type { ConsolePanel } from '../../console/commandRegistry'
import { CONSOLE_OPTION_WINDOW, consoleOptionWindowStart } from '../../console/suggestions'
import {
  CONSOLE_RESULT_NAVIGATION_EVENT,
  type ConsoleResultNavigationAction,
} from '../../console/selection'
import { CONSOLE_MONTH_NAVIGATION_EVENT } from '../../console/timeline'

const inputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<InstanceType<typeof ConsolePanelView> | null>(null)
const panelActiveOptionId = ref('')
const suggestionListboxId = 'console-command-suggestions'
const panelListboxId = 'console-panel-options'
const optionPanels = new Set<ConsolePanel>([
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
const { rowAccent } = useConsoleRowAccent()
const { caretActive, caretOffset, caretWidth, caretGlyph } = useConsoleBlockCaret(inputRef, commandInput)

const hasPanelListbox = computed(() => Boolean(
  activePanel.value && optionPanels.has(activePanel.value.panel),
))
/** Whether the dock currently shows anything below the prompt. */
const hasTransient = computed(() => Boolean(
  suggestions.value.length || activePanel.value || (feedback.value && !activePanel.value),
))
/**
 * Only a fixed number of rows is ever rendered. The window travels with the
 * cursor instead of the rows scrolling inside a box, which keeps the dock a
 * constant height and leaves the page scroll position alone.
 */
const visibleSuggestions = computed(() => {
  const start = consoleOptionWindowStart(suggestionCursor.value, suggestions.value.length)
  return suggestions.value
    .slice(start, start + CONSOLE_OPTION_WINDOW)
    .map((suggestion, offset) => ({ suggestion, index: start + offset }))
})
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
  if (
    !activePanel.value
    && !suggestions.value.length
    && !commandInput.value.trim()
    && (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter')
  ) {
    const action: ConsoleResultNavigationAction = event.key === 'ArrowUp'
      ? 'previous'
      : event.key === 'ArrowDown'
        ? 'next'
        : 'activate'
    const handled = !window.dispatchEvent(new CustomEvent(CONSOLE_RESULT_NAVIGATION_EVENT, {
      detail: action,
      cancelable: true,
    }))
    if (handled) {
      event.preventDefault()
      return
    }
  }
  if (
    !activePanel.value
    && !suggestions.value.length
    && !commandInput.value.trim()
    && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
  ) {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent(CONSOLE_MONTH_NAVIGATION_EVENT, {
      detail: event.key === 'ArrowLeft' ? -1 : 1,
    }))
    return
  }
  handleSessionInputKeydown(event)
}

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
  /* Single column that the prompt caret, the suggestion rows and the panel rows
     all start from, so every `/` lines up under the one being typed. */
  --console-prompt-indent: 34px;
  /* Shared by the field and the block caret drawn over it: the block measures
     the text, so the two must render at one size or it would sit off the glyph. */
  --console-input-size: 0.95rem;
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  color: var(--console-text);
  border-top: 1px solid var(--console-border-strong);
  background: var(--console-bg);
  font-family: var(--console-font);
}

.console-shell__history {
  display: flex;
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
  display: flex;
  align-items: center;
  min-height: 46px;
  border-top: 0;
  border-bottom: 1px solid var(--console-border-strong);
  background: var(--console-canvas, var(--console-surface));
}

.console-shell__transient {
  border-bottom: 1px solid var(--console-border);
}

.console-shell__feedback {
  margin: 0;
  padding: 9px 9px 9px var(--console-prompt-indent);
  color: var(--console-muted);
}

.console-shell__prompt-symbol {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--console-prompt-indent);
  padding: 0;
  color: var(--console-accent);
  font-weight: 700;
}

.console-shell__field {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.console-shell__input {
  min-width: 0;
  flex: 1;
  height: 44px;
  border: 0;
  color: var(--console-text);
  outline: none;
  background: transparent;
  /* The block below stands in for the caret, so the browser's hairline would
     only show through it as a darker seam. */
  caret-color: transparent;
  font: inherit;
  font-size: var(--console-input-size);
}

/*
 * Vim's caret rather than the browser's: a block over the cell the insertion
 * point rests on, carrying the character it covers in reverse so the text stays
 * readable under it. Offset and width arrive as measured pixels, and the size
 * has to match the field's or the block would land off the glyph.
 */
.console-shell__caret {
  position: absolute;
  top: 50%;
  left: 0;
  height: 1.2em;
  line-height: 1.2em;
  color: var(--console-bg);
  background: var(--console-accent);
  pointer-events: none;
  white-space: pre;
  font-size: var(--console-input-size);
  animation: console-caret-blink 1.06s step-end infinite;
}

/* A hard on/off square wave, the way a terminal blinks, not a soft pulse. */
@keyframes console-caret-blink {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .console-shell__caret {
    animation: none;
  }
}

/*
 * The mode marker sits at the far end of the row on purpose: dropping it beside
 * the `>_` would push the field right and break the column every `/` lines up
 * on.
 */
.console-shell__mode {
  flex: 0 0 auto;
  margin-right: 8px;
  color: var(--console-muted);
  white-space: nowrap;
  font-size: 0.72rem;
  font-weight: 700;
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
  padding: 4px 9px 4px var(--console-prompt-indent);
  border: 1px solid transparent;
  color: var(--console-muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

/*
 * No frame is left to mark the cursor, so the row it rests on is repainted in
 * another scheme's accent. Because the colour is keyed to the row index, walking
 * the list visibly changes it step by step.
 */
.console-shell__suggestion:hover,
.console-shell__suggestion:focus-visible,
.console-shell__suggestion.is-selected {
  border-color: var(--console-border-strong);
  color: var(--console-text);
  background: color-mix(in srgb, var(--console-row-accent, var(--console-accent)) 18%, transparent);
  outline: none;
}

.console-shell__suggestion code {
  color: var(--console-accent);
  font: inherit;
}

.console-shell__suggestion:hover code,
.console-shell__suggestion:focus-visible code,
.console-shell__suggestion.is-selected code {
  color: var(--console-row-accent, var(--console-accent));
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
