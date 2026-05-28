<template>
  <section class="search-view page-surface">
    <PageHeading title="Search" description="Search posts, notes, friends, projects, and infrastructure." :icon="Search" />
    <SearchInput v-model="query" />

    <div class="search-view__results">
      <SearchResultItem v-for="result in results" :key="result.id" :result="result" />
      <p v-if="query && results.length === 0" class="search-view__empty">No results found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import SearchInput from '../components/search/SearchInput.vue'
import SearchResultItem from '../components/search/SearchResultItem.vue'
import { getSearchDocuments } from '../data'

const query = ref('')

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  const docs = getSearchDocuments()
  if (!q) return docs.slice(0, 10)

  return docs.filter((doc) => {
    const haystack = [doc.type, doc.title, doc.description, ...(doc.tags || [])].join(' ').toLowerCase()
    return haystack.includes(q)
  })
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
