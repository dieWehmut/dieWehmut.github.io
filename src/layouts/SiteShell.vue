<template>
  <component :is="isMobileLayout ? MobileDrawerLayout : DesktopSidebarLayout" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DesktopSidebarLayout from './DesktopSidebarLayout.vue'
import MobileDrawerLayout from './MobileDrawerLayout.vue'

const mobileLayoutQuery = '(max-width: 900px)'
const isMobileLayout = ref(
  typeof window !== 'undefined' ? window.matchMedia(mobileLayoutQuery).matches : false
)

let mediaQuery = null

function updateLayout() {
  if (mediaQuery) isMobileLayout.value = mediaQuery.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia(mobileLayoutQuery)
  updateLayout()

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', updateLayout)
  } else {
    mediaQuery.addListener(updateLayout)
  }
})

onBeforeUnmount(() => {
  if (!mediaQuery) return

  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', updateLayout)
  } else {
    mediaQuery.removeListener(updateLayout)
  }
})
</script>
