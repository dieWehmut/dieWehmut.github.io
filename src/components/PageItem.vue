<template>
  <div class="item" tabindex="0" role="button">
    <div class="item__main">
      <div class="item__line">
        <template v-if="pageName">
          <span class="page-info">
            <span class="page-emoji">{{ emoji || "📄" }}</span>
            <span class="page-name">{{ pageName }}</span>
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
        <span class="separator">·</span>
        <a
          class="link"
          :href="version.url"
          target="_blank"
          rel="noopener"
          @click.stop
        >
          <el-icon class="link-icon"><Link /></el-icon>
          <span>{{ version.log }}</span>
        </a>
        <template v-if="repoUrl && pageName">
          <span class="separator">·</span>
          <a
            class="repo-link"
            :href="repoUrl"
            target="_blank"
            rel="noopener"
            @click.stop
          >
            <el-icon class="repo-icon"><Link /></el-icon>
            <span>Repository</span>
          </a>
        </template>
      </div>
    </div>
    <div class="item__actions">
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
import { ElMessage } from "element-plus";
import { DocumentCopy, Calendar, Link } from "@element-plus/icons-vue";

const props = defineProps({
  pageName: { type: String, required: false },
  emoji: { type: String, required: false },
  repoUrl: { type: String, required: false },
  version: {
    type: Object,
    required: true,
  },
});

async function copyLink() {
  const url = props.version?.url ?? "";
  if (!url) {
    ElMessage.warning("🔗 No link available");
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success("📋 Link copied to clipboard");
  } catch (e) {
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
  }
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
.item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  margin: 4px 0;
  border: 1px solid transparent;
}

.item:focus,
.item:hover {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
  border-color: #e8f2ff;
  box-shadow: 0 2px 8px rgba(123, 179, 240, 0.08);
}

.item__main {
  min-width: 0;
  flex: 1;
}

.item__line {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #4a4a4a;
  flex-wrap: wrap;
  line-height: 1.5;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #e8ecf0;
}

.page-emoji {
  font-size: 16px;
}

.page-name {
  font-weight: 600;
  color: #3a3a3a;
  font-size: 14px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #7a7a7a;
}

.calendar-icon {
  color: #a8c8ec;
  font-size: 14px;
}

.date {
  font-size: 13px;
  font-weight: 500;
}

.version-tag {
  background: #e8f5e8;
  border-color: #c8e6c8;
  color: #4a9a4a;
  font-weight: 600;
  border-radius: 8px;
  font-size: 11px;
  padding: 2px 8px;
}

.separator {
  color: #d0d0d0;
  font-weight: bold;
}

.link {
  color: #6ba3f5;
  text-decoration: none;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.link:hover {
  color: #4a90e2;
  text-decoration: none;
}

.link-icon {
  font-size: 14px;
  opacity: 0.8;
}

.repo-link {
  color: #8a5cf5;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 13px;
}

.repo-link:hover {
  color: #7c3aed;
  text-decoration: none;
}

.repo-icon {
  font-size: 12px;
  opacity: 0.8;
}

.item__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-self: center;
}

.copy-btn {
  border: 1px solid #e8ecf0;
  background: #fefefe;
  color: #7a7a7a;
  border-radius: 8px;
  padding: 6px 12px;
  transition: all 0.2s ease;
  font-size: 12px;
}

.copy-btn:hover {
  background: #f0f7ff;
  border-color: #b8d4f0;
  color: #4a90e2;
  transform: translateY(-1px);
}

.copy-btn :deep(.el-icon) {
  font-size: 13px;
}

.btn-text {
  margin-left: 4px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .item {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .item__line {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .item__actions {
    align-self: flex-end;
  }
}
</style>
