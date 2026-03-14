<template>
  <div :class="wrapperClass">
    <svg :class="iconClass" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11.59V7a1 1 0 00-2 0v6a1 1 0 00.29.71l3 3a1 1 0 001.41-1.41z" />
    </svg>
    <div :class="contentClass">
      <span :class="labelClass">{{ t('sidebar.lastUpdated') }}</span><span :class="dateClass">{{ displayDate }}</span><template v-if="placement === 'footer'"><span class="shrink-0 text-inherit">|</span><a href="https://icp.gov.moe/?keyword=20260803" target="_blank" rel="noopener" class="shrink-0 whitespace-nowrap text-inherit hover:underline">萌ICP备20260803</a></template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchWithCache } from '../api/apiCache'
import { getBackendApiUrl } from '../api/backendApi'

const props = defineProps({
  placement: {
    type: String,
    default: 'sidebar',
  },
})

const { t } = useI18n()
const formattedDate = ref('')
const isLoading = ref(true)

const wrapperClass = computed(() => {
  if (props.placement === 'footer') {
    return 'mt-1.5 inline-flex items-center justify-center gap-2 text-[15px] leading-none text-[#3b4cb8] max-[640px]:mt-1 max-[640px]:text-[12px]'
  }

  return 'grid grid-cols-[18px_1fr] items-start gap-x-2 text-[13px] text-[#3b4cb8]/60'
})

const iconClass = computed(() => {
  return props.placement === 'footer'
    ? 'h-[18px] w-[18px] shrink-0 fill-current max-[640px]:h-[14px] max-[640px]:w-[14px]'
    : 'mt-0.5 h-4 w-4 fill-[#3b4cb8]/60'
})

const contentClass = computed(() => {
  return props.placement === 'footer'
    ? 'flex flex-nowrap items-center gap-2'
    : 'flex flex-wrap items-center gap-[3px]'
})

const labelClass = computed(() => {
  return props.placement === 'footer' ? 'text-inherit' : 'flex-initial'
})

const dateClass = computed(() => {
  return props.placement === 'footer' ? 'whitespace-nowrap font-bold text-inherit' : 'whitespace-nowrap'
})

const displayDate = computed(() => {
  if (formattedDate.value) {
    return formattedDate.value
  }

  return isLoading.value ? '...' : '--'
})

function formatDate(dateValue) {
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

async function requestFromBackend() {
  const commit = await fetchWithCache(
    getBackendApiUrl('/api/github/repos/dieWehmut/dieWehmut.github.io/commits/latest'),
    {},
    1000 * 60 * 60,
  )

  return commit?.commit?.committer?.date || commit?.commit?.author?.date || ''
}

async function loadLastUpdated(attempt = 0) {
  try {
    const dateValue = await requestFromBackend()
    if (dateValue) {
      formattedDate.value = formatDate(dateValue)
      isLoading.value = false
      try {
        window.localStorage.setItem('nexus:last-updated', formattedDate.value)
      } catch {
      }
      return
    }
  } catch {
  }

  if (attempt < 2) {
    window.setTimeout(() => {
      loadLastUpdated(attempt + 1)
    }, 400 * (attempt + 1))
    return
  }

  try {
    formattedDate.value = window.localStorage.getItem('nexus:last-updated') || ''
  } catch {
    formattedDate.value = ''
  }

  isLoading.value = false
}

onMounted(() => {
  loadLastUpdated()
})
</script>
