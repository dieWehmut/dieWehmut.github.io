<template>
  <section class="search-view page-surface">
    <PageHeading title="Search" :icon="Search" />
    <SearchInput v-model="query" />

    <div class="search-view__results">
      <SearchResultItem v-for="result in results" :key="result.id" :result="result" />
      <p v-if="query && results.length === 0" class="search-view__empty">No results found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import SearchInput from '../components/search/SearchInput.vue'
import SearchResultItem from '../components/search/SearchResultItem.vue'
import { getSearchDocuments } from '../data'
import type { SearchDocument, SearchResult } from '../types/content'

const query = ref('')
const captureDocs = ref<SearchDocument[]>([])

function normalizedIncludes(value: string, queryText: string): boolean {
  return value.toLowerCase().includes(queryText)
}

function scoreDocument(doc: SearchDocument, queryText: string): number {
  if (!queryText) return 0

  const lowerTitle = doc.title.toLowerCase()
  const lowerDescription = doc.description.toLowerCase()
  const lowerType = doc.type.toLowerCase()
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

  return score
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  const docs = [...getSearchDocuments(), ...captureDocs.value]
  if (!q) return docs.slice(0, 10)

  return docs
    .map((doc): SearchResult => ({
      ...doc,
      score: scoreDocument(doc, q),
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const byDate = Date.parse(b.date || '') - Date.parse(a.date || '')
      if (!Number.isNaN(byDate) && byDate !== 0) return byDate
      return a.title.localeCompare(b.title)
    })
})

onMounted(async () => {
  const { getCaptureSearchDocuments } = await import('../data/capture')
  captureDocs.value = getCaptureSearchDocuments()
})
</script>

<style scoped>
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
