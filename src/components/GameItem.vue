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
          <span v-if="version.log" class="version-log">{{ version.log }}</span>
        </div>
        <span class="separator"></span>
      </div>
    </div>
    <div class="game-item__actions">
      <a
        class="action-btn link-button"
        :href="version.url"
        target="_blank"
        rel="noopener"
        @click.stop
      >
  <el-icon class="action-icon"><Download /></el-icon>
  <span class="action-text">{{ $t('action.download') }}</span>
      </a>
      <template v-if="repoUrl && gameName">
        <a
          class="action-btn repo-button"
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          @click.stop
        >
          <el-icon class="action-icon"><Link /></el-icon>
            <span class="action-text">{{ $t('action.repo') }}</span>
        </a>  
      </template>
      <el-button
        size="small"
        type="text"
        @click.stop="copyLink"
        class="action-btn copy-btn"
      >
        <el-icon><DocumentCopy /></el-icon>
  <span class="btn-text">{{ copied ? $t('action.copied') : $t('action.copy') }}</span>
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
import { showCenteredToast } from '../utils/centerToast'
import { ref } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
    } catch (err) {
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
.game-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 50px;
  border: none !important;
  background: #111; /* default dark */
  color: #f5f5f5;
}

.game-item:focus {
  outline: none;
  border-color: transparent !important;
  box-shadow: none !important;
}

@media (hover: hover) {
  .game-item {
    transition: transform 0.14s ease, box-shadow 0.18s ease;
    will-change: transform, box-shadow;
  }

  .game-item:hover {
    background: transparent !important;
    border-color: transparent !important;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }
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
  color: #f5f5f5;
}

.game-icon {
  font-size: 18px;
  color: #ffffff;
}

.game-name {
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
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.link:hover {
  text-decoration: underline;
}

.link-icon {
  font-size: 12px;
}

.repo-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2b2b2b;
}

.repo-link:hover {
  color: #2b2b2b;
  text-decoration: none;
}

.repo-icon {
  font-size: 11px;
}

.game-item__actions {
  margin-left: 12px;
  display: flex;
  gap: 12px;
}

/* Ensure repo button is visually transparent by default (fix white background when not hovered) */
.game-item__actions a.repo-button {
  background-color: transparent !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: inherit !important;
}
.game-item__actions a.repo-button .el-icon,
.game-item__actions a.repo-button svg {
  background: transparent !important;
}

/* Mobile: stack actions under content */
@media (max-width: 768px) {
  .game-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .game-item__actions {
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
  padding: 8px 12px; /* match global */
  min-height: 36px;
  border-radius: 10px;
  text-decoration: none;
  color: #f5f5f5;
  border: 1px solid var(--border-color);
}

.action-icon {
  font-size: 14px;
  color: #ffffff;
}
.action-text {
  font-size: 13px;
  font-weight: 600;
}

/* Ensure repo-button and link-button get the same visual treatment when present */
.game-item__actions a.repo-button,
.game-item__actions a.link-button {
  padding: 8px 12px;
  min-height: 36px;
  border-radius: 10px;
  border: none !important;
  background: transparent !important;
  color: #333;
}
.game-item__actions a.repo-button:hover,
.game-item__actions a.link-button:hover {
  background: transparent !important;
  border-color: transparent !important;
  transform: none;
}

/* Component-scoped override to ensure repo links in this component are not blue */
.repo-button,
.repo-link,
.link-button {
  color: #333 !important;
}
.repo-button.action-btn,
.link-button.action-btn {
  background: transparent !important;
  border: none !important;
}

/* More specific override for repo buttons in actions */
.game-item__actions .repo-button {
  color: #333 !important;
}

/* Force repo button default appearance (prevent accidental white text from global overrides) */
.game-item__actions a.repo-button {
  color: #333 !important;
  background: transparent !important;
}
.game-item__actions a.repo-button .action-text,
.game-item__actions a.repo-button .el-icon,
.game-item__actions a.repo-button svg {
  color: inherit !important;
  fill: currentColor !important;
}

/* Stronger, more specific overrides to ensure transparency in all environments (local & deployed).
   This prevents global or 3rd-party styles from forcing a white background. */
.game-item .game-item__actions a.repo-button,
.game-item .game-item__actions a.link-button {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: inherit !important; /* inherit from .game-item so text/icons match the row color */
  padding: 8px 12px; /* keep spacing consistent */
}
.game-item .game-item__actions a.repo-button .el-icon,
.game-item .game-item__actions a.link-button .el-icon,
.game-item .game-item__actions a.repo-button svg,
.game-item .game-item__actions a.link-button svg {
  color: inherit !important;
  fill: currentColor !important;
  background: transparent !important;
}

.btn-text {
  margin-left: 4px;
}

/* Hover: transparent background and switch to dark text/icons to match pages */
.game-item:hover,
.game-item:focus {
  color: inherit;
}
.game-item:hover .game-info,
.game-item:hover .game-name,
.game-item:hover .game-icon,
.game-item:hover .action-btn,
.game-item:hover .action-icon,
.game-item:hover .version-info {
  color: #2b2b2b !important;
}

/* Strong override to ensure repo icon/button is fully transparent on deployed site.
   Targets the anchor button, the Element Plus icon wrapper and the inner SVG/path.
   Using high-specificity selectors and !important to defeat global theme overrides. */
.game-item__actions a.repo-button,
.game-item__actions a.repo-button .el-icon,
.game-item__actions a.repo-button .repo-icon,
.game-item__actions a.repo-button svg,
.game-item__actions a.repo-button svg path {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: inherit !important;
  fill: currentColor !important;
}

/* Also ensure the icon wrapper does not force padding/background from global styles */
.game-item__actions a.repo-button .el-icon {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
}
</style>
