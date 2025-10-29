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
            <el-text size="small" type="info">{{ t('common.totalFiles', { count: files.length }) }}</el-text>
            <el-button class="action-btn" type="text" size="small" @click="isOpen = !isOpen">
              <el-icon v-if="!isOpen"><ArrowDown /></el-icon>
              <el-icon v-else><ArrowUp /></el-icon>
              <span>{{ isOpen ? t('action.collapse') : t('action.expand') }}</span>
            </el-button>
          </div>
          
          <transition name="expand">
            <div v-if="isOpen" class="file-list__content">
              <div
                class="file-list__item"
                :class="{ 'has-view': isViewable(file) }"
                v-for="file in files"
                :key="file.name"
              >
    <div class="file-info">
      <el-icon class="file-list-icon"><Document /></el-icon>
      <span class="file-name-text">{{ file.name }}</span>
    </div>
                <div class="file-list__actions">
                  <el-button v-if="isViewable(file)" class="action-btn" type="primary" size="small" @click="openFile(file.rawUrl)">
                    <el-icon><View /></el-icon>
                    {{ t('action.view') }}
                  </el-button>
                  <a :href="file.downloadUrl" target="_blank" rel="noopener" class="download-link">
                    <el-button class="action-btn" size="small">
                      <el-icon><Download /></el-icon>
                      {{ t('action.download') }}
                    </el-button>
                  </a>
                  <el-button class="action-btn" size="small" @click="copyLink(file.rawUrl)">
                    <el-icon><CopyDocument /></el-icon>
                    <span class="btn-text">{{ copiedFiles[file.rawUrl] ? t('action.copied') : t('action.copy') }}</span>
                  </el-button>
                </div>
              </div>
            </div>
          </transition>
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

const { t } = useI18n();

const props = defineProps({
  fileName: {
    type: String,
    required: true,
  },
  repoUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});

const files = ref([]);
const loading = ref(true);
const error = ref(null);
const isOpen = ref(false);
const copiedFiles = reactive({});

async function loadFiles() {
  try {
    loading.value = true;
    error.value = null;

    const url = new URL(props.repoUrl);
    
    // Only support git.nju.edu.cn or gitlab style URLs that contain '/-/tree/'
    if (!url.pathname.includes("/-/tree/")) {
      throw new Error("Invalid repository URL format");
    }

    // Extract namespace/project and path after tree
    // Example path: /dieSehnsucht/learningmaterials/-/tree/main/HighSchoolNotes
    const parts = url.pathname.split("/-/tree/");
    const projectPath = parts[0].slice(1); // remove leading /
    const treePart = parts[1] || ""; // e.g. main/HighSchoolNotes
    const [ref, ...pathParts] = treePart.split("/");
    const dirPath = pathParts.join("/");

    // Construct GitLab API URL
    const apiUrl = `${url.origin}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/tree?path=${dirPath}&ref=${ref || 'main'}`;
    
    // Construct raw base URL
    const rawBaseUrl = `${url.origin}/${projectPath}/-/raw/${ref || 'main'}/${dirPath}`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load files: ${response.status}`);
    }

    const data = await response.json();

    // Map blobs to file objects (initially without lastModified)
    const mapped = data
      .filter(item => item.type === 'blob')
      .map(item => {
        const encodedName = encodeURIComponent(item.name);
        const raw = `${rawBaseUrl}/${encodedName}`;
        return {
          name: item.name,
          displayName: getDisplayName(item.name),
          path: item.path,
          rawUrl: raw,
          downloadUrl: `${raw}?inline=false`,
          extension: getFileExtension(item.name),
          lastModified: null,
        };
      });

    // Fetch the latest commit for each file to get its last modified time (may be many requests)
    const withDates = await Promise.all(
      mapped.map(async (f) => {
        try {
          const commitsUrl = `${url.origin}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/commits?path=${encodeURIComponent(
            f.path
          )}&per_page=1&ref_name=${encodeURIComponent(ref || 'main')}`;
          const commitResp = await fetch(commitsUrl);
          if (commitResp.ok) {
            const commits = await commitResp.json();
            if (Array.isArray(commits) && commits.length > 0) {
              f.lastModified = commits[0].committed_date;
            }
          }
        } catch (e) {
          // ignore per-file failures
        }
        return f;
      })
    );

    // Sort by lastModified desc (newest first). Fallback to name ordering when missing.
    files.value = withDates.sort((a, b) => {
      if (a.lastModified && b.lastModified) {
        return new Date(b.lastModified) - new Date(a.lastModified);
      }
      if (a.lastModified) return -1;
      if (b.lastModified) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

  } catch (err) {
    console.error('Failed to load files:', err);
    error.value = 'Unable to load files. Please check network connection.';
  } finally {
    loading.value = false;
  }
}

function getDisplayName(filename) {
  return filename.replace(/\.[^/.]+$/, '');
}

function getFileExtension(filename) {
  const ext = filename.split('.').pop().toUpperCase();
  return ext || 'FILE';
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

async function copyLink(url) {
  try {
  await navigator.clipboard.writeText(url);
  copiedFiles[url] = true;
  showCenteredToast('action.copied', { type: 'success', duration: 3000 });
    setTimeout(() => delete copiedFiles[url], 3000);
  } catch (err) {
    console.error('Copy failed:', err);
    // fallback to input copy
    try {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
  copiedFiles[url] = true;
  showCenteredToast('action.copied', { type: 'success', duration: 3000 });
      setTimeout(() => delete copiedFiles[url], 3000);
      document.body.removeChild(input);
    } catch (e) {
  showCenteredToast('action.copy_failed', { type: 'error', duration: 3000 });
    }
  }
}

onMounted(() => {
  loadFiles();
});
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
}

.file-list__item.has-view {
  /* only items with a view link show a subtle dark translucent background by default */
  background: rgba(0,0,0,0.12);
  color: #f5f5f5;
}

.file-list__item.has-view:hover {
  /* hover makes the item transparent and switch text to dark to match pages behavior */
  background: transparent !important;
  /* keep text white as requested */
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
  }
}
</style>
