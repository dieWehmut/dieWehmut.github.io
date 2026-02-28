<template>
  <div class="tools-list">
    <div v-if="loading">Loading tools...</div>
    <div v-else>
  <div v-if="displayedTools.length === 0">No tools found</div>
  <div v-for="tool in displayedTools" :key="`${tool.name}-${resolveCopyUrl(tool)}`" class="tool-row" @click="openRepo(tool)">
        <div class="tool-info">
          <span class="page-info">
            <el-icon class="page-icon"><SetUp /></el-icon>
            <span class="page-name">{{ tool.name }}</span>
          </span>
          <div class="version-info" v-if="tool.lastModified">
            <el-icon class="calendar-icon"><Calendar /></el-icon>
            <span class="date">{{ formatDateShort(tool.lastModified) }}</span>
          </div>
        </div>
        <div class="tool-actions">
          <el-button v-if="shouldShowDownload(tool)" class="action-btn" type="text" size="small" @click.stop="downloadRepo(tool)">
            <el-icon class="action-icon"><Download /></el-icon>
            <span class="btn-text">{{ t('action.download') }}</span>
          </el-button>
          <el-button v-if="resolveRepoUrl(tool)" class="action-btn repo-button" type="text" size="small" @click.stop="openRepo(tool)">
            <el-icon class="action-icon"><Link /></el-icon>
            <span class="btn-text">{{ t('action.repo') }}</span>
          </el-button>
          <el-button class="action-btn copy-btn" type="text" size="small" @click.stop="copyLink(tool)">
            <el-icon class="action-icon"><CopyDocument /></el-icon>
            <span class="btn-text">{{ copied[resolveCopyUrl(tool)] ? t('action.copied') : t('action.copy') }}</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, defineExpose } from 'vue'
import { SetUp, Download, Link, CopyDocument, Calendar } from "@element-plus/icons-vue";
import { useI18n } from 'vue-i18n'
import { showCenteredToast } from '../utils/centerToast'
import { fetchWithCache } from '../utils/apiCache'
import { getGitHubHeaders } from '../utils/github'
import { useContent } from '../data/content'

const tools = ref([])
const loading = ref(true)
const { t } = useI18n()
const { tools: toolsConfig } = useContent()

const props = defineProps({
  filterQuery: {
    type: String,
    default: ''
  }
})

const normalizedFilter = computed(() => (props.filterQuery || '').trim().toLowerCase())
const displayedTools = computed(() => {
  const q = normalizedFilter.value
  if (!q) return tools.value
  return tools.value.filter((tool) => (tool.name || '').toLowerCase().includes(q))
})

function buildFolderHtmlUrl(name) {
  const owner = toolsConfig.value?.[0]?.owner || 'dieWehmut'
  const repo = toolsConfig.value?.[0]?.repo || 'Gajetto'
  // Prefer direct html_url if available from API results; fallback to tree URL
  return `https://github.com/${owner}/${repo}/tree/main/${encodeURIComponent(name)}`
}

const manualTools = computed(() => {
  const items = toolsConfig.value?.[0]?.manualItems || []
  return items.map((item, index) => ({
    name: item?.name || `manual-tool-${index}`,
    html_url: item?.html_url || item?.url || '',
    repo_url: item?.repo_url || item?.repoUrl || '',
    lastModified: item?.lastModified || item?.date || null,
    showDownload: item?.showDownload !== false,
    downloadToast: item?.downloadToast === true,
    downloadToastMessage: item?.downloadToastMessage || '私聊站长要哦~',
    isManual: true,
  }))
})

function resolveDownloadUrl(tool) {
  return tool?.html_url || tool?.url || ''
}

function resolveRepoUrl(tool) {
  if (tool?.repo_url || tool?.repoUrl) return tool.repo_url || tool.repoUrl
  if (tool?.isManual) return tool?.html_url || tool?.url || ''
  return tool?.html_url || buildFolderHtmlUrl(tool?.name || '')
}

function resolveCopyUrl(tool) {
  return resolveDownloadUrl(tool) || resolveRepoUrl(tool)
}

function shouldShowDownload(tool) {
  if (tool?.showDownload === false) return false
  if (tool?.downloadToast === true) return true
  return !!resolveDownloadUrl(tool)
}

