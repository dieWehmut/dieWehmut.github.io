<template>
  <ItemList
    :items="displayItems"
    :loading="loading"
    :error="error"
    :empty-text="normalizedQuery ? t('common.no_match') : t('common.no_files')"
    :loading-text="`${t('common.loading')}...`"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { copyTextWithToast, formatListDate } from '../ui/ItemList.vue'
import ItemList from '../ui/ItemList.vue'
import { fetchWithCache } from '../api/apiCache'
import { getBackendApiUrl } from '../api/backendApi'
import { LIST_SNAPSHOT_TTL, readSnapshot, replaceReactiveRecord, writeSnapshot } from '../utils/browserSnapshot'

const props = defineProps({
  repoUrl: {
    type: String,
    default: 'https://github.com/dieWehmut/Files',
  },
  filterQuery: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()

const entriesRoot = ref([])
const entriesMap = reactive({})
const openDirs = reactive({})
const loadingDirs = reactive({})
const folderDates = reactive({})
const copiedLinks = reactive({})
const loading = ref(true)
const error = ref('')
const defaultBranch = ref('main')
const hasLoadedRoot = ref(false)
const SNAPSHOT_KEY = 'files:list'
let repoMetaPromise = null
const loadPromises = new Map()

const normalizedQuery = computed(() => (props.filterQuery || '').trim().toLowerCase())

const filteredEntriesRoot = computed(() => {
  if (!normalizedQuery.value) {
    return entriesRoot.value
  }

  return entriesRoot.value.filter((folder) => {
    if (folder.name.toLowerCase().includes(normalizedQuery.value)) {
      return true
    }

    const filesInFolder = entriesMap[folder.path] || []
    return filesInFolder.some((file) => file.name.toLowerCase().includes(normalizedQuery.value))
  })
})

const matchedFilesCount = computed(() => {
  if (!normalizedQuery.value) {
    return entriesRoot.value.length
  }

  return filteredEntriesRoot.value.reduce((count, folder) => count + getFilteredFilesForFolder(folder.path).length, 0)
})

const filesCount = computed(() => entriesRoot.value.length)

const viewableExtensions = new Set(['PDF', 'MD', 'TXT', 'PNG', 'JPG', 'JPEG', 'SVG', 'HTML', 'HTM', 'GIF'])

const displayItems = computed(() => {
  return filteredEntriesRoot.value.map((folder) => ({
    key: folder.path,
    title: folder.name,
    icon: 'folder',
    date: folderDates[folder.path] ? formatListDate(folderDates[folder.path], { pad: true }) : '',
    onClick: () => toggleDir(folder),
    actions: [
      {
        key: openDirs[folder.path] ? 'collapse' : 'expand',
        label: openDirs[folder.path] ? t('action.collapse') : t('action.expand'),
        icon: openDirs[folder.path] ? 'collapse' : 'expand',
        onClick: () => toggleDir(folder),
      },
      {
        key: 'repo',
        label: t('action.repo'),
        icon: 'repo',
        href: getFolderUrl(folder),
      },
      {
        key: 'copy',
        label: copiedLinks[getFolderUrl(folder)] ? t('action.copied') : t('action.copy'),
        icon: 'copy',
        active: !!copiedLinks[getFolderUrl(folder)],
        onClick: () => copyTextWithToast(getFolderUrl(folder), copiedLinks, { copiedKey: getFolderUrl(folder), duration: 3000 }),
      },
    ],
    children: openDirs[folder.path]
      ? loadingDirs[folder.path]
        ? [
            {
              key: `${folder.path}__loading`,
              title: `${t('common.loading')}...`,
              icon: 'file',
              meta: t('nav.files'),
              actions: [],
            },
          ]
        : getFilteredFilesForFolder(folder.path).map((file) => ({
            key: file.path,
            title: file.name,
            icon: 'file',
            badges: file.extension ? [file.extension] : [],
            onClick: isViewable(file) ? () => openFile(blobUrlFor(file)) : undefined,
            actions: [
              ...(isViewable(file)
                ? [
                    {
                      key: 'view',
                      label: t('action.view'),
                      icon: 'view',
                      href: blobUrlFor(file),
                    },
                  ]
                : []),
              {
                key: 'download',
                label: t('action.download'),
                icon: 'download',
                href: rawUrlFor(file),
              },
              {
                key: 'copy',
                label: copiedLinks[blobUrlFor(file)] ? t('action.copied') : t('action.copy'),
                icon: 'copy',
                active: !!copiedLinks[blobUrlFor(file)],
                onClick: () => copyTextWithToast(blobUrlFor(file), copiedLinks, { copiedKey: blobUrlFor(file), duration: 3000 }),
              },
            ],
          }))
      : [],
  }))
})

function parseRepo(urlValue) {
  try {
    const url = new URL(urlValue)
    const parts = url.pathname.replace(/^\//, '').split('/')
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] }
    }
  } catch {
  }

  return { owner: 'dieWehmut', repo: 'Files' }
}

function getFileExtension(fileName) {
  if (!fileName || !fileName.includes('.')) {
    return 'FILE'
  }

  const parts = fileName.split('.')
  return parts[parts.length - 1].toUpperCase()
}

function persistFileSnapshot() {
  writeSnapshot(
    SNAPSHOT_KEY,
    {
      entriesRoot: entriesRoot.value,
      entriesMap: { ...entriesMap },
      folderDates: { ...folderDates },
      defaultBranch: defaultBranch.value,
    },
    LIST_SNAPSHOT_TTL,
  )
}

