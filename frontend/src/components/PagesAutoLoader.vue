<template>
  <div class="pages-auto-loader">
    <div v-if="loading" class="loading-state">
      <el-text type="info">{{ t('common.loading') }}... ⏳</el-text>
    </div>
    
    <div v-else-if="error" class="error-state">
      <el-text type="danger">{{ error }}</el-text>
    </div>

    <div v-else class="pages-list">
      <PageItem
        v-for="page in displayedPages"
        :key="page.name"
        :page-name="page.displayName"
        :repo-url="page.repoUrl"
        :version="{
          date: page.date,
          url: page.url
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineExpose } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchBackendWithFallback } from '../utils/backendApi';
import PageItem from './PageItem.vue';

const { t } = useI18n();

const pages = ref([]);
const loading = ref(true);
const error = ref(null);

const props = defineProps({
  filterQuery: {
    type: String,
    default: ''
  }
});

const normalizedFilter = computed(() => (props.filterQuery || '').trim().toLowerCase());
const displayedPages = computed(() => {
  const q = normalizedFilter.value;
  if (!q) return pages.value;
  return pages.value.filter((page) => {
    const name = (page.displayName || page.name || '').toLowerCase();
    const repo = (page.repoUrl || '').toLowerCase();
    const url = (page.url || '').toLowerCase();
    return name.includes(q) || repo.includes(q) || url.includes(q);
  });
});

const pagesCount = computed(() => pages.value.length);
const matchedCount = computed(() => displayedPages.value.length);
const hasMatches = computed(() => matchedCount.value > 0);

defineExpose({
  pagesCount: computed(() => pages.value.length),
  matchedCount,
  hasMatches,
  displayedPages,
  loading,
  error
});

async function loadPages() {
  loading.value = true;
  error.value = null;
  try {
    const resp = await fetchBackendWithFallback('/api/pages', { cache: 'no-cache' });
    if (!resp.ok) {
      throw new Error(`Server error: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    pages.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Failed to load pages from server API:', e);
    error.value = t('error.unable_load') || 'Unable to load pages.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPages();
});
</script>

<style scoped>
.pages-auto-loader {
  width: 100%;
}

.loading-state,
.error-state {
  padding: 24px;
  text-align: center;
}

.pages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
