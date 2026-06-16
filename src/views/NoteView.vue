<template>
  <section class="note-view page-surface">
    <div class="note-view__main">
      <div v-if="note" class="note-view__card">
          <h1 class="note-view__title">{{ note.title }}</h1>
          <div v-if="note.updated" class="note-view__updated"><el-icon class="note-view__updated-icon"><Edit /></el-icon>最后更新: {{ note.updated }}</div>
          <div v-if="note.wordCount || note.readingMinutes" class="note-view__stats">
            <ContentStats :word-count="note.wordCount" :reading-minutes="note.readingMinutes" />
          </div>
          <div v-if="isLoading" class="note-view__loading" role="status">Loading note...</div>
          <div v-else-if="loadError" class="note-view__loading" role="alert">{{ loadError }}</div>
          <MarkdownContent v-else-if="note.body" class="note-view__body markdown-body" :source="note.body" />
          <div v-if="note.date || note.tags?.length" class="note-view__meta-row">
            <time v-if="note.date" class="note-view__meta-date" :datetime="note.date"><el-icon class="note-view__meta-icon"><Calendar /></el-icon>{{ formattedDate }}</time>
            <RouterLink
              v-for="tag in note.tags"
              :key="tag"
              class="note-view__meta-tag"
              :to="`/tags/${encodeURIComponent(tag)}`"
            ><el-icon class="note-view__meta-icon--tag"><PriceTag /></el-icon>{{ tag }}</RouterLink>
        </div>
      </div>
      <div v-else class="note-view__not-found">
        <p>Note not found.</p>
        <RouterLink to="/notes">Back to Notes</RouterLink>
      </div>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Calendar, PriceTag, Edit } from '@element-plus/icons-vue'
import ContentStats from '../components/content/ContentStats.vue'
import MarkdownContent from '../components/content/MarkdownContent.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getNotes, loadDoc, docContentVersion } from '../data'
import { formatTimelineDate } from '../utils/date'
import type { NoteEntry } from '../types/content'

const route = useRoute()
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

const formattedDate = computed(() => {
  if (!note.value) return ''
  return formatTimelineDate(note.value.date)
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
      if (latestLoadToken === token) isLoading.value = false
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

.note-view__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
  font-size: 15px;
}

.note-view__meta-date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-weight: 800;
}

.note-view__meta-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.note-view__meta-icon--tag {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

.note-view__meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.note-view__meta-tag:hover,
.note-view__meta-tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.note-view__title {
  margin: 0;
  color: var(--site-text);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}

.note-view__updated {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
}

.note-view__updated-icon {
  font-size: 14px;
}

.note-view__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
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
.note-view__body :deep(a:hover) { text-decoration: underline; }

.note-view__body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--md-inline-code-bg);
  color: var(--md-inline-code-text);
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
.note-view__body :deep(em) { font-style: italic; }

.note-view__body :deep(h1),
.note-view__body :deep(h2),
.note-view__body :deep(h3),
.note-view__body :deep(h4) {
  margin: 24px 0 12px;
  color: var(--site-text);
  font-weight: 700;
  line-height: 1.4;
}

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
  border-left: 3px solid var(--site-accent);
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
  background: var(--md-inline-code-bg);
  font-weight: 700;
}

.note-view__body :deep(hr) {
  margin: 24px 0;
  border: none;
  border-top: 1px solid var(--site-border);
}

.note-view__body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

.note-view__body :deep(details) { margin: 12px 0; }

.note-view__body :deep(summary) {
  cursor: pointer;
  color: var(--site-text);
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
