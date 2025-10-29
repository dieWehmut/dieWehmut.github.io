<template>
  <div class="app-item" tabindex="0" role="button">
    <div class="app-item__main">
      <div class="app-item__line">
        <template v-if="appName">
          <span class="app-info">
            <el-icon class="app-icon"><Grid /></el-icon>
            <span class="app-name">{{ appName }}</span>
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
    <div class="app-item__actions">
      <a
        class="action-btn link-button"
        :href="version.url"
        target="_blank"
        rel="noopener"
        @click.stop
      >
        <el-icon class="action-icon"><Download /></el-icon>
        <span class="action-text">{{ t('action.download') }}</span>
      </a>
      <template v-if="repoUrl && appName">
          <a
          class="action-btn repo-button"
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          @click.stop
        >
          <el-icon class="action-icon"><Link /></el-icon>
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
import {
  Grid,
  Link,
  Download,
  DocumentCopy,
  Calendar,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { showCenteredToast } from '../utils/centerToast'
import { ref } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  appName: {
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

const copied = ref(false);

function copyLink() {
  const url = props.version?.url ?? "";
  if (!url) {
    ElMessage({ message: "🔗 No link available", type: 'warning', customClass: 'bw-message' });
    return;
  }

  navigator.clipboard
    .writeText(url)
    .then(() => {
  copied.value = true;
  showCenteredToast('action.copied', { type: 'success', duration: 3000 });
      setTimeout(() => (copied.value = false), 3000);
    })
    .catch(() => {
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
.app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 50px;
  border: none !important;
  background: #111; /* default: dark (黑) */
  color: #f5f5f5;
}

.app-item:focus {
  outline: none;
  border-color: transparent !important;
  box-shadow: none !important;
}

@media (hover: hover) {
  .app-item {
    transition: transform 0.14s ease, box-shadow 0.18s ease;
    will-change: transform, box-shadow;
  }

  .app-item:hover {
    background: transparent !important;
    border-color: transparent !important;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }
}

.app-item__main {
  flex: 1;
  min-width: 0;
}

.app-item__line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  line-height: 1.5;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #f5f5f5; /* default light on dark bg */
}

.app-icon {
  font-size: 18px;
  color: #ffffff; /* icon on dark bg */
}

.app-name {
  font-size: 15px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #d0d0d0;
}

.version-log {
  color: #d0d0d0;
  margin-left: 8px;
  font-size: 13px;
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

  font-weight: bold;
  margin: 0 2px;
}

.link {
  color: #d7e9ff;
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

.app-item__actions {
  margin-left: 12px;
  display: flex;
  gap: 12px;
}

/* Mobile: place actions below main content (stacked) */
@media (max-width: 768px) {
  .app-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .app-item__actions {
    margin-left: 0;
    align-self: stretch;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  text-decoration: none;
  color: #f5f5f5;
  border: 1px solid transparent;
}
.action-btn:hover {
  background: transparent !important;
  border-color: transparent !important;
}
.action-icon {
  font-size: 14px;
  color: #ffffff;
}
.action-text {
  font-size: 13px;
  font-weight: 600;
}

.btn-text {
  margin-left: 4px;
}

/* Note: keep text/icon colors unchanged on hover for App items (user preference) */
</style>
