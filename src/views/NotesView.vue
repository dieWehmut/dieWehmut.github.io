<template>
  <section class="notes-view page-surface">
    <div class="notes-view__main">
      <PageHeading title="Notes" description="Short dated notes and operational reminders." :icon="Notebook" />
      <NoteCard v-for="note in notes" :key="note.id" :note="note" />
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Notebook } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import NoteCard from '../components/content/NoteCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getNotes } from '../data'

const notes = computed(() => getNotes())
</script>

<style scoped>
.notes-view {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.notes-view__main {
  flex: 1;
  min-width: 0;
}
</style>
