<template>
  <div class="files-list">
    <div v-if="loading" class="loading-state">
      <el-text type="info">{{ t('common.loading') }}... ⏳</el-text>
    </div>
    
    <div v-else-if="error" class="error-state">
      <el-text type="danger">{{ error }}</el-text>
    </div>
    
    <div v-else>
      <div v-if="filteredEntriesRoot.length === 0" class="empty-state">
        <el-text type="info">{{ normalizedQuery ? t('common.no_match') : t('common.no_files') }}</el-text>
      </div>
      
      <div v-for="entry in filteredEntriesRoot" :key="entry.path" class="folder-container">
        <div class="file-row" @click="toggleDir(entry)">
          <div class="file-info">
            <el-icon class="page-icon"><Folder /></el-icon>
            <span class="single-title">{{ entry.name }}</span>
            <div class="version-info" v-if="folderDates[entry.path]">
              <el-icon class="calendar-icon"><Calendar /></el-icon>
              <span class="date">{{ formatDate(folderDates[entry.path]) }}</span>
            </div>
          </div>
          
          <div class="file-actions" @click.stop>
            <el-button class="action-btn" type="text" size="small" @click="toggleDir(entry)">
              <el-icon v-if="!openDirs[entry.path]"><ArrowDown /></el-icon>
              <el-icon v-else><ArrowUp /></el-icon>
              <span class="btn-text">{{ openDirs[entry.path] ? t('action.collapse') : t('action.expand') }}</span>
            </el-button>
            
            <a :href="getFolderUrl(entry)" target="_blank" rel="noopener" class="download-link">
              <el-button class="action-btn" type="text" size="small">
                <el-icon class="action-icon"><Link /></el-icon>
                <span class="btn-text">{{ t('action.repo') }}</span>
              </el-button>
            </a>
            
            <el-button class="action-btn copy-btn" type="text" size="small" @click="copyLink(getFolderUrl(entry))">
              <el-icon class="action-icon"><CopyDocument /></el-icon>
              <span class="btn-text">{{ copiedFiles[getFolderUrl(entry)] ? t('action.copied') : t('action.copy') }}</span>
            </el-button>
          </div>
        </div>
        
        <transition name="expand">
          <div v-if="openDirs[entry.path]" class="nested-files">
            <div
              v-for="child in getFilteredFilesForFolder(entry.path)"
              :key="child.path"
              class="nested-file-item"
              :class="{ 'clickable': isViewable(child) }"
              @click="isViewable(child) ? openFile(blobUrlFor(child)) : null"
            >
              <div class="nested-file-info">
                <el-icon class="file-icon"><Document /></el-icon>
                <span class="file-name-text">{{ child.name }}</span>
              </div>
              
              <div class="nested-file-actions" @click.stop>
                <el-button v-if="isViewable(child)" class="action-btn" type="primary" size="small" @click="openFile(blobUrlFor(child))">
                  <el-icon><View /></el-icon>
                  <span class="btn-text">{{ t('action.view') }}</span>
                </el-button>
                
                <a :href="rawUrlFor(child)" target="_blank" rel="noopener" class="download-link">
                  <el-button class="action-btn" size="small">
                    <el-icon><Download /></el-icon>
                    <span class="btn-text">{{ t('action.download') }}</span>
                  </el-button>
                </a>
                
                <el-button class="action-btn" size="small" @click="copyLink(blobUrlFor(child))">
                  <el-icon><CopyDocument /></el-icon>
                  <span class="btn-text">{{ copiedFiles[blobUrlFor(child)] ? t('action.copied') : t('action.copy') }}</span>
                </el-button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Folder,
  Link,
  View,
  CopyDocument,
  Download,
  ArrowDown,
  ArrowUp,
  Document,
  Calendar
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { showCenteredToast } from '../utils/centerToast'
import { fetchWithCache } from '../utils/apiCache'
import { getGitHubHeaders } from '../utils/github'
import { ref, reactive, onMounted, computed, defineExpose, watch } from "vue";
import { useI18n } from 'vue-i18n';

function formatDateShort(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.valueOf())) return d;
    return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
  } catch {
    return d;
  }
}

const { t } = useI18n();

// Props: keep name/description but make repoUrl optional (default to dieWehmut/Files)
const props = defineProps({
  fileName: {
    type: String,
    required: false,
    default: 'Files',
  },
  repoUrl: {
    type: String,
    default: 'https://github.com/dieWehmut/Files',
  },
  description: {
    type: String,
    default: '',
  },
  filterQuery: {
    type: String,
    default: '',
  },
});

// State
const entriesRoot = ref([]); // root entries (files + dirs)
const entriesMap = reactive({}); // path => array of items
const openDirs = reactive({}); // path => boolean
const loading = ref(true);
const error = ref(null);
const copiedFiles = reactive({});
const folderDates = reactive({});
let defaultBranch = 'main';

