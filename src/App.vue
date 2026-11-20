<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
    <PageScrollProgress />
    <BackgroundLayer />
    <BounceCursor />
    <SiteShell />
    <FloatButton v-if="!isConsole" />
  </el-config-provider>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import BackgroundLayer from './components/background/BackgroundLayer.vue'
import PageScrollProgress from './components/system/PageScrollProgress.vue'
import BounceCursor from './components/system/BounceCursor.vue'
import FloatButton from './components/system/FloatButton.vue'
import SiteShell from './layouts/SiteShell.vue'
import { useDisplayModePreference } from './composables/useDisplayModePreference'
import { bindInlineImageAnnotations } from './utils/imageAnnotationInline'

const { isConsole } = useDisplayModePreference()
let releaseImageAnnotations = () => {}
onMounted(() => {
  const root = document.getElementById('app')
  if (root) releaseImageAnnotations = bindInlineImageAnnotations(root)
})
onBeforeUnmount(() => releaseImageAnnotations())
</script>