function restoreFileSnapshot() {
  const cachedState = readSnapshot(SNAPSHOT_KEY, null)
  if (!cachedState || typeof cachedState !== 'object') {
    return
  }

  if (Array.isArray(cachedState.entriesRoot)) {
    entriesRoot.value = cachedState.entriesRoot
  }

  replaceReactiveRecord(entriesMap, cachedState.entriesMap || {})
  replaceReactiveRecord(folderDates, cachedState.folderDates || {})

  if (typeof cachedState.defaultBranch === 'string' && cachedState.defaultBranch) {
    defaultBranch.value = cachedState.defaultBranch
  }

  loading.value = false
}

async function ensureRepoMetaLoaded() {
  if (repoMetaPromise) {
    return repoMetaPromise
  }

  const { owner, repo } = parseRepo(props.repoUrl)

  repoMetaPromise = (async () => {
    try {
      const repoData = await fetchWithCache(getBackendApiUrl(`/api/github/repos/${owner}/${repo}`), {}, 1000 * 60 * 60)
      if (repoData?.default_branch) {
        defaultBranch.value = repoData.default_branch
        persistFileSnapshot()
      }
    } catch {
    }
  })()

  try {
    await repoMetaPromise
  } finally {
    repoMetaPromise = null
  }
}

async function loadContents(path = '') {
  const isRoot = !path
  const requestKey = path || '__root__'

  if (isRoot && hasLoadedRoot.value) {
    return entriesRoot.value
  }

  if (loadPromises.has(requestKey)) {
    return loadPromises.get(requestKey)
  }

  const promise = (async () => {
    if (isRoot) {
      if (!entriesRoot.value.length) {
        loading.value = true
      }
      error.value = ''
    } else {
      loadingDirs[path] = true
    }

    const { owner, repo } = parseRepo(props.repoUrl)

    try {
      await ensureRepoMetaLoaded()

      const apiUrl = getBackendApiUrl(`/api/github/repos/${owner}/${repo}/contents${path ? `?path=${encodeURIComponent(path)}` : ''}`)
      const data = await fetchWithCache(apiUrl, {}, 1000 * 60 * 15)
      const items = Array.isArray(data)
        ? data.map((item) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            download_url: item.download_url,
            html_url: item.html_url,
            extension: getFileExtension(item.name),
          }))
        : []

      if (!path) {
        entriesRoot.value = items.filter((item) => item.type === 'dir').sort((left, right) => left.name.localeCompare(right.name))
        entriesMap[''] = []
        loading.value = false
        hasLoadedRoot.value = true
        persistFileSnapshot()
        window.setTimeout(() => {
          fetchFolderDates()
        }, 0)
        return entriesRoot.value
      }

      entriesMap[path] = items.filter((item) => item.type === 'file')
      persistFileSnapshot()
      return entriesMap[path]
    } catch {
      if (isRoot && !entriesRoot.value.length) {
        error.value = t('error.unable_load') || 'Unable to load files.'
        loading.value = false
      }
      return isRoot ? entriesRoot.value : entriesMap[path] || []
    } finally {
      if (!isRoot) {
        delete loadingDirs[path]
      }
      loadPromises.delete(requestKey)
    }
  })()

  loadPromises.set(requestKey, promise)
  return promise
}

async function fetchFolderDates() {
  const { owner, repo } = parseRepo(props.repoUrl)

  await Promise.all(
    entriesRoot.value.map(async (folder) => {
      try {
        const commit = await fetchWithCache(
          getBackendApiUrl(`/api/github/repos/${owner}/${repo}/commits/latest?path=${encodeURIComponent(folder.path)}`),
          {},
          1000 * 60 * 60 * 6,
        )
        if (commit?.commit) {
          folderDates[folder.path] = commit?.commit?.committer?.date || commit?.commit?.author?.date || null
          persistFileSnapshot()
        }
      } catch {
      }
    }),
  )
}

function getFilteredFilesForFolder(folderPath) {
  const files = entriesMap[folderPath] || []
  if (!normalizedQuery.value) {
    return files
  }

  return files.filter((file) => file.name.toLowerCase().includes(normalizedQuery.value))
}

function isViewable(file) {
  return viewableExtensions.has((file.extension || '').toUpperCase())
}

function rawUrlFor(file) {
  const { owner, repo } = parseRepo(props.repoUrl)
  return file.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch.value}/${file.path}`
}

function blobUrlFor(file) {
  const { owner, repo } = parseRepo(props.repoUrl)
  return file.html_url || `https://github.com/${owner}/${repo}/blob/${defaultBranch.value}/${file.path}`
}

function getFolderUrl(folder) {
  const { owner, repo } = parseRepo(props.repoUrl)
  return folder.html_url || `https://github.com/${owner}/${repo}/tree/${defaultBranch.value}/${folder.path}`
}

function openFile(url) {
  window.open(url, '_blank', 'noopener')
}

async function toggleDir(folder) {
  const path = folder.path || ''
  openDirs[path] = !openDirs[path]
  if (openDirs[path] && !entriesMap[path]) {
    await loadContents(path)
  }
}

restoreFileSnapshot()

onMounted(() => {
  loadContents('')
})

function ensureLoaded() {
  return loadContents('')
}

watch(normalizedQuery, async (queryValue) => {
  if (!queryValue) {
    return
  }

  const foldersToLoad = filteredEntriesRoot.value.filter((folder) => !entriesMap[folder.path])
  await Promise.all(foldersToLoad.map((folder) => loadContents(folder.path)))

  filteredEntriesRoot.value.forEach((folder) => {
    if (getFilteredFilesForFolder(folder.path).length > 0) {
      openDirs[folder.path] = true
    }
  })
})

defineExpose({ filesCount, matchedFilesCount, loading, error, ensureLoaded })
</script>
