<template>
  <div class="file-item">
    <div class="file-item__content">
        <div class="file-item__header">
        <div class="file-item__title">
          <el-icon><Folder /></el-icon>
          <span>{{ fileName }}</span>
        </div>
        <div class="file-item__actions">
          <a class="repo-link action-btn" :href="repoUrl" target="_blank" rel="noopener">
            <el-icon><Link /></el-icon>
            <span>{{ t('action.repo') }}</span>
          </a>
        </div>
      </div>

      <div class="file-item__description">
        <el-text type="info">{{ description || "File repository" }}</el-text>
      </div>

      <div v-if="loading" class="loading-state">
        <el-text type="info">Loading files... ⏳</el-text>
      </div>
      
      <div v-else-if="error" class="error-state">
        <el-text type="danger">{{ error }}</el-text>
      </div>

      <div v-else class="file-item__footer">
        <div class="file-list">
          <div class="file-list__header">
            <el-text size="small" type="info">{{ t('common.totalFiles', { count: entriesRoot.length }) }}</el-text>
          </div>

          <div class="file-list__content">
            <div
              class="file-list__item"
              v-for="entry in entriesRoot"
              :key="entry.path"
              :class="{ 'has-view': entry.type === 'file' && isViewable(entry) }"
            >
              <div class="file-info">
                <el-icon class="file-list-icon">
                  <Folder v-if="entry.type === 'dir'" />
                  <Document v-else />
                </el-icon>
                <div class="file-meta">
                  <span class="file-name-text">{{ entry.name }}</span>
                </div>
              </div>

              <div class="file-list__actions">
                <el-button v-if="entry.type === 'dir'" class="action-btn" type="text" size="small" @click="toggleDir(entry)">
                  <el-icon v-if="!openDirs[entry.path]"><ArrowDown /></el-icon>
                  <el-icon v-else><ArrowUp /></el-icon>
                  <span>{{ openDirs[entry.path] ? t('action.collapse') : t('action.expand') }}</span>
                </el-button>

                <el-button v-else-if="isViewable(entry)" class="action-btn" type="primary" size="small" @click="openFile(blobUrlFor(entry))">
                  <el-icon><View /></el-icon>
                  {{ t('action.view') }}
                </el-button>

                <a v-if="entry.type === 'file'" :href="rawUrlFor(entry)" target="_blank" rel="noopener" class="download-link">
                  <el-button class="action-btn" size="small">
                    <el-icon><Download /></el-icon>
                    {{ t('action.download') }}
                  </el-button>
                </a>

                <el-button v-if="entry.type === 'file'" class="action-btn" size="small" @click="copyLink(blobUrlFor(entry))">
                  <el-icon><CopyDocument /></el-icon>
                  <span class="btn-text">{{ copiedFiles[blobUrlFor(entry)] ? t('action.copied') : t('action.copy') }}</span>
                </el-button>
              </div>

              <transition name="expand">
                <div v-if="openDirs[entry.path]" class="file-list__content nested">
                  <div
                    v-for="child in entriesMap[entry.path] || []"
                    :key="child.path"
                    class="file-list__item"
                    :class="{ 'has-view': isViewable(child) }"
                  >
                    <div class="file-info">
                      <el-icon class="file-list-icon"><Document /></el-icon>
                      <div class="file-meta">
                        <span class="file-name-text">{{ child.name }}</span>
                      </div>
                    </div>
                    <div class="file-list__actions">
                      <el-button v-if="isViewable(child)" class="action-btn" type="primary" size="small" @click="openFile(blobUrlFor(child))">
                        <el-icon><View /></el-icon>
                        {{ t('action.view') }}
                      </el-button>
                      <a :href="rawUrlFor(child)" target="_blank" rel="noopener" class="download-link">
                        <el-button class="action-btn" size="small">
                          <el-icon><Download /></el-icon>
                          {{ t('action.download') }}
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
  Document
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { showCenteredToast } from '../utils/centerToast'
import { ref, reactive, onMounted } from "vue";
import { useI18n } from 'vue-i18n';

