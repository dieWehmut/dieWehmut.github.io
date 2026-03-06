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
const { tools: toolsConfig } = useContent()

const tools = ref([])
const loading = ref(true)
const error = ref('')
const copiedLinks = reactive({})

const normalizedFilter = computed(() => (props.filterQuery || '').trim().toLowerCase())

const displayedTools = computed(() => {
  if (!normalizedFilter.value) {
    return tools.value
  }

  return tools.value.filter((tool) => (tool.name || '').toLowerCase().includes(normalizedFilter.value))
})

const displayItems = computed(() => {
  return displayedTools.value.map((tool) => ({
    key: `${tool.name}-${resolveCopyUrl(tool)}`,
    title: tool.name,
    icon: 'tool',
    date: formatListDate(tool.lastModified, { pad: true }),
    href: resolveRepoUrl(tool),
    actions: [
      ...(shouldShowDownload(tool)
        ? [{ key: 'download', label: t('action.download'), icon: 'download', onClick: () => downloadRepo(tool) }]
        : []),
      ...(resolveRepoUrl(tool)
        ? [{ key: 'repo', label: t('action.repo'), icon: 'repo', href: resolveRepoUrl(tool) }]
        : []),
      {
        key: 'copy',
        label: copiedLinks[resolveCopyUrl(tool)] ? t('action.copied') : t('action.copy'),
        icon: 'copy',
        active: !!copiedLinks[resolveCopyUrl(tool)],
        onClick: () => copyTextWithToast(resolveCopyUrl(tool), copiedLinks, { copiedKey: resolveCopyUrl(tool), duration: 2500 }),
      },
    ],
  }))
})

function buildFolderHtmlUrl(name) {
  const owner = toolsConfig.value?.[0]?.owner || 'dieWehmut'
  const repo = toolsConfig.value?.[0]?.repo || 'Gajetto'
  return `https://github.com/${owner}/${repo}/tree/main/${encodeURIComponent(name)}`
}

const manualTools = computed(() => {
  const items = toolsConfig.value?.[0]?.manualItems || []
  return items.map((item, index) => ({
    name: item?.name || `manual-tool-${index}`,
    html_url: item?.html_url || item?.url || '',
    repo_url: item?.repo_url || item?.repoUrl || '',
    lastModified: item?.lastModified || item?.date || null,
    showDownload: item?.showDownload !== false,
    downloadToast: item?.downloadToast === true,
    downloadToastMessage: item?.downloadToastMessage || '私聊站长要哦~',
    isManual: true,
    _repoUrl: item?.repo_url || item?.repoUrl || '',
  }))
})

function resolveDownloadUrl(tool) {
  return tool?.html_url || tool?.url || ''
}

function resolveRepoUrl(tool) {
  if (tool?.repo_url || tool?.repoUrl) {
    return tool.repo_url || tool.repoUrl
  }

  if (tool?.isManual) {
    return tool?.html_url || tool?.url || ''
  }

  return tool?.html_url || buildFolderHtmlUrl(tool?.name || '')
}

function resolveCopyUrl(tool) {
  return resolveDownloadUrl(tool) || resolveRepoUrl(tool)
}

function shouldShowDownload(tool) {
  if (tool?.showDownload === false) {
    return false
  }

  if (tool?.downloadToast === true) {
    return true
  }

  return !!resolveDownloadUrl(tool)
}

async function fetchTools() {
  loading.value = true
  error.value = ''

  const owner = toolsConfig.value?.[0]?.owner || 'dieWehmut'
  const repo = toolsConfig.value?.[0]?.repo || 'Gajetto'
  const manual = manualTools.value.map((item) => ({ ...item }))
  tools.value = [...manual]

  try {
    const data = await fetchWithCache(getBackendApiUrl(`/api/github/repos/${owner}/${repo}/contents`), {}, 1000 * 60 * 15)
    const autoTools = Array.isArray(data)
      ? data
          .filter((item) => item.type === 'dir')
          .map((directory) => ({
            name: directory.name,
            html_url: directory.html_url || buildFolderHtmlUrl(directory.name),
            lastModified: null,
            showDownload: true,
            isManual: false,
          }))
      : []

    tools.value = [...manual, ...autoTools]
    loading.value = false

    await enrichItemsWithLatestDate([...manual, ...autoTools], {
      fetchCommit: ({ owner: targetOwner, repo: targetRepo }) =>
        fetchWithCache(getBackendApiUrl(`/api/github/repos/${targetOwner}/${targetRepo}/commits/latest`), {}, 1000 * 60 * 60 * 6),
      getRepoUrl: (item) => item._repoUrl || resolveRepoUrl(item),
      hasDate: (item) => !!item?.lastModified,
      assignDate: (item, value) => {
        item.lastModified = value
      },
    })
  } catch (loadError) {
    console.error('Failed to load tools:', loadError)
    error.value = manual.length ? '' : t('error.unable_load') || 'Unable to load tools.'
    tools.value = [...manual]
    loading.value = false

    if (!manual.length) {
      return
    }
  }
}

function downloadRepo(tool) {
  if (tool?.downloadToast === true) {
    showCenteredToast(tool?.downloadToastMessage || '私聊站长要哦~', { duration: 2500, type: 'info' })
    return
  }

  const downloadUrl = resolveDownloadUrl(tool)
  if (!downloadUrl) {
    showCenteredToast('私聊站长要哦~', { duration: 2500, type: 'info' })
    return
  }

  if (!downloadUrl.includes('/tree/')) {
    window.open(downloadUrl, '_blank', 'noopener')
    return
  }

  window.open(`https://download-directory.github.io/?url=${encodeURIComponent(downloadUrl)}`, '_blank', 'noopener')
}

onMounted(() => {
  fetchTools()
})

defineExpose({ tools, displayedTools, loading, error })
</script>