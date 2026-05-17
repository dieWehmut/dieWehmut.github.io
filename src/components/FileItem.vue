<template>
  <div class="files-list">
    <div v-if="loading" class="loading-state">
      <el-text type="info">{{ t('common.loading') }}... ⏳</el-text>
    </div>
    <div v-else-if="error" class="error-state">
      <el-text type="danger">{{ error }}</el-text>
    </div>
    <div v-else>
      <div v-if="filteredFiles.length === 0" class="empty-state">
        <el-text type="info">{{ normalizedQuery ? t('common.no_match') : t('common.no_files') }}</el-text>
      </div>
      <div v-for="item in filteredFiles" :key="item.url" class="file-row" @click="openFile(item.url)">
        <div class="file-info">
          <el-icon class="page-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 5a2 2 0 012-2h12a2 2 0 012 2v14a1 1 0 01-1.447.894L12 17l-8.553 2.894A1 1 0 012 19V5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </el-icon>
          <span class="single-title">{{ item.name }}</span>
          <div class="version-info" v-if="item.date">
            <el-icon class="calendar-icon"><Calendar /></el-icon>
            <span class="date">{{ formatDate(item.date) }}</span>
          </div>
        </div>
        <div class="file-actions" @click.stop>
          <a :href="item.url" target="_blank" rel="noopener" class="download-link">
            <el-button class="action-btn" type="text" size="small">
              <el-icon class="action-icon"><Link /></el-icon>
              <span class="btn-text">{{ t('action.open') }}</span>
            </el-button>
          </a>
          <el-button class="action-btn copy-btn" type="text" size="small" @click="copyLink(item.url)">
            <el-icon class="action-icon"><CopyDocument /></el-icon>
            <span class="btn-text">{{ copiedFiles[item.url] ? t('action.copied') : t('action.copy') }}</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Link, CopyDocument, Calendar } from "@element-plus/icons-vue";
import { showCenteredToast } from '../utils/centerToast'
import { ref, reactive, computed, defineExpose } from "vue";
import { useI18n } from 'vue-i18n';
import { files } from '../data/file'

const { t } = useI18n();
const loading = ref(false);
const error = ref(null);
const copiedFiles = reactive({});

const props = defineProps({
  filterQuery: {
    type: String,
    default: '',
  },
});

const normalizedQuery = computed(() => (props.filterQuery || '').trim().toLowerCase());

const filteredFiles = computed(() => {
  const list = files.value || [];
  if (!normalizedQuery.value) return list;
  return list.filter((item) => {
    const name = (item.name || '').toLowerCase();
    const url = (item.url || '').toLowerCase();
    return name.includes(normalizedQuery.value) || url.includes(normalizedQuery.value);
  });
});

const filesCount = computed(() => (files.value || []).length);
const matchedFilesCount = computed(() => filteredFiles.value.length);

defineExpose({ filesCount, matchedFilesCount, loading, error });

function openFile(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener');
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
  return d || '';
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    copiedFiles[url] = true;
    showCenteredToast(t('action.copied') || 'Copied', { type: 'success', duration: 3000 });
    setTimeout(() => delete copiedFiles[url], 3000);
  } catch (err) {
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
  background: rgba(0,0,0,0.6) !important;
  color: #f5f5f5 !important;
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

  .file-row:hover {
    background: transparent !important;
    border-color: transparent !important;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
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
  display: inline-flex;
  align-items: center;
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
