<template>
  <span v-if="wordCount" class="content-stats__item">
    <el-icon class="content-stats__icon"><Document /></el-icon>
    words:{{ wordCount }}
  </span>
  <span v-if="readingMinutes" class="content-stats__item">
    <el-icon class="content-stats__icon"><Timer /></el-icon>
    read:{{ readingMinutes }} min
  </span>
</template>

<script setup lang="ts">
import { Document, Timer } from '@element-plus/icons-vue'

defineProps<{
  wordCount?: number
  readingMinutes?: number
}>()
</script>

<style scoped>
.content-stats__item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.content-stats__icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
}
</style>
