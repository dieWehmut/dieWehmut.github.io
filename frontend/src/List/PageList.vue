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
import { copyTextWithToast, formatListDate } from '../ui/ItemList.vue'
import ItemList from '../ui/ItemList.vue'
import { fetchBackendWithFallback } from '../api/backendApi'

const props = defineProps({
  filterQuery: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()

const pages = ref([])
const loading = ref(true)
const error = ref('')
const copiedLinks = reactive({})

const normalizedFilter = computed(() => (props.filterQuery || '').trim().toLowerCase())

const displayedPages = computed(() => {
  if (!normalizedFilter.value) {
    return pages.value
  }

  return pages.value.filter((page) => {
    const name = (page.displayName || page.name || '').toLowerCase()
    const repo = (page.repoUrl || '').toLowerCase()
    const url = (page.url || '').toLowerCase()
    return name.includes(normalizedFilter.value) || repo.includes(normalizedFilter.value) || url.includes(normalizedFilter.value)
  })
})

const pagesCount = computed(() => pages.value.length)
const matchedCount = computed(() => displayedPages.value.length)
const hasMatches = computed(() => matchedCount.value > 0)

const displayItems = computed(() => {
  return displayedPages.value.map((page) => ({
    key: page.name,
    title: page.displayName || page.name,
    icon: 'page',
    date: formatListDate(page.date),
    href: page.url,
    actions: [
      {
        key: 'open',
        label: t('action.open'),
        icon: 'open',
        href: page.url,
      },
      ...(page.repoUrl
        ? [
            {
              key: 'repo',
              label: t('action.repo'),
              icon: 'repo',
              href: page.repoUrl,
            },
          ]
        : []),
      {
        key: 'copy',
        label: copiedLinks[page.url] ? t('action.copied') : t('action.copy'),
        icon: 'copy',
        onClick: () => copyTextWithToast(page.url, copiedLinks, { copiedKey: page.url, duration: 3000 }),
      },
    ],
  }))
})

async function loadPages() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetchBackendWithFallback('/api/pages', { cache: 'no-cache' })
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    pages.value = Array.isArray(data) ? data : []
  } catch (loadError) {
    console.error('Failed to load pages from server API:', loadError)
    error.value = t('error.unable_load') || 'Unable to load pages.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPages()
})

defineExpose({ pagesCount, matchedCount, hasMatches, displayedPages, loading, error })
</script>