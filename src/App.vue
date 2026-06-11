<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
    <PageScrollProgress />
    <BackgroundLayer />
    <BounceCursor />
    <SiteShell />
    <FloatButton />
  </el-config-provider>
</template>

<script setup>
import BackgroundLayer from './components/background/BackgroundLayer.vue'
import PageScrollProgress from './components/system/PageScrollProgress.vue'
import BounceCursor from './components/system/BounceCursor.vue'
import FloatButton from './components/system/FloatButton.vue'
import SiteShell from './layouts/SiteShell.vue'
</script>
