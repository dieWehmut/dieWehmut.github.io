<template>
  <div class="tools-list">
    <div v-if="loading">Loading tools...</div>
    <div v-else>
      <div v-if="tools.length === 0">No tools found</div>
      <div v-for="tool in tools" :key="tool.name" class="tool-row">
        <div class="tool-info">
          <el-icon class="page-icon"><Folder /></el-icon>
          <div class="title-date">
            <div class="single-title">{{ tool.name }}</div>
            <div class="tool-date" v-if="tool.lastModified">{{ formatDateShort(tool.lastModified) }}</div>
          </div>
        </div>
        <div class="tool-actions">
          <el-button class="action-btn" type="text" size="small" @click="downloadRepo(tool)">
            <el-icon class="action-icon"><Download /></el-icon>
            <span class="btn-text">{{ t('action.download') }}</span>
          </el-button>
          <el-button class="action-btn repo-button" type="text" size="small" @click="openRepo(tool)">
            <el-icon class="action-icon"><Link /></el-icon>
            <span class="btn-text">{{ t('action.repo') }}</span>
          </el-button>
          <el-button class="action-btn copy-btn" type="text" size="small" @click="copyLink(tool)">
            <el-icon class="action-icon"><CopyDocument /></el-icon>
            <span class="btn-text">{{ copied[tool.html_url || buildFolderHtmlUrl(tool.name)] ? t('action.copied') : t('action.copy') }}</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Folder, Download, Link, CopyDocument } from "@element-plus/icons-vue";
import { useI18n } from 'vue-i18n'
import { showCenteredToast } from '../utils/centerToast'

const tools = ref([])
const loading = ref(true)
const { t } = useI18n()

function buildFolderHtmlUrl(name) {
  // Prefer direct html_url if available from API results; fallback to tree URL
  return `https://github.com/dieWehmut/Gajetto/tree/main/${encodeURIComponent(name)}`
}

async function fetchTools() {
  loading.value = true
  try {
    const res = await fetch('https://api.github.com/repos/dieWehmut/Gajetto/contents')
    if (!res.ok) {
      tools.value = []
      loading.value = false
      return
    }
    const data = await res.json()
    if (!Array.isArray(data)) {
      tools.value = []
      loading.value = false
      return
    }
    const dirs = data.filter((i) => i.type === 'dir').map((d) => ({
      name: d.name,
      html_url: d.html_url || buildFolderHtmlUrl(d.name),
      lastModified: null
    }))

    // For each directory, try to fetch the latest commit touching that path so we can show a date
    const withDates = await Promise.all(dirs.map(async (dir) => {
      try {
        const commitsRes = await fetch(`https://api.github.com/repos/dieWehmut/Gajetto/commits?path=${encodeURIComponent(dir.name)}&per_page=1`)
        if (commitsRes.ok) {
          const commits = await commitsRes.json()
          if (Array.isArray(commits) && commits.length > 0) {
            dir.lastModified = commits[0]?.commit?.committer?.date || commits[0]?.commit?.author?.date || null
          }
        }
      } catch (e) {
        // ignore per-dir failures
      }
      return dir
    }))
    tools.value = withDates
  } catch (e) {
    tools.value = []
  } finally {
    loading.value = false
  }
}

function openRepo(tool) {
  const url = tool.html_url || buildFolderHtmlUrl(tool.name)
  window.open(url, '_blank', 'noopener')
}

function downloadRepo(tool) {
  // Try to download only the folder using download-directory.github.io service
  const folderUrl = tool.html_url || buildFolderHtmlUrl(tool.name)
  const dl = `https://download-directory.github.io/?url=${encodeURIComponent(folderUrl)}`
  window.open(dl, '_blank', 'noopener')
}

const copied = reactive({})

function copyLink(tool) {
  const url = tool.html_url || buildFolderHtmlUrl(tool.name)
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
    const M = String(dt.getMonth() + 1).padStart(2, '0');
    const D = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${Y}-${M}-${D} ${hh}:${mm}`;
  } catch {
    return d;
  }
}

onMounted(() => {
  fetchTools()
})

// expose tools array so parent can read counts and filter
defineExpose({ tools, loading })
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
  background: rgba(0,0,0,0.30); /* black translucent by default */
  transition: transform 0.14s ease, box-shadow 0.18s ease, color 0.12s ease;
  will-change: transform, box-shadow;
  cursor: pointer;
}
.tool-actions {
  display: flex;
  gap: 8px;
}
.single-title {
  font-weight: 600;
  color: #f5f5f5; /* white text on dark bg */
}
.tool-info { display:flex; align-items:center; gap:8px }

.title-date {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0; /* allow truncation */
}
.single-title {
  font-weight: 600;
  color: #f5f5f5; /* white text on dark bg */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tool-row .page-icon,
.tool-row .action-icon {
  color: #ffffff;
  fill: #ffffff !important;
}

.tool-date {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  margin-left: 12px;
  white-space: nowrap;
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

/* ensure text and icons stay white and buttons remain visually flat */
.tool-row,
.tool-row .single-title,
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
