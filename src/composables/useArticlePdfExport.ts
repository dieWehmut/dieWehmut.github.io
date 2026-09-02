import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { siteProfile } from '../data'
import { resetPointerEffects } from '../utils/pointerEffects'

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

  async function previewArticlePdf(): Promise<boolean> {
    if (exporting.value) return false

    // Clear the custom cursor while the click still belongs to this document.
    resetPointerEffects()
    const previewWindow = typeof window === 'undefined'
      ? null
      : window.open('', '_blank')
    if (!previewWindow) return false

    // Detach the PDF viewer from this page. Chromium can otherwise place the
    // opener and its built-in PDF extension in one renderer process, making a
    // large preview temporarily starve pointer events in the article tab.
    try {
      previewWindow.opener = null
    } catch {
      // A browser may expose a read-only WindowProxy; generation still works.
    }

    try {
      previewWindow.document.title = 'PDF Preview'
      previewWindow.document.body.innerHTML = '<p style="font: 14px sans-serif; padding: 24px">Preparing PDF preview...</p>'
    } catch {
      // A newly opened blank window should be same-origin, but generation does
      // not depend on the temporary status message being writable.
    }

    exporting.value = true
    try {
      // Let the click event finish before cloning the DOM or loading MathJax,
      // Mermaid and fonts. This keeps the document's pointer/click pipeline
      // responsive while the preview is prepared.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
      const source = buildPdfSource(route.path)
      if (!source) {
        previewWindow.close()
        return false
      }

      const { generateArticlePdf } = await import('../utils/exportPdf')
      await generateArticlePdf(source, siteProfile.title || 'Nexus', {
        mode: 'preview',
        targetWindow: previewWindow,
      })
      return true
    } catch (error) {
      console.error('PDF preview failed:', error)
      if (!previewWindow.closed) previewWindow.close()
      return false
    } finally {
      exporting.value = false
    }
  }

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
    previewArticlePdf,
  }
}
