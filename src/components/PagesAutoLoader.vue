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
import { fetchWithCache } from '../utils/apiCache';
import { getGitHubHeaders } from '../utils/github';
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

const owners = ['dieWehmut', 'dieSehnsucht'];

// 日期覆盖映射 - 为特定项目指定正确的日期
const dateOverrides = {
  'kotoba-hitomi': '2025-04-25',
  'profile': '2025-08-16',
  'notes': '2025-08-20',
  'hc-dsw-nexus': '2025-08-26',
  'nexus': '2025-08-26', // 也包含 nexus 以防万一
  'leereriss': '2025-11-02'
};

// 显示名称覆盖映射 - 为特定项目指定显示名称
const displayNameOverrides = {
  'hc-dsw-nexus': 'nexus'
};

// 从 URL 中提取显示名称
function extractDisplayName(url, repoName = '') {
  // 首先检查是否有显示名称覆盖
  if (repoName && displayNameOverrides[repoName.toLowerCase()]) {
    return displayNameOverrides[repoName.toLowerCase()];
  }
  
  try {
    // 移除协议部分
    let cleanUrl = url.replace(/^https?:\/\//, '');
    // 移除尾部斜杠
    cleanUrl = cleanUrl.replace(/\/$/, '');
    // 对于 GitHub Pages，提取路径的最后一部分
    const parts = cleanUrl.split('/');
    if (parts.length > 1 && parts[0].includes('github.io')) {
      return parts[parts.length - 1];
    }
    // 否则，提取第一个点之前的部分
    const firstPart = cleanUrl.split('.')[0];
    // 如果是 www,则取第二部分
    if (firstPart === 'www' && cleanUrl.includes('.')) {
      return cleanUrl.split('.')[1];
    }
    return firstPart;
  } catch (e) {
    return url;
  }
}

// 获取项目的日期 - 优先使用覆盖日期
function getProjectDate(repoName, defaultDate) {
  // 检查是否有覆盖日期
  const displayName = repoName.toLowerCase();
  if (dateOverrides[displayName]) {
    return dateOverrides[displayName];
  }
  // 如果没有覆盖日期,返回 null 表示需要获取 commit 时间
  // 如果提供了 defaultDate,则返回它作为最后的 fallback
  return defaultDate || null;
}

async function loadPages() {
  loading.value = true;
  error.value = null;
  try {
    const resp = await fetch('/api/pages');
    if (!resp.ok) {
      throw new Error(`Server error: ${resp.status} ${resp.statusText}`);
    }
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await resp.json();
      pages.value = data;
    } else {
      // In local dev the /api file may be served as static source (not executed).
      // Fallback to client-side GitHub fetching so dev still works when serverless
      // runtime isn't available. This requires a local VITE_GITHUB_TOKEN or
      // will run unauthenticated (rate-limited).
      console.warn('/api/pages did not return JSON (dev fallback). Falling back to client-side GitHub fetch.');
      pages.value = await fetchPagesFromGitHub();
    }
  } catch (e) {
    console.error('Failed to load pages from server API:', e);
    error.value = t('error.unable_load') || 'Unable to load pages.';
  } finally {
    loading.value = false;
  }
}

// Fallback used in local dev when serverless endpoint isn't executed by dev server.
async function fetchPagesFromGitHub() {
  const allPages = [];
  for (const owner of owners) {
    try {
      const repos = await fetchWithCache(
        `https://api.github.com/users/${owner}/repos?per_page=100&sort=created&direction=desc`,
        { headers: getGitHubHeaders() },
        1000 * 60 * 30 // cache 30 minutes
      );
      if (!Array.isArray(repos)) continue;
      for (const repo of repos) {
        if (repo.homepage && repo.homepage.trim()) {
          const finalDate = getProjectDate(repo.name, repo.created_at);
          allPages.push({
            name: repo.name,
            displayName: extractDisplayName(repo.homepage, repo.name),
            repoUrl: repo.html_url,
            date: finalDate,
            url: repo.homepage
          });
        }
      }
    } catch (e) {
      console.error(`Failed to load repos for ${owner} (client fallback):`, e);
    }
  }
  return allPages.sort((a, b) => new Date(b.date) - new Date(a.date));
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
