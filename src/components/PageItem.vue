<template>
  <div class="item" tabindex="0" role="button">
    <div class="item__main">
      <div class="item__line">
        <template v-if="pageName">
          <span class="page-info">
            <el-icon class="page-icon"><Document /></el-icon>
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
          <span v-if="version.log" class="version-log">{{ version.log }}</span>
        </div>
        <span class="separator"></span>
      </div>
    </div>
    <div class="item__actions">
      <a
        class="action-btn link-button"
        :href="version.url"
        target="_blank"
        rel="noopener"
        @click.stop
      >
        <el-icon class="action-icon"><Promotion /></el-icon>
        <span class="action-text">{{ t('action.open') }}</span>
      </a>
      <template v-if="repoUrl && pageName">
          <a
          class="action-btn repo-button"
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          @click.stop
        >
          <el-icon class="action-icon"><Link/></el-icon>
            <span class="action-text">{{ t('action.repo') }}</span>
        </a>
      </template>
      <el-button
        size="small"
        type="text"
        @click.stop="copyLink"
        class="action-btn copy-btn"
      >
        <el-icon><DocumentCopy /></el-icon>
        <span class="btn-text">{{ copied ? t('action.copied') : t('action.copy') }}</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { showCenteredToast } from '../utils/centerToast'
import { ref } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { DocumentCopy, Document, Calendar, Link, Promotion } from "@element-plus/icons-vue";

const props = defineProps({
  pageName: { type: String, required: false },
  emoji: { type: String, required: false },
  repoUrl: { type: String, required: false },
  version: {
    type: Object,
    required: true,
  },
});

const copied = ref(false);

async function copyLink() {
  const url = props.version?.url ?? "";
  if (!url) {
    ElMessage({ message: "🔗 No link available", type: 'warning', customClass: 'bw-message' });
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
  copied.value = true;
  showCenteredToast('action.copied', { type: 'success', duration: 3000 });
    setTimeout(() => (copied.value = false), 3000);
  } catch (e) {
    const input = document.createElement("input");
    input.value = url;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
  copied.value = true;
  showCenteredToast('action.copied', { type: 'success', duration: 3000 });
    setTimeout(() => (copied.value = false), 3000);
    } catch {
  showCenteredToast('action.copy_failed', { type: 'error', duration: 3000 });
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

.item:focus {
  outline: none;
  border-color: transparent !important;
  box-shadow: none !important;
}

/* Per-item hover elevation (only on hover-capable devices) */
@media (hover: hover) {
  .item {
    transition: transform 0.14s ease, box-shadow 0.18s ease;
    will-change: transform, box-shadow;
  }

  .item:hover {
    background: transparent !important;
    border-color: transparent !important;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }
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
  background: transparent !important;
  padding: 4px 12px;
  border-radius: 12px;
  border: none !important;
}

.page-icon {
  font-size: 18px;
  color: #2b2b2b; /* 统一为黑白风格 */
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

.version-log {
  color: #2f3235;
  margin-left: 8px;
  font-size: 13px;
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
  background: transparent !important;
  border-color: transparent !important;
  color: inherit !important;
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
  color: #4a4a4a;
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
.action-text {
  font-size: 13px;
  font-weight: 600;
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
    align-self: stretch;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
