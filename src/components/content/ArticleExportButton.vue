<template>
  <button
    class="article-export-button"
    type="button"
    :disabled="exporting"
    :title="exporting ? 'Generating PDF...' : 'Export article as PDF'"
    aria-label="Export article as PDF"
    @click="exportArticlePdf"
  >
    <el-icon aria-hidden="true"><Download /></el-icon>
    <span>{{ exporting ? 'PDF...' : 'PDF' }}</span>
  </button>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import { useArticlePdfExport } from '../../composables/useArticlePdfExport'

const { exporting, exportArticlePdf } = useArticlePdfExport()
</script>

<style scoped>
.article-export-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--site-accent) 38%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
  color: var(--site-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  pointer-events: auto;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.article-export-button:hover:not(:disabled),
.article-export-button:focus-visible {
  background: color-mix(in srgb, var(--site-accent) 16%, transparent);
  border-color: var(--site-accent);
  color: var(--site-text);
  outline: none;
  transform: translateY(-1px);
}

.article-export-button:disabled {
  opacity: 0.55;
  cursor: wait;
}
</style>
