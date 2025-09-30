<template>
  <div class="game-item" tabindex="0" role="button">
    <div class="game-item__main">
      <div class="game-item__line">
        <template v-if="gameName">
          <span class="game-info">
            <el-icon class="game-icon"><Monitor /></el-icon>
            <span class="game-name">{{ gameName }}</span>
          </span>
        </template>
        <div class="version-info">
          <el-icon class="calendar-icon"><Calendar /></el-icon>
          <span class="date">{{ formatDate(version.date) }}</span>
          <template v-if="version.version">
            <el-tag size="small" effect="light" class="version-tag">
              {{ version.version }}
            </el-tag>
          </template>
        </div>
        <span class="separator"></span>
        <a
          class="link"
          :href="version.url"
          target="_blank"
          rel="noopener"
          @click.stop
        >
          <el-icon class="link-icon"><Download /></el-icon>
          <span>{{ version.log }}</span>
        </a>
        <template v-if="repoUrl && gameName">
          <span class="separator"></span>
          <a
            class="repo-link"
            :href="repoUrl"
            target="_blank"
            rel="noopener"
            @click.stop
          >
            <el-icon class="repo-icon"><Link /></el-icon>
            <span>Repo</span>
          </a>
        </template>
      </div>
    </div>
    <div class="game-item__actions">
      <el-button
        size="small"
        type="default"
        @click.stop="copyLink"
        class="copy-btn"
        text
      >
        <el-icon><DocumentCopy /></el-icon>
        <span class="btn-text">Copy Link</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import {
  Monitor,
  Link,
  Download,
  DocumentCopy,
  Calendar,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  gameName: {
    type: String,
    default: "",
  },
  version: {
    type: Object,
    required: true,
  },
  repoUrl: {
    type: String,
    default: "",
  },
});

function copyLink() {
  const url = props.version?.url ?? "";
  if (!url) {
    ElMessage.warning("🔗 No link available");
    return;
  }

  navigator.clipboard
    .writeText(url)
    .then(() => {
      ElMessage.success("📋 Link copied to clipboard");
    })
    .catch(() => {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        ElMessage.success("📋 Link copied to clipboard");
      } catch {
        ElMessage.error("❌ Copy failed");
      }
      document.body.removeChild(input);
    });
}

function formatDate(d) {
  try {
    const date = new Date(d);
    if (!isNaN(date.valueOf())) {
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const day = date.getDate();
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return d;
}
</script>

<style scoped>
.game-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 50px;
  border: 1px solid transparent;
  background: #fafafa;
}

.game-item:hover {
  background: #f0f9ff;
  border-color: #e1f5fe;
}

.game-item:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.game-item__main {
  flex: 1;
  min-width: 0;
}

.game-item__line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  line-height: 1.5;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #2c2c2c;
}

.game-icon {
  font-size: 16px;
  color: #409eff;
}

.game-name {
  font-size: 15px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.calendar-icon {
  font-size: 12px;
}

.date {
  font-size: 13px;
}

.version-tag {
  font-size: 11px;
  height: 20px;
  margin-left: 4px;
}

.separator {
  color: #ccc;
  font-weight: bold;
  margin: 0 2px;
}

.link {
  color: #409eff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.link:hover {
  color: #337ecc;
  text-decoration: underline;
}

.link-icon {
  font-size: 12px;
}

.repo-link {
  color: #6ba3f5;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.repo-link:hover {
  color: #4a90e2;
  text-decoration: underline;
}

.repo-icon {
  font-size: 11px;
}

.game-item__actions {
  margin-left: 12px;
}

.copy-btn {
  color: #666;
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
}

.copy-btn:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.btn-text {
  margin-left: 4px;
}
</style>
