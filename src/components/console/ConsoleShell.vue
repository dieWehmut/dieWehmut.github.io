<template>
  <section class="console-shell" aria-label="Nexus Console">
    <header class="console-shell__header">
      <div class="console-shell__avatar-wrap">
        <img class="console-shell__avatar" :src="avatarUrl" :alt="`${siteConfig.owner} avatar`" />
      </div>
      <div class="console-shell__identity">
        <div class="console-shell__eyebrow">NEXUS CONSOLE / 0.1.0</div>
        <h1>{{ siteConfig.title }}</h1>
        <p>{{ siteConfig.subtitle || siteConfig.description }}</p>
        <dl class="console-shell__meta">
          <div><dt>owner</dt><dd>{{ siteConfig.owner }}</dd></div>
          <div><dt>repo</dt><dd>{{ siteConfig.githubUser }}/{{ siteConfig.githubRepo }}</dd></div>
          <div><dt>path</dt><dd>{{ route.fullPath || '/' }}</dd></div>
        </dl>
      </div>
      <div class="console-shell__state" aria-label="Console state">
        <span class="console-shell__state-dot" aria-hidden="true"></span>
        <span>READY</span>
      </div>
    </header>

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
        :value="commandInput"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        inputmode="text"
        placeholder="/help"
        aria-label="Console command"
        @input="setInput(($event.target as HTMLInputElement).value)"
        @keydown="handleInputKeydown"
      />
      <button class="console-shell__submit" type="submit" aria-label="Run command" title="Run command">Enter</button>
    </form>

    <div v-if="suggestions.length" class="console-shell__suggestions" role="listbox" aria-label="Command suggestions">
      <button
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.input"
        class="console-shell__suggestion"
        :class="{ 'is-selected': suggestionCursor === index }"
        type="button"
        role="option"
        :aria-selected="suggestionCursor === index"
        @mousedown.prevent="executeCommand(suggestion.input)"
      >
        <code>{{ suggestion.input }}</code>
        <span>{{ suggestion.description }}</span>
      </button>
    </div>

    <ConsolePanelView
      :panel="activePanel?.panel || null"
      :value="activePanel?.value"
      :current-path="route.fullPath"
      :feedback="feedback"
      @execute="executeCommand"
      @close="setPanel(null)"
    />
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ConsolePanelView from './ConsolePanelView.vue'
import { siteConfig } from '../../data/site/config'
import { getGitHubAvatarUrl } from '../../utils/githubAvatar'
import { useConsoleSession } from '../../composables/useConsoleSession'

const route = useRoute()
const inputRef = ref<HTMLInputElement | null>(null)
const avatarUrl = getGitHubAvatarUrl(siteConfig.githubUser)

const {
  commandInput,
  history,
  suggestions,
  suggestionCursor,
  activePanel,
  feedback,
  setInput,
  selectSuggestion,
  executeCommand,
  handleInputKeydown,
  setPanel,
} = useConsoleSession()

onMounted(() => {
  void nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.console-shell {
  position: relative;
  display: grid;
  gap: 12px;
  width: 100%;
  padding: 24px 0 14px;
  color: var(--console-text);
  font-family: var(--console-font);
}

.console-shell__header {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) auto;
  align-items: start;
  gap: 24px;
  min-height: 142px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--console-border);
}

.console-shell__avatar-wrap {
  width: 116px;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--console-border-strong);
  background: var(--console-surface);
}

.console-shell__avatar {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
}

.console-shell__identity {
  min-width: 0;
}

.console-shell__eyebrow {
  margin-bottom: 8px;
  color: var(--console-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.console-shell h1 {
  margin: 0;
  color: var(--console-text);
  font: inherit;
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  font-weight: 700;
}

.console-shell__identity p {
  margin: 5px 0 14px;
  color: var(--console-muted);
  font-size: 0.9rem;
}

.console-shell__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 22px;
  margin: 0;
  color: var(--console-muted);
  font-size: 0.75rem;
}

.console-shell__meta div {
  display: inline-flex;
  gap: 7px;
  min-width: 0;
}

.console-shell__meta dt {
  color: var(--console-dim);
}

.console-shell__meta dd {
  overflow: hidden;
  margin: 0;
  color: var(--console-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-shell__state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding-top: 3px;
  color: var(--console-accent);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.console-shell__state-dot {
  width: 7px;
  height: 7px;
  background: currentColor;
}

.console-shell__history {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  min-height: 24px;
  color: var(--console-muted);
  font-size: 0.76rem;
}

.console-shell__history-label {
  color: var(--console-dim);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.console-shell__history button {
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
  border-top: 1px solid var(--console-border-strong);
  border-bottom: 1px solid var(--console-border-strong);
  background: var(--console-surface);
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
  max-height: 246px;
  overflow-y: auto;
  padding: 3px 0;
  border-bottom: 1px solid var(--console-border);
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
  .console-shell__header {
    grid-template-columns: 88px minmax(0, 1fr) auto;
    gap: 16px;
  }

  .console-shell__avatar-wrap {
    width: 88px;
  }

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
