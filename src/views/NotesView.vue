<template>
  <section class="page-surface">
    <PageHeading title="Notes" description="Short dated notes and operational reminders." :icon="Notebook" />
    <NoteCard v-for="note in notes" :key="note.id" :note="note" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Notebook } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import NoteCard from '../components/content/NoteCard.vue'
import { getNotes } from '../data'

const notes = computed(() => getNotes())
</script>
