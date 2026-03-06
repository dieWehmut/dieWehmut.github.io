<template>
  <ReleaseList ref="releaseListRef" type="games" :filter-query="filterQuery" />
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

const games = computed(() => releaseListRef.value?.games || [])
const filteredGames = computed(() => releaseListRef.value?.filteredGames || [])
const loading = computed(() => releaseListRef.value?.loading || false)
const error = computed(() => releaseListRef.value?.error || '')

defineExpose({ games, filteredGames, loading, error })
</script>