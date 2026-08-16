<template>
  <button
    class="article-export-button"
    :class="`article-export-button--${variant}`"
    type="button"
    :disabled="exporting"
    :title="exporting ? 'Generating PDF...' : 'Export article as PDF'"
    aria-label="Export article as PDF"
    @click="exportArticlePdf"
  >
    <el-icon aria-hidden="true"><Download /></el-icon>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Download } from '@element-plus/icons-vue'
import { siteProfile } from '../../data'

type ArticleExportVariant = 'breadcrumb' | 'console'

const props = withDefaults(defineProps<{
  variant?: ArticleExportVariant
}>(), {
  variant: 'breadcrumb',
})

const route = useRoute()
const exporting = ref(false)

const label = computed(() => {
  if (props.variant === 'console') return exporting.value ? 'exporting...' : 'export.pdf'
  return exporting.value ? 'PDF...' : 'PDF'
})

function buildPdfSource() {
  const body = document.querySelector<HTMLElement>(
    '.post-view__body.markdown-body, .note-view__body.markdown-body, .markdown-body'
  )
  if (!body || !body.textContent?.trim()) return null

  const title = document.querySelector<HTMLElement>('.post-view__title, .note-view__title')
  const meta = document.querySelector<HTMLElement>('.article-meta')
  const bodyClone = body.cloneNode(true) as HTMLElement
  const titleClone = title?.cloneNode(true) as HTMLElement | null
  const metaClone = meta?.cloneNode(true) as HTMLElement | null

  bodyClone
    .querySelectorAll('.md-editable-toolbar, .md-editable-source, .md-code-preview__fold')
    .forEach((element) => element.remove())

  const article = document.createElement('article')
  article.className = 'pdf-doc'
  if (titleClone) article.append(titleClone)
  if (metaClone) article.append(metaClone)
  article.append(bodyClone)

  return {
    title: titleClone?.textContent?.trim() || route.path,
    element: article,
  }
}

async function exportArticlePdf() {
  if (exporting.value) return
  const source = buildPdfSource()
  if (!source) return

  exporting.value = true
  try {
    const { generateArticlePdf } = await import('../../utils/exportPdf')
    await generateArticlePdf(source, siteProfile.title || 'Nexus')
  } catch (error) {
    console.error('PDF export failed:', error)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.article-export-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--site-accent);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.article-export-button--breadcrumb {
  margin-left: 10px;
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--site-accent) 38%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  pointer-events: auto;
}

.article-export-button--breadcrumb:hover:not(:disabled),
.article-export-button--breadcrumb:focus-visible {
  background: color-mix(in srgb, var(--site-accent) 16%, transparent);
  border-color: var(--site-accent);
  color: var(--site-text);
  outline: none;
  transform: translateY(-1px);
}

.article-export-button--console {
  min-height: 30px;
  margin-top: 12px;
  padding: 5px 9px;
  border: 1px solid var(--console-border-strong, var(--site-border));
  border-radius: 0;
  background: var(--console-surface, transparent);
  color: var(--console-accent, var(--site-accent));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.article-export-button--console:hover:not(:disabled),
.article-export-button--console:focus-visible {
  border-color: var(--console-accent, var(--site-accent));
  background: var(--console-selection, transparent);
  color: var(--console-text, var(--site-text));
  outline: none;
}

.article-export-button:disabled {
  opacity: 0.55;
  cursor: wait;
}
</style>
