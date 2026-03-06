<template>
  <ItemList
    :items="displayItems"
    :loading="loading"
    :error="error"
    :empty-text="normalizedFilter ? t('common.no_match') : t('common.no_files')"
    :loading-text="`${t('common.loading')}...`"
  />
</template>

<script setup>
import { computed, defineExpose, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { copyTextWithToast, enrichItemsWithLatestDate, formatListDate } from '../ui/ItemList.vue'
import { showCenteredToast } from '../layouts/CenterToast.vue'
import ItemList from '../ui/ItemList.vue'
import { fetchWithCache } from '../api/apiCache'
import { getBackendApiUrl } from '../api/backendApi'
import { useContent } from '../data/content'

const props = defineProps({
  filterQuery: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const { games: gamesConfig } = useContent()

const games = ref([])
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

const displayItems = computed(() => {
  return filteredGames.value.map((item) => ({
    key: `${item.tag_name}-${item.name}-${resolveCopyUrl(item)}`,
    title: item.name,
    icon: 'game',
    date: formatListDate(item.date, { pad: true }),
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
        active: !!copiedLinks[resolveCopyUrl(item)],
        onClick: () => copyTextWithToast(resolveCopyUrl(item), copiedLinks, { copiedKey: resolveCopyUrl(item), duration: 3000 }),
      },
    ],
  }))
})

const manualGames = computed(() => {
  const items = gamesConfig.value?.[0]?.manualItems || []
  return items.map((item, index) => normalizeManualItem(item, index, 'manual-game'))
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

async function loadGames() {
  loading.value = true
  error.value = ''

  const manualGameItems = manualGames.value.map((item) => ({ ...item }))
  let autoGames = []

  try {
    const releases = await fetchWithCache(getBackendApiUrl('/api/github/repos/dieWehmut/Showcase/releases'), {}, 1000 * 60 * 15)
    const gamesData = []

    releases.forEach((release) => {
      if (!release.assets?.length) {
        return
      }

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
    })

    autoGames = gamesData
  } catch (loadError) {
    console.error('Failed to load game releases:', loadError)
    if (manualGameItems.length === 0) {
      error.value = t('error.unable_load') || 'Unable to load releases.'
    }
  } finally {
    games.value = [...manualGameItems, ...autoGames]
    loading.value = false

    await enrichItemsWithLatestDate(manualGameItems, {
      fetchCommit: ({ owner, repo }) => fetchWithCache(getBackendApiUrl(`/api/github/repos/${owner}/${repo}/commits/latest`), {}, 1000 * 60 * 60 * 6),
      getRepoUrl: (item) => item._repoUrl,
    })
  }
}

onMounted(() => {
  loadGames()
})

defineExpose({ games, filteredGames, loading, error })
</script>