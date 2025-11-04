<template>
  <div class="releases-auto-loader">
    <div v-if="loading" class="loading-state">
      <el-text type="info">{{ t('common.loading') }}... ⏳</el-text>
    </div>

    <div v-else-if="error" class="error-state">
      <el-text type="danger">{{ error }}</el-text>
    </div>

    <div v-else>
      <div v-if="(props.type === 'games' && filteredGames.length === 0) || (props.type === 'apps' && filteredApps.length === 0)" class="empty-state">
        <el-text type="info">{{ t('common.no_files') }}</el-text>
      </div>

      <!-- Games Section -->
      <div v-if="props.type === 'games' && filteredGames.length > 0">
        <div v-for="game in filteredGames" :key="game.tag_name" class="release-item" tabindex="0" role="button" @click="openRepo(game)" @keydown.enter="openRepo(game)">
          <div class="item-info">
            <el-icon class="item-icon"><Monitor /></el-icon>
            <span class="item-name">{{ game.name }}</span>
          </div>
          <div class="item-actions">
            <a :href="game.html_url" target="_blank" rel="noopener" class="action-btn" @click.stop>
              <el-icon><Download /></el-icon>
              <span class="btn-text">{{ t('action.download') }}</span>
            </a>
            <a :href="game.repo_url" target="_blank" rel="noopener" class="action-btn repo-btn" @click.stop>
              <el-icon><Link /></el-icon>
              <span class="btn-text">{{ t('action.repo') }}</span>
            </a>
            <el-button class="action-btn copy-btn" @click.stop="copyLink(game.html_url)">
              <el-icon><CopyDocument /></el-icon>
              <span class="btn-text">{{ copiedLinks[game.html_url] ? t('action.copied') : t('action.copy') }}</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- Apps Section -->
      <div v-if="props.type === 'apps' && filteredApps.length > 0">
        <div v-for="app in filteredApps" :key="app.tag_name" class="release-item" tabindex="0" role="button" @click="openRepo(app)" @keydown.enter="openRepo(app)">
          <div class="item-info">
            <el-icon class="item-icon"><Grid /></el-icon>
            <span class="item-name">{{ app.name }}</span>
          </div>
          <div class="item-actions">
            <a :href="app.html_url" target="_blank" rel="noopener" class="action-btn" @click.stop>
              <el-icon><Download /></el-icon>
              <span class="btn-text">{{ t('action.download') }}</span>
            </a>
            <a :href="app.repo_url" target="_blank" rel="noopener" class="action-btn repo-btn" @click.stop>
              <el-icon><Link /></el-icon>
              <span class="btn-text">{{ t('action.repo') }}</span>
            </a>
            <el-button class="action-btn copy-btn" @click.stop="copyLink(app.html_url)">
              <el-icon><CopyDocument /></el-icon>
              <span class="btn-text">{{ copiedLinks[app.html_url] ? t('action.copied') : t('action.copy') }}</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, defineExpose } from 'vue'
import { Monitor, Grid, Download, Link, CopyDocument } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { showCenteredToast } from '../utils/centerToast'
import { fetchWithCache } from '../utils/apiCache'
import { getGitHubHeaders } from '../utils/github'

const props = defineProps({
  type: {
    type: String,
    default: 'games', // 'games' or 'apps'
  },
  filterQuery: {
    type: String,
    default: ''
  }
})

const { t } = useI18n()

// Reactive data
const games = ref([])
const apps = ref([])
const loading = ref(true)
const error = ref(null)
const copiedLinks = reactive({})

const normalizedFilter = computed(() => (props.filterQuery || '').trim().toLowerCase())

function matchesItem(item, query) {
  if (!query) return true
  const name = (item.name || '').toLowerCase()
  const tag = (item.tag_name || '').toLowerCase()
  return name.includes(query) || tag.includes(query)
}

const filteredGames = computed(() => {
  const q = normalizedFilter.value
  if (!q) return games.value
  return games.value.filter((item) => matchesItem(item, q))
})

const filteredApps = computed(() => {
  const q = normalizedFilter.value
  if (!q) return apps.value
  return apps.value.filter((item) => matchesItem(item, q))
})

