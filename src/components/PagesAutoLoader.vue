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
    const allPages = [];
    
    for (const owner of owners) {
      try {
        // 获取该用户的所有仓库
        const repos = await fetchWithCache(
          `https://api.github.com/users/${owner}/repos?per_page=100&sort=created&direction=desc`,
          { headers: getGitHubHeaders() },
          1000 * 60 * 30 // 缓存30分钟
        );
        
        if (!Array.isArray(repos)) continue;
        
        // 对每个仓库检查是否有 homepage/website
        for (const repo of repos) {
          if (repo.homepage && repo.homepage.trim()) {
            let finalDate = repo.created_at; // 默认使用创建日期
            
            // 检查是否有日期覆盖
            const overrideDate = getProjectDate(repo.name, null);
            
            if (overrideDate) {
              // 如果有覆盖日期,直接使用
              finalDate = overrideDate;
            } else {
              // 没有覆盖日期,尝试获取第一次 commit 时间
              try {
                const commitsUrl = `https://api.github.com/repos/${owner}/${repo.name}/commits?per_page=1&sha=${repo.default_branch || 'main'}`;
                
                const response = await fetch(commitsUrl, {
                  headers: getGitHubHeaders(),
                });
                
                if (response.ok) {
                  const linkHeader = response.headers.get('Link');
                  
                  if (linkHeader) {
                    // 从 Link header 中提取最后一页的页码
                    const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
                    if (lastPageMatch) {
                      const lastPage = parseInt(lastPageMatch[1]);
                      // 获取最后一页(即第一次提交)
                      const firstCommits = await fetchWithCache(
                        `https://api.github.com/repos/${owner}/${repo.name}/commits?per_page=1&page=${lastPage}&sha=${repo.default_branch || 'main'}`,
                        { headers: getGitHubHeaders() },
                        1000 * 60 * 60 * 24 // 缓存24小时
                      );
                      
                      if (Array.isArray(firstCommits) && firstCommits.length > 0) {
                        const commit = firstCommits[0];
                        finalDate = commit.commit?.author?.date || commit.commit?.committer?.date || finalDate;
                      }
                    } else {
                      // 如果没有分页,说明提交数很少,直接解析响应
                      const commits = await response.json();
                      if (Array.isArray(commits) && commits.length > 0) {
                        finalDate = commits[0].commit?.author?.date || commits[0].commit?.committer?.date || finalDate;
                      }
                    }
                  } else {
                    // 没有 Link header,直接获取提交
                    const commits = await response.json();
                    if (Array.isArray(commits) && commits.length > 0) {
                      finalDate = commits[0].commit?.author?.date || commits[0].commit?.committer?.date || finalDate;
                    }
                  }
                }
              } catch (e) {
                // 获取 commit 失败时使用仓库创建时间
                console.warn(`Failed to get first commit for ${owner}/${repo.name}, using created_at`);
              }
            }
            
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
        console.error(`Failed to load repos for ${owner}:`, e);
        // 继续处理下一个 owner,不中断整个流程
      }
    }
    
    // 按日期排序(最新的在前)
  pages.value = allPages.sort((a, b) => new Date(b.date) - new Date(a.date));
    
  } catch (e) {
    error.value = t('error.unable_load') || 'Unable to load pages.';
    console.error('Failed to load pages:', e);
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
