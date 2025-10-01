<template>
  <div class="file-item">
    <div class="file-item__content">
      <div class="file-item__header">
        <div class="file-item__title">
          <el-icon><Folder /></el-icon>
          <span>{{ fileName }}</span>
        </div>
        <div class="file-item__actions">
          <a class="repo-link" :href="repoUrl" target="_blank" rel="noopener">
            <el-icon><Link /></el-icon>
            <span>Repo</span>
          </a>
        </div>
      </div>

      <div class="file-item__description">
        <el-text type="info">{{ description || "File repository" }}</el-text>
      </div>

      <div class="file-item__footer">
        <!-- If filesLoaded, show per-file view/copy buttons, else show single actions -->
        <template v-if="files && files.length">
          <div class="file-list">
            <div class="file-list__header">
              <el-text size="small" type="info">Total {{ files.length }} files</el-text>
              <el-button type="text" size="small" @click="isOpen = !isOpen">
                <el-icon v-if="!isOpen"><ArrowDown /></el-icon>
                <el-icon v-else><ArrowUp /></el-icon>
                <span>{{ isOpen ? 'Collapse' : 'Expand' }}</span>
              </el-button>
            </div>
            <div v-if="isOpen">
              <div
                class="file-list__item"
                v-for="f in files"
                :key="f.path"
              >
                <div class="file-list__name">{{ f.name }}</div>
                <div class="file-list__actions">
                  <el-button type="warning" size="small" @click="openRaw(f.raw_url)">
                    <el-icon><FolderOpened /></el-icon>
                    View
                  </el-button>
                  <el-button size="small" @click="downloadRawFile(f.raw_url)">
                    <el-icon><Download /></el-icon>
                    Download
                  </el-button>
                  <el-button size="small" @click="copyRawLink(f.raw_url)">
                    <el-icon><CopyDocument /></el-icon>
                    Copy Link
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <el-button type="warning" size="small" @click="openRepo">
            <el-icon><FolderOpened /></el-icon>
            View 
          </el-button>
          <el-button size="small" @click="copyRepoLink">
            <el-icon><CopyDocument /></el-icon>
            Copy Link
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Folder,
  Link,
  FolderOpened,
  CopyDocument,
  Download,
} from "@element-plus/icons-vue";
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";
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
const isOpen = ref(false); // collapsed by default

// Try to parse GitLab tree URL and load file list
function tryLoadGitLabFiles() {
  try {
    const url = new URL(props.repoUrl);
    // Only support git.nju.edu.cn or gitlab style URLs that contain '/-/tree/'
    if (!url.pathname.includes("/-/tree/")) return;

    // Extract namespace/project and path after tree
    // Example path: /dieSehnsucht/learningmaterials/-/tree/main/HighSchoolNotes
    const parts = url.pathname.split("/-/tree/");
    const projectPath = parts[0].slice(1); // remove leading /
    const treePart = parts[1] || ""; // e.g. main/HighSchoolNotes
    const [ref, ...pathParts] = treePart.split("/");
    const dirPath = pathParts.join("/");

    // Construct GitLab raw base: https://{host}/{project}/-/raw/{ref}/{dirPath}/<filename>
    // To list files we attempt to use the GitLab repository tree API if CORS allows.
    const apiBase = `${url.origin}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/tree`;

    const apiUrl = new URL(apiBase);
    apiUrl.searchParams.set("ref", ref || "main");
    if (dirPath) apiUrl.searchParams.set("path", dirPath);
    apiUrl.searchParams.set("per_page", "100");

    fetch(apiUrl.toString())
      .then((r) => {
        if (!r.ok) throw new Error("Unable to fetch repository tree");
        return r.json();
      })
      .then((data) => {
        // Filter only blobs (files)
        const blobs = (data || []).filter((i) => i.type === "blob");
        files.value = blobs.map((b) => {
          const raw_url = `${url.origin}/${projectPath}/-/raw/${ref}/${encodeURIComponent(dirPath ? dirPath + '/' + b.path.split('/').pop() : b.path)}` + (url.search ? url.search : "");
          return {
            name: b.name,
            path: b.path,
            raw_url,
          };
        });
      })
      .catch(() => {
        // ignore errors and leave files empty to fallback to original behavior
        files.value = [];
      });
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  tryLoadGitLabFiles();
});

function openRepo() {
  window.open(props.repoUrl, "_blank", "noopener");
}

function copyRepoLink() {
  navigator.clipboard.writeText(props.repoUrl).then(() => {
    ElMessage.success("Repository link copied");
  });
}

function openRaw(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener");
}

function copyRawLink(url) {
  if (!url) return;
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success("Raw file link copied");
  });
}

function withInlineFalse(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("inline", "false");
    return parsed.toString();
  } catch (e) {
    const hasQuery = url.includes("?");
    const inlinePattern = /([?&])inline=[^&#]*/;
    if (inlinePattern.test(url)) {
      return url.replace(inlinePattern, "$1inline=false");
    }
    return `${url}${hasQuery ? "&" : "?"}inline=false`;
  }
}

function downloadRawFile(url) {
  const downloadUrl = withInlineFalse(url);
  if (!downloadUrl) return;
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style scoped>
.file-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.file-item__content {
  padding: 16px;
}

.file-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.file-item__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.file-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repo-link {
  color: #6ba3f5;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 2px 6px;
  border-radius: 4px;
}

.repo-link:hover {
  color: #4a90e2;
  background: rgba(106, 163, 245, 0.1);
}

.file-item__description {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.file-item__footer {
  display: flex;
  gap: 8px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px; /* spacing between header and items */
}

.file-list__header {
  padding: 6px 0 0 0;
}

.file-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px dashed #eee;
}

.file-list__item:first-of-type {
  border-top: none;
  padding-top: 4px;
}

.file-list__name {
  font-size: 14px;
  color: #333;
}

.file-list__actions {
  display: flex;
  gap: 8px;
}
</style>