function stripExtension(filename) {
  return filename.replace(/\.[^/.]+$/, '')
}
function isAndroidApp(filename) {
  return filename.toLowerCase().endsWith('_android.apk') ||
         filename.toLowerCase().endsWith('_android')
}

async function loadReleases() {
  loading.value = true
  error.value = null

  try {
    const apiUrl = 'https://api.github.com/repos/dieWehmut/Showcase/releases'
    const releases = await fetchWithCache(apiUrl, { headers: getGitHubHeaders() }, 1000 * 60 * 15)

    const gamesData = []
    const appsData = []

    releases.forEach(release => {
      if (release.assets && release.assets.length > 0) {
        const androidAssets = release.assets.filter(asset => isAndroidApp(asset.name))
        const otherAssets = release.assets.filter(asset => !isAndroidApp(asset.name))

        const releaseTagUrl = release.html_url || `https://github.com/dieWehmut/Showcase/releases/tag/${release.tag_name}`

        // 处理非 Android 资源（games）
        otherAssets.forEach(asset => {
          const displayName = stripExtension(asset.name)
          gamesData.push({
            tag_name: release.tag_name,
            name: displayName,
            html_url: asset.browser_download_url,
            repo_url: releaseTagUrl
          })
        })

        // 处理 Android 资源（apps）
        androidAssets.forEach(asset => {
          const displayName = stripExtension(asset.name)
          appsData.push({
            tag_name: release.tag_name,
            name: displayName,
            html_url: asset.browser_download_url,
            repo_url: releaseTagUrl
          })
        })
      }
    })

    games.value = gamesData
    apps.value = appsData

  } catch (e) {
    error.value = t('error.unable_load') || 'Unable to load releases.'
    console.error('Failed to load releases:', e)
  } finally {
    loading.value = false
  }
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    copiedLinks[url] = true
    showCenteredToast(t('action.copied'), { type: 'success', duration: 3000 })
    setTimeout(() => delete copiedLinks[url], 3000)
  } catch (err) {
    try {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      copiedLinks[url] = true
      showCenteredToast(t('action.copied'), { type: 'success', duration: 3000 })
      setTimeout(() => delete copiedLinks[url], 3000)
      document.body.removeChild(input)
    } catch (e) {
      showCenteredToast(t('action.copy_failed'), { type: 'error', duration: 3000 })
    }
  }
}

function openRepo(item) {
  const url = item?.repo_url || item?.html_url || ''
  if (!url) {
    showCenteredToast(t ? t('warning.no_repo') : '🔗 No repo available', { type: 'warning', duration: 3000 })
    return
  }
  window.open(url, '_blank', 'noopener')
}

onMounted(() => {
  loadReleases()
})

defineExpose({ games, apps, filteredGames, filteredApps })
</script>

<style scoped>
.releases-auto-loader {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-state,
.error-state,
.empty-state {
  padding: 24px;
  text-align: center;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2b2b2b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.release-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(0,0,0,0.6) !important; /* default: black semi-transparent */
  color: #f5f5f5 !important;
  transition: all 0.2s ease;
  margin: 4px 0;
  cursor: pointer;
}

.release-item:hover {
  background: transparent !important; /* become fully transparent on hover, like PageItem */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Stronger rule for non-hover state to override theme/global styles */
.release-item:not(:hover) {
  background: rgba(0,0,0,0.6) !important;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  font-size: 18px;
  color: #ffffff !important;
  flex-shrink: 0;
}

.item-name {
  font-weight: 600;
  color: #f5f5f5 !important;
  font-size: 14px;
}

.item-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  text-decoration: none;
  color: #f5f5f5;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0,0,0,0.05) !important;
  border-color: transparent !important;
}

.btn-text {
  font-size: 12px;
  font-weight: 600;
}

.repo-btn {
  color: #6ba3f5;
}

.repo-btn:hover {
  color: #4a90e2;
}

.copy-btn {
  color: #67c23a;
}

.copy-btn:hover {
  color: #52a032;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .release-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .item-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  .section-title {
    font-size: 16px;
  }
}
</style>