<template>
  <div class="item service-item" tabindex="0" role="button" @click="openService">
    <div class="item__main">
      <div class="item__line">
        <span class="page-info">
          <el-icon class="page-icon">
            <!-- inline book icon for Service item, matching PageItem layout -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 5a2 2 0 012-2h12a2 2 0 012 2v14a1 1 0 01-1.447.894L12 17l-8.553 2.894A1 1 0 012 19V5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </el-icon>
          <span class="page-name">{{ service.name }}</span>
        </span>
        <div class="version-info">
          <el-icon class="calendar-icon"><Calendar /></el-icon>
          <span class="date">{{ formatDate(service.date) }}</span>
        </div>
        <span class="separator"></span>
      </div>
    </div>
    <div class="item__actions">
      <a
        class="action-btn link-button"
        :href="service.url"
        target="_blank"
        rel="noopener"
        @click.stop
      >
        <el-icon class="action-icon"><Promotion /></el-icon>
        <span class="action-text">{{ t('action.open') }}</span>
      </a>
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentCopy, Calendar, Promotion } from '@element-plus/icons-vue'
import { showCenteredToast } from '../utils/centerToast'

const props = defineProps({
  service: { type: Object, required: true }
})

const { t } = useI18n()
const copied = ref(false)

function openService() {
  const url = props.service?.url || ''
  if (!url) {
    return
  }
  window.open(url, '_blank', 'noopener')
}

async function copyLink() {
  const url = props.service?.url || ''
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    showCenteredToast(t('action.copied') || 'Copied', { type: 'success', duration: 3000 })
    setTimeout(() => (copied.value = false), 3000)
  } catch (e) {
    showCenteredToast(t('action.copy_failed') || 'Copy failed', { type: 'error', duration: 3000 })
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
  return d || '';
}
</script>

<style scoped>
.item {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding:10px 12px;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  margin: 0px 0;
  border: 1px solid transparent;
}

.item {
  background: rgba(0,0,0,0.6) !important;
  color: #f5f5f5 !important;
  align-items: center;
}

.item:focus {
  outline: none;
  border-color: transparent !important;
  box-shadow: none !important;
}

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

  .item:not(:hover) {
    background: rgba(0,0,0,0.6) !important;
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
  color: inherit;
  flex-wrap: wrap;
  line-height: 1.5;
}

.page-icon {
  font-size: 18px;
  color: #ffffff !important;
  display: inline-flex;
  align-items: center;
}

.page-name {
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

.version-log {
  color: #2f3235;
  margin-left: 8px;
  font-size: 13px;
}

.page-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.separator {
  color: #d0d0d0;
  font-weight: bold;
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
