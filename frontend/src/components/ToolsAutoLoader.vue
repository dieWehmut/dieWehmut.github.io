<template>
  <ItemList
    :items="displayItems"
    :loading="loading"
    :error="''"
    :empty-text="normalizedFilter ? t('common.no_match') : t('common.no_files')"
    :loading-text="`${t('common.loading')}...`"
  />
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
  filterQuery: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const { tools: toolsConfig } = useContent()

const tools = ref([])
const loading = ref(true)
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
    date: formatDateShort(tool.lastModified),
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
        onClick: () => copyLink(tool),
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

async function enrichManualToolDates(items) {
  await Promise.all(
    items.map(async (item) => {
      if (item.lastModified) {
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
          item.lastModified = commit?.commit?.committer?.date || commit?.commit?.author?.date || null
        }
      } catch {
      }
    }),
  )
}

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
  let autoTools = []

  try {
    const owner = toolsConfig.value?.[0]?.owner || 'dieWehmut'
    const repo = toolsConfig.value?.[0]?.repo || 'Gajetto'
    const data = await fetchWithCache(getBackendApiUrl(`/api/github/repos/${owner}/${repo}/contents`), {}, 1000 * 60 * 15)

    if (Array.isArray(data)) {
      const directories = data.filter((item) => item.type === 'dir').map((directory) => ({
        name: directory.name,
        html_url: directory.html_url || buildFolderHtmlUrl(directory.name),
        lastModified: null,
        showDownload: true,
        isManual: false,
      }))

      autoTools = await Promise.all(
        directories.map(async (directory) => {
          try {
            const commit = await fetchWithCache(
              getBackendApiUrl(`/api/github/repos/${owner}/${repo}/commits/latest?path=${encodeURIComponent(directory.name)}`),
              {},
              1000 * 60 * 60 * 6,
            )
            if (commit?.commit) {
              directory.lastModified = commit?.commit?.committer?.date || commit?.commit?.author?.date || null
            }
          } catch {
          }

          return directory
        }),
      )
    }
  } catch {
    autoTools = []
  } finally {
    await enrichManualToolDates(manualTools.value)
    tools.value = [...manualTools.value, ...autoTools]
    loading.value = false
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

function copyLink(tool) {
  const url = resolveCopyUrl(tool)
  navigator.clipboard.writeText(url).then(() => {
    copiedLinks[url] = true
    showCenteredToast('action.copied', { duration: 2500, type: 'success' })
    setTimeout(() => delete copiedLinks[url], 2500)
  }).catch(() => {
    showCenteredToast('action.copy_failed', { duration: 2500, type: 'error' })
  })
}

function formatDateShort(dateValue) {
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

onMounted(() => {
  fetchTools()
})

defineExpose({ tools, displayedTools, loading })
</script>