async function fetchTools() {
  loading.value = true
  let autoTools = []
  try {
    const owner = toolsConfig.value?.[0]?.owner || 'dieWehmut'
    const repo = toolsConfig.value?.[0]?.repo || 'Gajetto'
    // cache folder listing for 15 minutes
    const data = await fetchWithCache(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      { headers: getGitHubHeaders() },
      1000 * 60 * 15
    )
    if (!Array.isArray(data)) {
      tools.value = [...manualTools.value]
      loading.value = false
      return
    }
    const dirs = data.filter((i) => i.type === 'dir').map((d) => ({
      name: d.name,
      html_url: d.html_url || buildFolderHtmlUrl(d.name),
      lastModified: null,
      showDownload: true,
      isManual: false,
    }))

    // For each directory, try to fetch the latest commit touching that path so we can show a date
    const withDates = await Promise.all(dirs.map(async (dir) => {
      try {
        // cache commits per-path for 6 hours to avoid repeated per-dir calls
        const commits = await fetchWithCache(
          `https://api.github.com/repos/dieWehmut/Gajetto/commits?path=${encodeURIComponent(dir.name)}&per_page=1`,
          { headers: getGitHubHeaders() },
          1000 * 60 * 60 * 6
        )
        if (Array.isArray(commits) && commits.length > 0) {
          dir.lastModified = commits[0]?.commit?.committer?.date || commits[0]?.commit?.author?.date || null
        }
      } catch (e) {
        // ignore per-dir failures
      }
      return dir
    }))
    autoTools = withDates
  } catch (e) {
    autoTools = []
  } finally {
    tools.value = [...manualTools.value, ...autoTools]
    loading.value = false
  }
}

function openRepo(tool) {
  const url = resolveRepoUrl(tool)
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

function downloadRepo(tool) {
  if (tool?.downloadToast === true) {
    showCenteredToast(tool?.downloadToastMessage || '私聊站长要哦~', { type: 'info', duration: 2500 })
    return
  }

  const downloadUrl = resolveDownloadUrl(tool)
  if (!downloadUrl) {
    showCenteredToast('私聊站长要哦~', { type: 'info', duration: 2500 })
    return
  }

  // For direct file links/manual links, open directly.
  if (!downloadUrl.includes('/tree/')) {
    window.open(downloadUrl, '_blank', 'noopener')
    return
  }

  // Try to download only the folder using download-directory.github.io service
  const folderUrl = downloadUrl
  const dl = `https://download-directory.github.io/?url=${encodeURIComponent(folderUrl)}`
  window.open(dl, '_blank', 'noopener')
}

const copied = reactive({})

function copyLink(tool) {
  const url = resolveCopyUrl(tool)
  navigator.clipboard.writeText(url).then(() => {
    // mark as copied for this item so UI can show temporary 'copied' state
    try {
      copied[url] = true
    } catch {}
  showCenteredToast('action.copied', { type: 'success', duration: 2500 })
    setTimeout(() => {
      try {
        delete copied[url]
      } catch {}
    }, 2500)
  }).catch(() => {
    showCenteredToast('action.copy_failed', { type: 'error', duration: 2500 })
  })
}

function formatDateShort(d) {
  try {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.valueOf())) return d;
    const Y = dt.getFullYear();
    const M = dt.getMonth() + 1;
    const D = dt.getDate();
    return `${Y}-${M}-${D}`;
  } catch {
    return d;
  }
}

onMounted(() => {
  fetchTools()
})

// expose tools array so parent can read counts and filter
defineExpose({ tools, displayedTools, loading })
</script>

<style scoped>
.tools-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(0,0,0,0.6) !important; /* black translucent by default */
  transition: transform 0.14s ease, box-shadow 0.18s ease, color 0.12s ease;
  will-change: transform, box-shadow;
  cursor: pointer;
}
.tool-actions {
  display: flex;
  gap: 8px;
}
.tool-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  line-height: 1.5;
  font-size: 14px;
}
.page-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.page-icon {
  font-size: 18px;
  color: #ffffff !important;
  display: inline-flex;
  align-items: center;
}
.page-name {
  font-weight: 600;
  color: #f5f5f5 !important;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.version-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d0d0d0;
}
.calendar-icon {
  font-size: 12px;
}
.date {
  font-size: 13px;
}
.tool-row .page-icon,
.tool-row .action-icon {
  color: #ffffff;
  fill: #ffffff !important;
}

/* Hover: remove dark overlay and add elevation to match Pages hover behavior */
@media (hover: hover) {
  .tool-row:hover {
    background: transparent !important; /* become colorless/transparent on hover */
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }
  /* keep text and icons color unchanged on hover (remain white) */
}

.tool-row:not(:hover) {
  background: rgba(0,0,0,0.6) !important;
}

/* ensure text and icons stay white and buttons remain visually flat */
.tool-row,
.tool-row .page-name,
.tool-row .page-icon,
.tool-row .action-icon {
  color: #ffffff;
}
.tool-actions .action-btn {
  background: transparent !important;
  border: none !important;
  color: #ffffff;
}
</style>
