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
            <span>Repo</span>
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
            <el-text size="small" type="info">Total {{ files.length }} files</el-text>
            <el-button class="action-btn" type="text" size="small" @click="isOpen = !isOpen">
              <el-icon v-if="!isOpen"><ArrowDown /></el-icon>
              <el-icon v-else><ArrowUp /></el-icon>
              <span>{{ isOpen ? 'Collapse' : 'Expand' }}</span>
            </el-button>
          </div>
          
          <transition name="expand">
            <div v-if="isOpen" class="file-list__content">
              <div
                class="file-list__item"
                v-for="file in files"
                :key="file.name"
              >
                <div class="file-info">
                        <el-icon class="file-list-icon"><Document /></el-icon>
                        <span class="file-name-text">{{ file.displayName }}</span>
                  <span class="file-type">{{ file.extension }}</span>
                </div>
                <div class="file-list__actions">
                  <el-button class="action-btn" type="primary" size="small" @click="openFile(file.rawUrl)">
                    <el-icon><View /></el-icon>
                    View
                  </el-button>
                  <el-button class="action-btn" size="small" @click="copyLink(file.rawUrl)">
                    <el-icon><CopyDocument /></el-icon>
                    Copy
                  </el-button>
                  <a :href="file.downloadUrl" target="_blank" rel="noopener" class="download-link">
                    <el-button class="action-btn" size="small">
                      <el-icon><Download /></el-icon>
                      Download
                    </el-button>
                  </a>
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
import { ref, onMounted } from "vue";

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

    files.value = data
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
          extension: getFileExtension(item.name)
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

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

function openFile(url) {
  window.open(url, '_blank', 'noopener');
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success('Link copied to clipboard');
  } catch (err) {
    console.error('Copy failed:', err);
    ElMessage.error('Failed to copy link');
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
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.file-item__content:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
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
  color: #2b2b2b; /* 单色 */
  margin-right: 8px;
}

.file-name-text {
  font-size: 14px;
  color: #333;
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
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: #333;
}
.repo-link.action-btn:hover {
  background: #f5f7fa;
  border-color: #e8ecf0;
  transform: translateY(-1px) scale(1.01);
}

/* Scoped override to ensure repo-link used as action-btn inside this component
   wins over other scoped/global rules that set it blue. */
.repo-link.action-btn {
  color: #333 !important;
  background: #fff !important;
  border: 1px solid var(--border-color) !important;
  padding: 8px 12px !important;
  border-radius: 10px !important;
  margin-left: auto;
}
.repo-link.action-btn:hover {
  background: #f5f7fa !important;
  border-color: #e8ecf0 !important;
}

.file-item__description {
  margin-bottom: 12px;
  font-size: 14px;
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
  border-bottom: 1px solid #eee;
}

.file-list__content {
  margin-top: 8px;
}

.file-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #f0f0f0;
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
  color: #333;
  font-weight: 500;
}

.file-type {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.file-list__actions {
  display: flex;
  gap: 12px;
  align-items: center;
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
</style>
