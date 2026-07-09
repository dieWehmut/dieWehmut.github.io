<template>
  <section class="search-view page-surface">
    <div class="search-view__main">
      <SearchInput v-model="query" />

      <div class="search-view__results">
        <SearchResultItem
          v-for="result in results"
          :key="result.id"
          :result="result"
          :overflow-count="resultOverflowCount(result)"
        />
        <p v-if="query && filteredResults.length === 0" class="search-view__empty">No results found.</p>
      </div>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SearchInput from '../components/search/SearchInput.vue'
import SearchResultItem from '../components/search/SearchResultItem.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getSearchDocuments } from '../data'
import { getCaptureSearchDocuments } from '../data/capture'
import type { SearchDocument, SearchResult } from '../types/content'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'
import { getDateSortTimestamp } from '../utils/date'

const query = ref('')

function sortDocuments(docs: SearchDocument[]): SearchDocument[] {
  return docs.slice().sort((a, b) => {
    const byDate = getDateSortTimestamp(b.date) - getDateSortTimestamp(a.date)
    if (byDate !== 0) return byDate
    return a.title.localeCompare(b.title)
  })
}

function normalizedIncludes(value: string, queryText: string): boolean {
  return value.toLowerCase().includes(queryText)
}

function scoreDocument(doc: SearchDocument, queryText: string): number {
  if (!queryText) return 0

  const lowerTitle = doc.title.toLowerCase()
  const lowerDescription = doc.description.toLowerCase()
  const lowerType = doc.type.toLowerCase()
  const lowerUrl = doc.url.toLowerCase()
  const lowerTags = (doc.tags || []).map((tag) => tag.toLowerCase())

  let score = 0

  if (lowerTitle === queryText) score += 120
  else if (lowerTitle.startsWith(queryText)) score += 80
  else if (normalizedIncludes(lowerTitle, queryText)) score += 45

  if (lowerTags.some((tag) => tag === queryText)) score += 60
  else if (lowerTags.some((tag) => tag.startsWith(queryText))) score += 35
  else if (lowerTags.some((tag) => tag.includes(queryText))) score += 20

  if (normalizedIncludes(lowerDescription, queryText)) score += 18
  if (normalizedIncludes(lowerType, queryText)) score += 10
  if (normalizedIncludes(lowerUrl, queryText)) score += 8

  return score
}

const allDocuments = computed(() => sortDocuments([...getSearchDocuments(), ...getCaptureSearchDocuments()]))

const filteredResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  const docs = allDocuments.value
  if (!q) return docs

  return docs
    .map((doc): SearchResult => ({
      ...doc,
      score: scoreDocument(doc, q),
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const byDate = getDateSortTimestamp(b.date) - getDateSortTimestamp(a.date)
      if (byDate !== 0) return byDate
      return a.title.localeCompare(b.title)
    })
})

const results = computed(() => limitCardGroup(filteredResults.value))
const resultsHiddenCount = computed(() => hiddenCardCount(filteredResults.value))

function resultOverflowCount(result: SearchDocument) {
  return overflowCountForItem(result, results.value, resultsHiddenCount.value)
}
</script>

<style scoped>
.search-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.search-view__main {
  flex: 1;
  min-width: 0;
}

.search-view__results {
  margin-top: 34px;
}

.search-view__empty {
  margin: 30px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  font-weight: 800;
}
</style>
