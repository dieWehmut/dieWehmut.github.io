<template>
  <section class="note-view page-surface">
    <ScrollSpySidebar v-if="isConsole" root-selector=".page-surface" />
    <div class="note-view__main">
      <div v-if="note" class="note-view__card">
          <h1 class="note-view__title">{{ note.title }}</h1>
          <ArticleMeta
            :date="note.date"
            :updated="note.updated"
            :word-count="note.wordCount"
            :reading-minutes="note.readingMinutes"
            :tags="note.tags"
          />
          <ArticleExportButton v-if="isConsole && note.body" variant="console" />
          <DocLoading v-if="isLoading">Loading note...</DocLoading>
          <div v-if="loadError" class="note-view__loading" role="alert">{{ loadError }}</div>
          <MarkdownContent
            v-if="note.body"
            class="note-view__body markdown-body"
            :source="note.body"
            @ready="isLoading = false"
          />
      </div>
      <div v-else class="note-view__not-found">
        <p>Note not found.</p>
        <RouterLink to="/notes">Back to Notes</RouterLink>
      </div>
    </div>

    <ScrollSpySidebar v-if="!isConsole" root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import ArticleMeta from '../components/content/ArticleMeta.vue'
import ArticleExportButton from '../components/content/ArticleExportButton.vue'
import DocLoading from '../components/content/DocLoading.vue'
import MarkdownContent from '../components/content/MarkdownContent.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getNotes, loadDoc, docContentVersion } from '../data'
import type { NoteEntry } from '../types/content'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const route = useRoute()
const { isConsole } = useDisplayModePreference()
const body = ref('')
const isLoading = ref(false)
const loadError = ref('')
let latestLoadToken: symbol | null = null

const note = computed(() => {
  const id = route.params.id as string
  const meta = getNotes().find((n) => n.id === id) || null
  if (!meta) return null
  return {
    ...meta,
    body: body.value,
  } satisfies NoteEntry
})

watch(
  [() => route.params.id, docContentVersion],
  async ([rawId], oldValues) => {
    const id = String(rawId || '')
    const prevId = oldValues ? String(oldValues[0] || '') : ''
    const isHmr = Boolean(oldValues) && prevId === id && body.value !== ''
    if (!isHmr) {
      body.value = ''
      loadError.value = ''
    }

    if (!id || !getNotes().some((item) => item.id === id)) {
      isLoading.value = false
      return
    }

    if (!isHmr) isLoading.value = true
    const token = Symbol(id)
    latestLoadToken = token

    try {
      const loaded = await loadDoc('note', id)
      if (latestLoadToken !== token) return
      body.value = loaded?.body || ''
      if (!loaded) loadError.value = 'Note not found.'
    } catch (error) {
      if (latestLoadToken !== token) return
      loadError.value = error instanceof Error ? error.message : String(error)
    } finally {
      if (latestLoadToken === token && !body.value) isLoading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.note-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.note-view__main {
  flex: 1;
  min-width: 0;
}

.note-view__card {
  padding: 20px 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035);
}

.note-view__title {
  position: relative;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--site-accent) 26%, transparent);
  color: var(--site-text);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}

.note-view__title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 46px;
  height: 2px;
  border-radius: 999px;
  background: var(--site-accent);
}

.note-view__body {
  margin-top: 18px;
  color: var(--site-text);
  font-size: 15px;
  line-height: 1.75;
}

.note-view__loading {
  margin-top: 18px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 700;
}

.note-view__body :deep(p) { margin: 0; }
.note-view__body :deep(p + p) { margin-top: 16px; }

.note-view__body :deep(a) {
  color: var(--site-accent);
  text-decoration: none;
  transition: text-decoration 160ms ease;
}
.note-view__body :deep(a:hover) {
  text-decoration: underline;
  text-decoration-color: var(--md-color-secondary);
}

.note-view__body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--md-color-tertiary-soft) 74%, var(--md-inline-code-bg));
  color: var(--md-color-secondary);
  font-size: 14px;
  font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
}

.note-view__body :deep(pre) {
  margin: 16px 0;
  padding: 16px 20px;
  border-radius: 8px;
  background: var(--md-code-bg);
  border: 1px solid var(--md-pre-border);
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

.note-view__body :deep(pre code) {
  padding: 0;
  background: none;
  border-radius: 0;
  border: none;
  color: var(--md-code-text);
  font-size: inherit;
}

.note-view__body :deep(strong) { font-weight: 700; }
.note-view__body :deep(em) {
  color: var(--md-color-tertiary);
  font-style: italic;
}
.note-view__body :deep(u) {
  color: var(--md-color-tertiary);
  text-decoration-line: underline;
  text-decoration-color: var(--md-underline-color);
  text-decoration-thickness: 0.09em;
  text-underline-offset: 0.16em;
}

.note-view__body :deep(h1),
.note-view__body :deep(h2),
.note-view__body :deep(h3),
.note-view__body :deep(h4) {
  margin: 24px 0 12px;
  font-weight: 700;
  line-height: 1.4;
}

.note-view__body :deep(h1) { color: var(--md-color-primary); }
.note-view__body :deep(h2) { color: var(--md-color-secondary); }
.note-view__body :deep(h3) { color: var(--md-color-tertiary); }
.note-view__body :deep(h4) { color: var(--md-color-primary); }
.note-view__body :deep(h1) { font-size: 22px; }
.note-view__body :deep(h2) { font-size: 19px; }
.note-view__body :deep(h3) { font-size: 16px; }
.note-view__body :deep(h4) { font-size: 15px; }

.note-view__body :deep(ul),
.note-view__body :deep(ol) {
  margin: 10px 0;
  padding-left: 24px;
}

.note-view__body :deep(li) { margin: 4px 0; }

.note-view__body :deep(blockquote) {
  margin: 12px 0;
  padding: 4px 16px;
  border-left: 2px solid var(--md-color-secondary);
  color: var(--site-muted);
}

.note-view__body :deep(blockquote p) { margin: 4px 0; }

.note-view__body :deep(table) {
  margin: 14px 0;
  border-collapse: collapse;
  width: 100%;
}

.note-view__body :deep(th),
.note-view__body :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--site-border);
  text-align: left;
  font-size: 14px;
}

.note-view__body :deep(th) {
  background: var(--md-color-secondary-soft);
  color: var(--md-color-secondary);
  font-weight: 700;
}

.note-view__body :deep(hr) {
  margin: 24px 0;
  border: none;
  border-top: 2px solid var(--md-color-tertiary);
}

.note-view__body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

.note-view__body :deep(details) { margin: 12px 0; }

.note-view__body :deep(summary) {
  cursor: pointer;
  color: var(--md-color-primary);
  font-weight: 700;
  padding: 6px 0;
}

.note-view__not-found {
  padding: 64px 32px;
  text-align: center;
  color: var(--site-muted);
}

.note-view__not-found p {
  font-size: 18px;
  margin: 0 0 18px;
}

.note-view__not-found a {
  color: var(--site-accent);
  font-weight: 700;
  text-decoration: none;
}

.note-view__not-found a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .note-view__card {
    padding: 16px;
  }

  .note-view__title {
    font-size: 18px;
  }

  .note-view__body {
    font-size: 15px;
  }
}
</style>
