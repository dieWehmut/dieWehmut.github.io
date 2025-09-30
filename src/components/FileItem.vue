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
            <span>Repository</span>
          </a>
        </div>
      </div>

      <div class="file-item__description">
        <el-text type="info">{{ description || "File repository" }}</el-text>
      </div>

      <div class="file-item__footer">
        <el-button type="warning" size="small" @click="openRepo">
          <el-icon><FolderOpened /></el-icon>
          View 
        </el-button>
        <el-button size="small" @click="copyRepoLink">
          <el-icon><CopyDocument /></el-icon>
          Copy Link
        </el-button>
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
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

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

function openRepo() {
  window.open(props.repoUrl, "_blank", "noopener");
}

function copyRepoLink() {
  navigator.clipboard.writeText(props.repoUrl).then(() => {
    ElMessage.success("Repository link copied");
  });
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
</style>
