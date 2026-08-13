<template>
  <nav class="route-breadcrumb" :class="`route-breadcrumb--${variant}`" aria-label="Current page path">
    <template v-for="(crumb, index) in crumbs" :key="`${crumb.label}:${index}`">
      <span v-if="index > 0" class="route-breadcrumb__separator" aria-hidden="true">&gt;</span>
      <RouterLink
        v-if="crumb.to && index < crumbs.length - 1"
        class="route-breadcrumb__item"
        :to="crumb.to"
      >
        {{ crumb.label }}
      </RouterLink>
      <button
        v-else-if="crumb.sectionId"
        class="route-breadcrumb__item route-breadcrumb__item--section"
        type="button"
        :data-section-id="crumb.sectionId"
        :title="`Jump to ${crumb.label}`"
        @click="requestScrollToSection(crumb.sectionId)"
      >
        {{ crumb.label }}
      </button>
      <span
        v-else
        class="route-breadcrumb__item route-breadcrumb__item--current"
        aria-current="page"
      >
        {{ crumb.label }}
      </span>
    </template>
    <button
      v-if="isArticleDetail"
      class="route-breadcrumb__export"
      type="button"
      :disabled="exporting"
      :title="exporting ? 'Preparing PDF…' : 'Export article as PDF'"
      @click="exportArticlePdf"
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
        <path d="M12 3v10m0 0 3.5-3.5M12 13 8.5 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <span>{{ exporting ? '…' : 'PDF' }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getNotes, getPosts, siteProfile } from '../../data'
import { getCaptureAssetById } from '../../data/capture'
import { requestScrollToSection, useReadingPath } from '../../composables/useReadingPath'

type Crumb = {
  label: string
  to?: string
  sectionId?: string
}

const route = useRoute()
const readingPath = useReadingPath()
const exporting = ref(false)

const isArticleDetail = computed(() => {
  const name = String(route.name || '')
  return name === 'post-detail' || name === 'note-detail'
})

const PDF_PRINT_CSS = `
  @page { size: A4; margin: 13mm 12mm; }
  html { background: #fff !important; }
  body {
    background: #fff !important;
    color: #111 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .pdf-doc { color: #111; }
  .pdf-doc h1 {
    margin: 0 0 10px;
    color: #111;
    font-size: 23px;
    line-height: 1.35;
  }
  .pdf-doc .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin: 0 0 16px;
    color: #444;
    font-size: 12px;
    font-weight: 600;
  }
  .pdf-doc .article-meta a { color: inherit; text-decoration: none; }
  .pdf-doc .article-meta .article-meta__tags { display: none; }
  .pdf-doc .markdown-body {
    color: #111;
    font-size: 13.5px;
    line-height: 1.7;
  }
  .pdf-doc .markdown-body a { color: #0645ad; word-break: break-all; }
  .pdf-doc .markdown-body img { max-width: 100%; }
  .pdf-doc .markdown-body pre,
  .pdf-doc .markdown-body blockquote,
  .pdf-doc .markdown-body table,
  .pdf-doc .markdown-body .md-editable-block {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pdf-doc .markdown-body h1,
  .pdf-doc .markdown-body h2,
  .pdf-doc .markdown-body h3,
  .pdf-doc .markdown-body h4 {
    page-break-after: avoid;
    break-after: avoid;
  }
  .pdf-doc .md-editable-toolbar,
  .pdf-doc .md-editable-source,
  .pdf-doc .md-code-preview__fold,
  .pdf-doc button {
    display: none !important;
  }
  .pdf-doc .md-code-preview {
    max-height: none !important;
    overflow: visible !important;
  }
  .pdf-doc .md-editable-content { display: block !important; }
  .pdf-doc .katex-display,
  .pdf-doc .md-math-block { overflow-x: auto; }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPdfDocument() {
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
    html: article.outerHTML,
  }
}

function copyStylesAndTheme(frameDoc: Document) {
  for (const element of Array.from(
    document.head.querySelectorAll('style, link[rel="stylesheet"]')
  )) {
    frameDoc.head.appendChild(element.cloneNode(true))
  }

  for (const attribute of Array.from(document.documentElement.attributes)) {
    frameDoc.documentElement.setAttribute(attribute.name, attribute.value)
  }

  const sourceStyles = getComputedStyle(document.documentElement)
  for (let index = 0; index < sourceStyles.length; index += 1) {
    const name = sourceStyles[index]
    if (name.startsWith('--')) {
      frameDoc.documentElement.style.setProperty(
        name,
        sourceStyles.getPropertyValue(name)
      )
    }
  }
}

function waitForPrintDocument(frame: HTMLIFrameElement) {
  return new Promise<void>((resolve) => {
    const frameDoc = frame.contentDocument
    if (!frameDoc) {
      resolve()
      return
    }
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const timer = window.setTimeout(done, 1800)
    const stylesheets = Array.from(
      frameDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
    const pendingSheets = stylesheets.filter((link) => !link.sheet)
    const finish = () => {
      window.clearTimeout(timer)
      done()
    }
    Promise.all([
      frameDoc.fonts?.ready ?? Promise.resolve(),
      ...pendingSheets.map(
        (link) =>
          new Promise<void>((resolveLink) => {
            link.addEventListener('load', () => resolveLink(), { once: true })
            link.addEventListener('error', () => resolveLink(), { once: true })
          })
      ),
    ]).then(finish)
  })
}

async function exportArticlePdf() {
  if (exporting.value) return
  const documentSource = buildPdfDocument()
  if (!documentSource) return

  exporting.value = true
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(frame)

  const cleanup = () => {
    frame.remove()
  }
  window.setTimeout(cleanup, 120_000)
  frame.contentWindow?.addEventListener('afterprint', cleanup, { once: true })

  try {
    const frameDoc = frame.contentDocument
    if (!frameDoc) throw new Error('Unable to create the print document.')
    frameDoc.open()
    frameDoc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(documentSource.title)}</title></head><body></body></html>`
    )
    frameDoc.close()

    copyStylesAndTheme(frameDoc)
    frameDoc.body.innerHTML = documentSource.html

    const printStyle = frameDoc.createElement('style')
    printStyle.textContent = PDF_PRINT_CSS
    frameDoc.head.appendChild(printStyle)

    await waitForPrintDocument(frame)
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
  } catch (error) {
    cleanup()
    console.error('PDF export failed:', error)
  } finally {
    exporting.value = false
  }
}

