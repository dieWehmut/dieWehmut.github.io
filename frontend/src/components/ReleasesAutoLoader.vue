<template>
  <div class="w-full">
    <ItemList
      :items="displayItems"
      :loading="loading"
      :error="error || ''"
      :empty-text="t('common.no_files')"
      :loading-text="`${t('common.loading')}...`"
    />
  </div>
</template>

<script setup>
import { computed, defineExpose, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemList from './ItemList.vue'
import { showCenteredToast } from '../utils/centerToast'
import { fetchWithCache } from '../utils/apiCache'
import { getBackendApiUrl } from '../utils/backendApi'
import { useContent } from '../data/content'

const props = defineProps({
  type: {
    type: String,
    default: 'games',
  },
  filterQuery: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const { games: gamesConfig, apps: appsConfig } = useContent()

const games = ref([])
const apps = ref([])
const loading = ref(true)
const error = ref('')
const copiedLinks = reactive({})

const normalizedFilter = computed(() => (props.filterQuery || '').trim().toLowerCase())

const filteredGames = computed(() => {
  if (!normalizedFilter.value) {
    return games.value
  }

  return games.value.filter((item) => matchesItem(item, normalizedFilter.value))
})

const filteredApps = computed(() => {
  if (!normalizedFilter.value) {
    return apps.value
  }

  return apps.value.filter((item) => matchesItem(item, normalizedFilter.value))
})

const displayItems = computed(() => {
  const items = props.type === 'games' ? filteredGames.value : filteredApps.value
  const icon = props.type === 'games' ? 'game' : 'app'

  return items.map((item) => ({
    key: `${item.tag_name}-${item.name}-${resolveCopyUrl(item)}`,
    title: item.name,
    icon,
    date: formatDate(item.date),
    href: resolveRepoUrl(item),
    actions: [
      ...(shouldShowDownload(item)
        ? [{ key: 'download', label: t('action.download'), icon: 'download', onClick: () => handleDownload(item) }]
        : []),
      ...(resolveRepoUrl(item)
        ? [{ key: 'repo', label: t('action.repo'), icon: 'repo', href: resolveRepoUrl(item) }]
        : []),
      {
        key: 'copy',
        label: copiedLinks[resolveCopyUrl(item)] ? t('action.copied') : t('action.copy'),
        icon: 'copy',
        onClick: () => copyLink(resolveCopyUrl(item)),
      },
    ],
  }))
})

const manualGames = computed(() => {
  const items = gamesConfig.value?.[0]?.manualItems || []
  return items.map((item, index) => normalizeManualItem(item, index, 'manual-game'))
})

const manualApps = computed(() => {
  const items = appsConfig.value?.[0]?.manualItems || []
  return items.map((item, index) => normalizeManualItem(item, index, 'manual-app'))
})

function matchesItem(item, query) {
  const name = (item.name || '').toLowerCase()
  const tag = (item.tag_name || '').toLowerCase()
  return name.includes(query) || tag.includes(query)
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function isAndroidApp(fileName) {
  const normalized = fileName.toLowerCase()
  return normalized.endsWith('_android.apk') || normalized.endsWith('_android')
}

function normalizeManualItem(item, index, prefix) {
  return {
    tag_name: item?.tag_name || `${prefix}-${index}`,
    name: item?.name || `${prefix}-${index}`,
    html_url: item?.html_url || item?.url || '',
    repo_url: item?.repo_url || item?.repoUrl || '',
    showDownload: item?.showDownload !== false,
    downloadToast: item?.downloadToast === true,
    downloadToastMessage: item?.downloadToastMessage || '私聊站长要哦~',
    date: item?.date || null,
    _repoUrl: item?.repo_url || item?.repoUrl || '',
  }
}

function parseGitHubRepo(url) {
  if (!url) {
    return null
  }

  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) {
    return null
  }

  return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
}

async function enrichManualDates(items) {
  await Promise.all(
    items.map(async (item) => {
      if (item.date) {
        return
      }

      const repo = parseGitHubRepo(item._repoUrl)
      if (!repo) {
        return
      }

      try {
        const commit = await fetchWithCache(
          getBackendApiUrl(`/api/github/repos/${repo.owner}/${repo.repo}/commits/latest`),
          {},
          1000 * 60 * 60 * 6,
        )
        if (commit?.commit) {
          item.date = commit?.commit?.committer?.date || commit?.commit?.author?.date || null
        }
      } catch {
      }
    }),
  )
}

function resolveDownloadUrl(item) {
  return item?.html_url || item?.url || ''
}

function resolveRepoUrl(item) {
  return item?.repo_url || item?.repoUrl || item?.html_url || item?.url || ''
}

function resolveCopyUrl(item) {
  return resolveDownloadUrl(item) || resolveRepoUrl(item)
}

function shouldShowDownload(item) {
  if (item?.showDownload === false) {
    return false
  }

  if (item?.downloadToast === true) {
    return true
  }

  return !!resolveDownloadUrl(item)
}

function handleDownload(item) {
  if (item?.downloadToast === true) {
    showCenteredToast(item?.downloadToastMessage || '私聊站长要哦~', { duration: 2500, type: 'info' })
    return
  }

  const url = resolveDownloadUrl(item)
  if (!url) {
    showCenteredToast('私聊站长要哦~', { duration: 2500, type: 'info' })
    return
  }

  window.open(url, '_blank', 'noopener')
}

function formatDate(dateValue) {
  if (!dateValue) {
    return ''
  }

  try {
    const date = new Date(dateValue)
    if (Number.isNaN(date.valueOf())) {
      return dateValue
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return dateValue
  }
}

async function loadReleases() {
  loading.value = true
  error.value = ''

  let autoGames = []
  let autoApps = []

  try {
    const releases = await fetchWithCache(getBackendApiUrl('/api/github/repos/dieWehmut/Showcase/releases'), {}, 1000 * 60 * 15)
    const gamesData = []
    const appsData = []

    releases.forEach((release) => {
      if (!release.assets?.length) {
        return
      }

      const androidAssets = release.assets.filter((asset) => isAndroidApp(asset.name))
      const otherAssets = release.assets.filter((asset) => !isAndroidApp(asset.name))
      const releaseTagUrl = release.html_url || `https://github.com/dieWehmut/Showcase/releases/tag/${release.tag_name}`

      otherAssets.forEach((asset) => {
        gamesData.push({
          tag_name: release.tag_name,
          name: stripExtension(asset.name),
          html_url: asset.browser_download_url,
          repo_url: releaseTagUrl,
          showDownload: true,
          date: release.published_at || release.created_at || null,
        })
      })

      androidAssets.forEach((asset) => {
        appsData.push({
          tag_name: release.tag_name,
          name: stripExtension(asset.name),
          html_url: asset.browser_download_url,
          repo_url: releaseTagUrl,
          showDownload: true,
          date: release.published_at || release.created_at || null,
        })
      })
    })

    autoGames = gamesData
    autoApps = appsData
  } catch (loadError) {
    console.error('Failed to load releases:', loadError)
    if ((props.type === 'games' && manualGames.value.length === 0) || (props.type === 'apps' && manualApps.value.length === 0)) {
      error.value = t('error.unable_load') || 'Unable to load releases.'
    }
  } finally {
    await Promise.all([enrichManualDates(manualGames.value), enrichManualDates(manualApps.value)])
    games.value = [...manualGames.value, ...autoGames]
    apps.value = [...manualApps.value, ...autoApps]
    loading.value = false
  }
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    copiedLinks[url] = true
    showCenteredToast(t('action.copied'), { duration: 3000, type: 'success' })
    setTimeout(() => delete copiedLinks[url], 3000)
  } catch {
    showCenteredToast(t('action.copy_failed'), { duration: 3000, type: 'error' })
  }
}

onMounted(() => {
  loadReleases()
})

defineExpose({ games, apps, filteredGames, filteredApps })
</script>