function formatDateShort(d) {
  try {
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

const { t } = useI18n();

// Props: keep name/description but make repoUrl optional (default to dieWehmut/Files)
const props = defineProps({
  fileName: {
    type: String,
    required: true,
  },
  repoUrl: {
    type: String,
    default: 'https://github.com/dieWehmut/Files',
  },
  description: {
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
let defaultBranch = 'main';

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
    const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (repoResp.ok) {
      const repoData = await repoResp.json();
      defaultBranch = repoData.default_branch || defaultBranch;
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const resp = await fetch(apiUrl);
    if (!resp.ok) {
      error.value = t('error.unable_load') || 'Unable to load files.';
      return;
    }
    const data = await resp.json();
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
.file-item {
  margin-bottom: 12px;
}

.file-item__content {
  padding: 16px;
  /* outer container is transparent by default */
  background: transparent !important;
  color: inherit;
  border-radius: 8px;
  border: none !important;
  transition: transform 0.14s ease, box-shadow 0.18s ease;
  will-change: transform, box-shadow;
}

@media (hover: hover) {
  .file-item__content:hover {
    border-color: transparent !important;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }
}

.file-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-item__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.file-list-icon {
  font-size: 18px;
  color: #2b2b2b; /* default dark icon */
  margin-right: 8px;
}

.file-name-text {
  font-size: 14px;
  color: #2b2b2b;
  font-weight: 500;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-last-modified {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  line-height: 1;
  white-space: nowrap; /* keep timestamp on same line */
}

.file-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repo-link {
  /* keep semantic link styles minimal; when used with .action-btn it will adopt unified button styles */
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2b2b2b;
}

/* When repo-link is used as a button, ensure it matches the global action-btn appearance */
.repo-link.action-btn {
  padding: 8px 12px !important;
  border-radius: 10px !important;
  border: none !important;
  background: transparent !important;
  margin-left: auto;
  color: inherit !important;
}
.repo-link.action-btn:hover {
  background: transparent !important;
}

.file-item__description {
  margin-bottom: 12px;
  font-size: 14px;
  color: #6b6b6b;
}

.loading-state,
.error-state {
  padding: 12px 0;
}

.file-item__footer {
  margin-top: 12px;
}

.file-list {
  width: 100%;
}

.file-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

}

.file-list__content {
  margin-top: 8px;
}

.file-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 6px; /* separate items to avoid visual overlap */
  /* Default: subtle black translucent background so each file row reads as a card */
  background: rgba(0,0,0,0.12) !important;
  color: #f5f5f5 !important;
  transition: transform 0.14s ease, box-shadow 0.18s ease, background 0.18s ease, color 0.12s ease;
}

.file-list__item.has-view {
  /* keep compatibility: has-view keeps same visual as default */
  background: rgba(0,0,0,0.12) !important;
  color: #f5f5f5 !important;
}

.file-list__item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: #2b2b2b;
  font-weight: 500;
}

.file-type {
  padding: 2px 8px;

  border-radius: 4px;
  font-size: 12px;
  color: #7a7a7a;
  font-weight: 500;
}

.file-list__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Mobile: stack file item actions under the file info */
@media (max-width: 768px) {
  .file-list__item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .file-list__actions {
    justify-content: flex-start;
    align-self: stretch;
    gap: 8px;
    flex-wrap: wrap;
  }
  .download-link .action-btn,
  .file-list__actions .action-btn,
  .repo-link.action-btn {
    width: auto;
    color: inherit;
  }
}

/* Only inner expanded file list items change color on hover (not entire card) */
.file-list__item:hover .file-list-icon,
.file-list__item:hover .file-name-text,
.file-list__item:hover .repo-link,
.file-list__item:hover .file-name,
.file-list__item:hover .file-type,
.file-list__item:hover .action-btn {
  /* do not force black; inherit current color so white remains when desired */
  color: inherit !important;
}

.download-link {
  text-decoration: none;
}

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

/* Hover elevation for individual file rows */
@media (hover: hover) {
  .file-list__item {
    transition: transform 0.14s ease, box-shadow 0.18s ease;
    will-change: transform, box-shadow;
    padding: 10px 0;
  }

  .file-list__item:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
    /* on hover the background should become transparent (no colored overlay) */
    background: transparent !important;
    /* keep text/icon color consistent (white) while hovered */
    color: #f5f5f5 !important;
  }
}
</style>
