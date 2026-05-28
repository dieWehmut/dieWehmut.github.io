<template>
  <section class="notes-view page-surface">
    <div class="notes-view__main">
      <PageHeading title="Notes" description="Short dated notes and operational reminders." :icon="Notebook" />

      <section v-for="group in noteGroups" :key="group.year" class="notes-year">
        <div class="notes-year__heading">
          <h2>{{ group.year }}</h2>
          <span>{{ group.notes.length }} notes</span>
        </div>
        <NoteItem v-for="note in group.notes" :key="note.id" :note="note" />
      </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Notebook } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import NoteItem from '../components/content/NoteItem.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getNoteGroups } from '../data'

const noteGroups = computed(() => getNoteGroups())
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

.notes-year + .notes-year {
  margin-top: 42px;
}

.notes-year__heading {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 10px;
}

h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 42px;
}

.notes-year__heading span {
  padding: 5px 12px;
  border-radius: 10px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.08);
  font-weight: 800;
}
</style>
