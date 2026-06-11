<template>
  <section class="notes-view page-surface">
    <div class="notes-view__main">
      <PageHeading title="Notes" :icon="Notebook" />

      <section class="notes-view__feed content-timeline">
        <section v-for="year in yearGroups" :key="year.id" class="content-timeline__year">
          <h2 :id="year.id" class="content-time-heading content-time-heading--year">
            {{ year.label }}
          </h2>

          <section v-for="month in year.months" :key="month.id" class="content-timeline__month">
            <h3 :id="month.id" class="content-time-heading content-time-heading--month">
              {{ month.label }}
            </h3>

            <div class="content-timeline__items">
              <FeedEntryCard v-for="note in month.items" :key="note.id" :entry="noteEntry(note)" />
            </div>
          </section>
        </section>
      </section>
    </div>

    <ScrollSpySidebar root-selector=".notes-view__main" heading-selector=".content-time-heading" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notebook } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getNotes } from '../data'
import type { NoteEntry } from '../types/content'
import { groupItemsByYearAndMonth } from '../utils/timelineGroups'

const { locale } = useI18n()
const notes = computed(() => getNotes())
const yearGroups = computed(() =>
  groupItemsByYearAndMonth(notes.value, {
    idPrefix: 'notes',
    locale: locale.value,
    getDate: (note) => note.date,
  })
)

function noteEntry(note: NoteEntry) {
  return {
    title: note.title,
    description: note.summary,
    date: note.date,
    tags: note.tags,
    updated: note.updated,
    wordCount: note.wordCount,
    readingMinutes: note.readingMinutes,
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
  margin-top: 8px;
}

.content-timeline,
.content-timeline__year,
.content-timeline__month,
.content-timeline__items {
  display: grid;
  gap: 24px;
}

.content-time-heading {
  margin: 0;
  scroll-margin-top: 28px;
}

.content-time-heading--year {
  color: var(--site-text);
  font-size: 28px;
  line-height: 1.1;
  font-weight: 900;
}

.content-time-heading--month {
  color: var(--site-muted);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
}
</style>
