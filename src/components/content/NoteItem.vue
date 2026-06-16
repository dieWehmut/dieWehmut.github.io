<template>
  <article class="note-item" :id="note.id" @click="goToNote">
    <time class="note-item__date" :datetime="note.date">{{ shortDate }}</time>
    <div class="note-item__body">
      <h2>{{ note.title }}</h2>
      <MarkdownPreview class="note-item__summary" :source="note.summary" />
      <div class="note-item__tags" v-if="note.tags?.length || note.wordCount || note.readingMinutes">
        <ContentStats :word-count="note.wordCount" :reading-minutes="note.readingMinutes" />
        <span v-for="tag in note.tags" :key="tag" class="note-item__tag" @click.stop><RouterLink :to="`/tags/${encodeURIComponent(tag)}`"><el-icon class="note-item__tag-icon"><PriceTag /></el-icon>{{ tag }}</RouterLink></span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { PriceTag } from '@element-plus/icons-vue'
import type { NoteEntry } from '../../types/content'
import { formatTimelineShortDate } from '../../utils/date'
import ContentStats from './ContentStats.vue'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps<{ note: NoteEntry }>()
const router = useRouter()

const shortDate = computed(() => {
  return formatTimelineShortDate(props.note.date)
})

function goToNote() {
  router.push(`/note/${props.note.id}`)
}
</script>

<style scoped>
.note-item {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 22px;
  padding: 22px;
  margin: 0 -22px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: default;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.note-item:hover {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
}

.note-item + .note-item {
  border-top: 1px solid var(--site-border);
}

.note-item__date {
  color: var(--site-muted);
  font-size: 18px;
  font-weight: 800;
}

h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  color: var(--site-text);
  transition: color 160ms ease;
}

.note-item:hover h2 {
  color: var(--site-accent);
}

.note-item__summary {
  display: block;
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  --markdown-preview-lines: 3;
}

.note-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  font-size: 15px;
}

.note-item__tags a {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(190, 190, 190, 0.82);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.note-item__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

.note-item__tags a:hover,
.note-item__tags a:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

@media (max-width: 640px) {
  .note-item {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 16px;
    margin: 0 -16px;
  }
}
</style>
