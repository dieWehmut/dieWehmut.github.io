<template>
  <article class="note-card" :id="note.id">
    <time :datetime="note.date" class="note-card__date">
      <el-icon><Calendar /></el-icon>
      {{ formattedDate }}
    </time>
    <h2 v-if="note.title">{{ note.title }}</h2>
    <div class="note-card__body" v-html="renderedBody" />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import type { NoteEntry } from '../../types/content'
import { renderMarkdown } from '../../utils/markdown'

const props = defineProps<{ note: NoteEntry }>()

const formattedDate = computed(() => {
  const date = new Date(props.note.date)
  if (Number.isNaN(date.valueOf())) return props.note.date
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
})

const renderedBody = computed(() => renderMarkdown(props.note.body))
</script>

<style scoped>
.note-card {
  padding: 28px 0;
  border-bottom: 1px solid var(--site-border);
}

.note-card__date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 6px 14px;
  border-radius: 9px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.08);
  font-size: 18px;
  font-weight: 800;
}

h2 {
  margin: 0 0 12px;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
}

.note-card__body {
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.75;
}

.note-card__body :deep(p) {
  margin: 0;
}

.note-card__body :deep(p + p) {
  margin-top: 12px;
}

.note-card__body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--md-inline-code-bg);
  color: var(--md-inline-code-text);
  font-size: 14px;
  font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
}

.note-card__body :deep(pre) {
  margin: 12px 0;
  padding: 14px 18px;
  border-radius: 8px;
  background: var(--md-code-bg);
  border: 1px solid var(--md-pre-border);
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.55;
}

.note-card__body :deep(pre code) {
  padding: 0;
  background: none;
  border: none;
  color: var(--md-code-text);
  font-size: inherit;
}

.note-card__body :deep(h1),
.note-card__body :deep(h2),
.note-card__body :deep(h3) {
  margin: 18px 0 8px;
  color: var(--site-text);
  font-size: 16px;
  font-weight: 800;
}

.note-card__body :deep(ul),
.note-card__body :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.note-card__body :deep(li) {
  margin: 4px 0;
}

.note-card__body :deep(blockquote) {
  margin: 10px 0;
  padding-left: 14px;
  border-left: 3px solid var(--site-accent);
  color: var(--site-muted);
}

.note-card__body :deep(details) {
  margin: 12px 0;
}

.note-card__body :deep(summary) {
  cursor: pointer;
  color: var(--site-text);
  font-weight: 700;
  padding: 6px 0;
}

.note-card__body :deep(strong) {
  color: var(--site-text);
}

.note-card__body :deep(a) {
  color: var(--site-accent);
  text-decoration: none;
}

.note-card__body :deep(a:hover) {
  text-decoration: underline;
}

.note-card__body :deep(table) {
  margin: 12px 0;
  border-collapse: collapse;
  width: 100%;
}

.note-card__body :deep(th),
.note-card__body :deep(td) {
  padding: 6px 12px;
  border: 1px solid var(--site-border);
  text-align: left;
  font-size: 14px;
}

.note-card__body :deep(hr) {
  margin: 20px 0;
  border: none;
  border-top: 1px solid var(--site-border);
}
</style>