// Filter logic
const normalizedQuery = computed(() => (props.filterQuery || '').trim().toLowerCase());

// Filter root entries (folders) based on search query
const filteredEntriesRoot = computed(() => {
  if (!normalizedQuery.value) return entriesRoot.value;
  
  return entriesRoot.value.filter(folder => {
    // Check if folder name matches
    if (folder.name.toLowerCase().includes(normalizedQuery.value)) return true;
    
    // Check if any file in this folder matches
    const filesInFolder = entriesMap[folder.path] || [];
    return filesInFolder.some(file => 
      file.name.toLowerCase().includes(normalizedQuery.value)
    );
  });
});

// Get filtered files for a specific folder
function getFilteredFilesForFolder(folderPath) {
  const files = entriesMap[folderPath] || [];
  if (!normalizedQuery.value) return files;
  
  return files.filter(file => 
    file.name.toLowerCase().includes(normalizedQuery.value)
  );
}

// Count total matched files across all folders
const matchedFilesCount = computed(() => {
  if (!normalizedQuery.value) return entriesRoot.value.length;
  
  let count = 0;
  filteredEntriesRoot.value.forEach(folder => {
    const filtered = getFilteredFilesForFolder(folder.path);
    count += filtered.length;
  });
  return count;
});

// 暴露文件夹数量和匹配数量给父组件
const filesCount = computed(() => entriesRoot.value.length);
defineExpose({ filesCount: computed(() => entriesRoot.value.length), matchedFilesCount, loading, error });

// Determine owner/repo from repoUrl or default
function parseRepo(urlStr) {
  try {
    const url = new URL(urlStr);
    // path like /owner/repo
    const parts = url.pathname.replace(/^\//, '').split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch (e) {
    // ignore
  }
  return { owner: 'dieWehmut', repo: 'Files' };
}

async function loadContents(path = '') {
  loading.value = true;
  error.value = null;
  const { owner, repo } = parseRepo(props.repoUrl);
  try {
    // Get repo to learn default branch (once)
    if (!defaultBranch) defaultBranch = 'main';
    // cache repo info and contents to reduce API calls
    try {
      const repoData = await fetchWithCache(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers: getGitHubHeaders() },
        1000 * 60 * 60
      );
      if (repoData && repoData.default_branch) defaultBranch = repoData.default_branch || defaultBranch;
    } catch (e) {
      // ignore
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let data = null;
    try {
      data = await fetchWithCache(apiUrl, { headers: getGitHubHeaders() }, 1000 * 60 * 15);
    } catch (e) {
      error.value = t('error.unable_load') || 'Unable to load files.';
      return;
    }
    // data is array for directories, object for file
    const items = Array.isArray(data) ? data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file' or 'dir'
      download_url: item.download_url,
      html_url: item.html_url,
      sha: item.sha,
      size: item.size,
      extension: getFileExtension(item.name),
    })) : [];

    if (!path) {
      // only list directories at root
      entriesRoot.value = items
        .filter(i => i.type === 'dir')
        .sort((a, b) => a.name.localeCompare(b.name));
      // keep entriesMap for root empty (not used)
      entriesMap[''] = [];
      // Fetch commit dates for root folders
      fetchFolderDates();
    } else {
      // when loading a folder, store only files inside it
      entriesMap[path || ''] = items.filter(i => i.type === 'file');
    }
  } catch (e) {
    error.value = t('error.unable_load') || 'Unable to load files.';
  } finally {
    loading.value = false;
  }
}

async function fetchFolderDates() {
  const { owner, repo } = parseRepo(props.repoUrl);
  await Promise.all(entriesRoot.value.map(async (folder) => {
    try {
      const commits = await fetchWithCache(
        `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(folder.path)}&per_page=1`,
        { headers: getGitHubHeaders() },
        1000 * 60 * 60 * 6
      );
      if (Array.isArray(commits) && commits.length > 0) {
        folderDates[folder.path] = commits[0]?.commit?.committer?.date || commits[0]?.commit?.author?.date || null;
      }
    } catch (e) {
      // ignore
    }
  }));
}

function getDisplayName(filename) {
  return filename.replace(/\.[^/.]+$/, '');
}

function getFileExtension(filename) {
  if (!filename || !filename.includes('.')) return 'FILE';
  const parts = filename.split('.');
  return parts[parts.length - 1].toUpperCase();
}

// Which extensions we treat as viewable in-browser
const viewableExts = new Set(["PDF","MD","TXT","PNG","JPG","JPEG","SVG","HTML","HTM","GIF"]);

function isViewable(file) {
  if (!file) return false;
  const ext = (file.extension || '').toString().toUpperCase();
  return viewableExts.has(ext);
}

function openFile(url) {
  window.open(url, '_blank', 'noopener');
}

