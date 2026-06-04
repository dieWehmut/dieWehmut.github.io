<template>
  <section class="notes-view page-surface">
    <div class="notes-view__main">
      <PageHeading title="Notes" :icon="Notebook" />

      <section class="notes-view__feed">
        <FeedEntryCard v-for="note in notes" :key="note.id" :entry="noteEntry(note)" />
      </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Notebook } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getNotes } from '../data'
import type { NoteEntry } from '../types/content'

const notes = computed(() => getNotes())

function noteEntry(note: NoteEntry) {
  return {
    title: note.title,
    description: note.summary,
    date: note.date,
    tags: note.tags,
    url: `/note/${note.id}`,
  }
}
</script>

<style scoped>
.notes-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.notes-view__main {
  flex: 1;
  min-width: 0;
}

.notes-view__feed {
  border-top: 1px solid var(--site-border);
  margin-top: 8px;
}
</style>