defineProps({
  variant: { type: String, default: 'bar' },
})

const staticPages: Record<string, Crumb> = {
  home: { label: 'Home', to: '/' },
  archive: { label: 'Archive', to: '/archive' },
  notes: { label: 'Notes', to: '/notes' },
  capture: { label: 'Capture', to: '/capture' },
  infra: { label: 'Infra', to: '/infra' },
  project: { label: 'Project', to: '/project' },
  tags: { label: 'Tags', to: '/tags' },
  about: { label: 'About', to: '/about' },
  friends: { label: 'Friends', to: '/friends' },
  search: { label: 'Search', to: '/search' },
}

function decodeParam(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function detailTitle() {
  const name = String(route.name || '')
  if (name === 'post-detail') {
    const id = String(route.params.id || '')
    return getPosts().find((post) => post.id === id)?.title || id
  }

  if (name === 'note-detail') {
    const id = String(route.params.id || '')
    return getNotes().find((note) => note.id === id)?.title || id
  }

  if (name === 'capture-detail') {
    const id = decodeParam(route.params.id)
    return getCaptureAssetById(id)?.title || id || 'Detail'
  }

  if (name === 'tag-detail') return decodeParam(route.params.tag) || 'Detail'
  return ''
}

const crumbs = computed<Crumb[]>(() => {
  const siteCrumb = { label: siteProfile.title || 'Nexus', to: '/' }
  const name = String(route.name || '')
  const section = readingPath.value
  const sectionCrumb = section?.title
    ? { label: section.title, sectionId: section.activeId }
    : null

  if (name === 'post-detail') {
    const crumbs: Crumb[] = [{ label: 'Archive', to: '/archive' }, { label: detailTitle() }]
    if (sectionCrumb) crumbs.push(sectionCrumb)
    return crumbs
  }
  if (name === 'note-detail') {
    const crumbs: Crumb[] = [{ label: 'Notes', to: '/notes' }, { label: detailTitle() }]
    if (sectionCrumb) crumbs.push(sectionCrumb)
    return crumbs
  }
  if (name === 'capture-detail') return [{ label: 'Capture', to: '/capture' }, { label: detailTitle() }]
  if (name === 'tag-detail') return [{ label: 'Tags', to: '/tags' }, { label: detailTitle() }]
  if (name === 'not-found') return [siteCrumb, { label: 'Not Found' }]

  const page = staticPages[name]
  if (page) return [siteCrumb, { label: page.label, to: page.to }]
  return [siteCrumb, { label: route.path || 'View' }]
})
</script>

<style scoped>
.route-breadcrumb {
  position: fixed;
  top: 0;
  left: var(--site-sidebar-width);
  right: auto;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 3px;
  width: max-content;
  max-width: calc(100vw - var(--site-sidebar-width) - 24px);
  height: var(--site-route-path-height);
  min-width: 0;
  padding: 1px 12px 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 760;
  pointer-events: none;
  animation: routePathSlide 220ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

.route-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  min-height: 26px;
  padding: 0 4px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  pointer-events: auto;
  text-shadow: 0 1px 2px var(--site-bg), 0 0 10px var(--site-bg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.route-breadcrumb__item:hover,
.route-breadcrumb__item:focus-visible {
  background: color-mix(in srgb, var(--site-accent) 10%, transparent);
  color: var(--site-accent);
  text-decoration: none;
  outline: none;
}

.route-breadcrumb__item--current {
  color: var(--site-text);
}

.route-breadcrumb__item--section {
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--site-accent);
  cursor: pointer;
}

.route-breadcrumb__separator {
  flex: 0 0 auto;
  color: var(--site-accent);
  font-weight: 900;
}

.route-breadcrumb__export {
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
  cursor: pointer;
  pointer-events: auto;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.route-breadcrumb__export:hover:not(:disabled),
.route-breadcrumb__export:focus-visible {
  background: color-mix(in srgb, var(--site-accent) 16%, transparent);
  border-color: var(--site-accent);
  color: var(--site-text);
  outline: none;
  transform: translateY(-1px);
}

.route-breadcrumb__export:disabled {
  opacity: 0.55;
  cursor: wait;
}

@media (min-width: 901px) and (max-width: 1080px) {
  .route-breadcrumb {
    right: 16px;
  }
}

@media (max-width: 900px) {
  .route-breadcrumb {
    position: sticky;
    top: var(--site-mobile-header-height);
    right: auto;
    left: auto;
    z-index: 29;
    width: 100%;
    padding-inline: 18px;
  }
}

.route-breadcrumb.route-breadcrumb--inline {
  position: static;
  top: auto;
  right: auto;
  left: auto;
  z-index: auto;
  flex: 1 1 auto;
  width: auto;
  max-width: none;
  height: 40px;
  min-width: 0;
  padding: 0;
  border-bottom: 0;
  background: transparent;
  backdrop-filter: none;
  animation: none;
  gap: 2px;
}

.route-breadcrumb.route-breadcrumb--inline .route-breadcrumb__item {
  padding-inline: 2px;
}

@keyframes routePathSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
