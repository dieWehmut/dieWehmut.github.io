import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { siteProfile } from '../data'

/**
 * The article PDF export, shared by the classic breadcrumb button and the
 * Console `/export` command. It reads the rendered article back out of the DOM,
 * so the only prerequisite is that a markdown body is on screen — which is also
 * what makes "is there anything to export here?" answerable without knowing
 * anything about the route.
 */
const ARTICLE_BODY_SELECTOR = '.post-view__body.markdown-body, .note-view__body.markdown-body, .markdown-body'

/** One export at a time, whichever surface started it. */
const exporting = ref(false)

function findArticleBody(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const body = document.querySelector<HTMLElement>(ARTICLE_BODY_SELECTOR)
  return body && body.textContent?.trim() ? body : null
}

export function hasExportableArticle(): boolean {
  return findArticleBody() !== null
}

function buildPdfSource(fallbackTitle: string) {
  const body = findArticleBody()
  if (!body) return null

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
    title: titleClone?.textContent?.trim() || fallbackTitle,
    element: article,
  }
}

export function useArticlePdfExport() {
  const route = useRoute()

  async function exportArticlePdf(): Promise<boolean> {
    if (exporting.value) return false
    const source = buildPdfSource(route.path)
    if (!source) return false

    exporting.value = true
    try {
      const { generateArticlePdf } = await import('../utils/exportPdf')
      await generateArticlePdf(source, siteProfile.title || 'Nexus')
      return true
    } catch (error) {
      console.error('PDF export failed:', error)
      return false
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting: computed(() => exporting.value),
    exportArticlePdf,
  }
}
