<template>
  <ReleaseList ref="releaseListRef" type="apps" :filter-query="filterQuery" />
</template>

<script setup>
import { computed, defineExpose, ref } from 'vue'
import ReleaseList from './ReleaseList.vue'

defineProps({
  filterQuery: {
    type: String,
    default: '',
  },
})

const releaseListRef = ref(null)

const apps = computed(() => releaseListRef.value?.apps || [])
const filteredApps = computed(() => releaseListRef.value?.filteredApps || [])
const loading = computed(() => releaseListRef.value?.loading || false)
const error = computed(() => releaseListRef.value?.error || '')

defineExpose({ apps, filteredApps, loading, error })
</script>