// expose formatting to template
const formatDate = formatDateShort;

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    copiedFiles[url] = true;
    showCenteredToast(t('action.copied') || 'Copied', { type: 'success', duration: 3000 });
    setTimeout(() => delete copiedFiles[url], 3000);
  } catch (err) {
    // fallback to input copy (no console logs)
    try {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      copiedFiles[url] = true;
      showCenteredToast(t('action.copied') || 'Copied', { type: 'success', duration: 3000 });
      setTimeout(() => delete copiedFiles[url], 3000);
      document.body.removeChild(input);
    } catch (e) {
      showCenteredToast(t('action.copy_failed') || 'Copy failed', { type: 'error', duration: 3000 });
    }
  }
}

// load root on mount
onMounted(() => {
  loadContents('');
});

// Watch for search query changes and auto-expand matching folders
watch(normalizedQuery, async (newQuery) => {
  if (newQuery) {
    // When searching, expand folders that have matching files
    for (const folder of filteredEntriesRoot.value) {
      // Load folder contents if not already loaded
      if (!entriesMap[folder.path]) {
        await loadContents(folder.path);
      }
      // Check if this folder has matching files
      const matchingFiles = getFilteredFilesForFolder(folder.path);
      if (matchingFiles.length > 0) {
        openDirs[folder.path] = true;
      }
    }
  }
});

// helper to get raw URL for a file using default branch
function rawUrlFor(item) {
  const { owner, repo } = parseRepo(props.repoUrl);
  return item.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`;
}

// helper to get GitHub blob/html URL for viewing on GitHub
function blobUrlFor(item) {
  const { owner, repo } = parseRepo(props.repoUrl);
  return item.html_url || `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${item.path}`;
}

// helper to get folder URL on GitHub
function getFolderUrl(item) {
  const { owner, repo } = parseRepo(props.repoUrl);
  return item.html_url || `https://github.com/${owner}/${repo}/tree/${defaultBranch}/${item.path}`;
}

// toggle directory open/close and load if needed
async function toggleDir(item) {
  const p = item.path || '';
  openDirs[p] = !openDirs[p];
  if (openDirs[p] && !entriesMap[p]) {
    await loadContents(p);
  }
}
</script>

<style scoped>
.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-state,
.error-state,
.empty-state {
  padding: 24px;
  text-align: center;
}

.folder-container {
  margin: 4px 0;
}

.file-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  margin: 4px 0;
  border: 1px solid transparent;
}

.file-row:focus {
  outline: none;
  border-color: transparent !important;
  box-shadow: none !important;
}

@media (hover: hover) {
  .file-row {
    transition: transform 0.14s ease, box-shadow 0.18s ease;
    will-change: transform, box-shadow;
  }

  .file-row {
    background: rgba(0,0,0,0.6) !important;
    color: #f5f5f5 !important;
  }

  .file-row:hover {
    background: transparent !important;
    border-color: transparent !important;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }

  .file-row:not(:hover) {
    background: rgba(0,0,0,0.6) !important;
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
  line-height: 1.5;
  font-size: 14px;
}

  .page-icon {
  font-size: 18px;
  color: #ffffff !important;
  flex-shrink: 0;
}

.title-container {
  flex: 1;
  min-width: 0;
}

  .single-title {
  font-weight: 600;
  color: #f5f5f5 !important;
  font-size: 14px;
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

.file-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-self: center;
}

  .action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  text-decoration: none;
  color: #f5f5f5 !important;
  border: 1px solid transparent;
}

.action-btn:hover {
  background: transparent !important;
  border-color: transparent !important;
}

.action-icon {
  font-size: 14px;
  color: #2b2b2b;
}

.btn-text {
  font-size: 12px;
  font-weight: 600;
}

.download-link {
  text-decoration: none;
}

/* 嵌套文件列表 */
.nested-files {
  margin-top: 12px;
  padding-left: 48px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

  .nested-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-radius: 6px;
  background: rgba(0,0,0,0.6) !important;
  color: #f5f5f5 !important;
  transition: all 0.2s ease;
  gap: 24px;
}

  .nested-file-item:hover {
  background: transparent !important;
  transform: translateX(4px);
}

  .nested-file-item:not(:hover) {
    background: rgba(0,0,0,0.6) !important;
  }

.nested-file-item.clickable {
  cursor: pointer;
}

.nested-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

  .file-icon {
  font-size: 16px;
  color: #ffffff !important;
  flex-shrink: 0;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

  .file-name-text {
  font-size: 13px;
  color: #f5f5f5 !important;
  font-weight: 500;
}

.nested-file-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
}

/* 展开/收起动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .file-row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .file-actions {
    align-self: stretch;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nested-files {
    padding-left: 24px;
  }

  .nested-file-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .nested-file-info {
    width: 100%;
  }

  .nested-file-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
