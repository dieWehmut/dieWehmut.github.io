import { computed, ref, watch } from 'vue'
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
const MARKDOWN_RENDER_WAIT_TIMEOUT = 30_000

/** One export at a time, whichever surface started it. */
const exporting = ref(false)
let pdfWarmupScheduledFor = ''
let pdfWarmupTimer: number | null = null
let pdfWarmupScheduleToken = 0

type PreparedPdfCache = {
  key: string
  title: string
  bytes: ArrayBuffer
}

let preparedPdfCache: PreparedPdfCache | null = null
let preparedPdfPromise: { key: string; promise: Promise<ArrayBuffer> } | null = null

function hashPdfFingerprint(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

function pdfSourceFingerprint(source: { title: string; element: HTMLElement }, siteTitle: string): string {
  const root = typeof document === 'undefined' ? null : document.documentElement
  const theme = root
    // Ignore transient cursor/hover/fullscreen classes. They are changed by
    // the click handler itself and would otherwise invalidate an idle-prepared
    // PDF immediately before the user tries to open it.
    ? `${root.dataset.theme || ''}|${root.dataset.colorScheme || ''}`
    : ''
  return hashPdfFingerprint(`${siteTitle}\n${source.title}\n${theme}\n${source.element.innerHTML}`)
}

function isPdfWorkerUnavailable(error: unknown): boolean {
  return error instanceof Error && error.name === 'PdfWorkerUnavailableError'
}

function cancelPdfWarmup(): void {
  pdfWarmupScheduleToken += 1
  if (typeof window === 'undefined') return
  if (pdfWarmupTimer !== null) window.clearTimeout(pdfWarmupTimer)
  pdfWarmupTimer = null
  pdfWarmupScheduledFor = ''
}

async function prepareCachedPdf(
  source: { title: string; element: HTMLElement },
  siteTitle: string,
  key: string,
): Promise<ArrayBuffer> {
  if (preparedPdfCache?.key === key) return preparedPdfCache.bytes
  if (preparedPdfPromise?.key === key) return preparedPdfPromise.promise

  const promise = (async () => {
    const { prepareArticlePdf } = await import('../utils/exportPdf')
    const bytes = await prepareArticlePdf(source, siteTitle)
    preparedPdfCache = { key, title: source.title, bytes }
    return bytes
  })()
  preparedPdfPromise = { key, promise }
  // Attach both fulfillment and rejection handlers to the cleanup chain. A
  // bare `finally()` creates a second Promise that can surface an unhandled
  // rejection when the Worker fails during idle pre-rendering.
  void promise.then(
    () => {
      if (preparedPdfPromise?.promise === promise) preparedPdfPromise = null
    },
    () => {
      if (preparedPdfPromise?.promise === promise) preparedPdfPromise = null
    },
  )
  return promise
}

function schedulePdfWorkerWarmup(routePath: string, siteTitle: string): void {
  if (typeof window === 'undefined') return
  if (pdfWarmupScheduledFor === routePath && pdfWarmupTimer !== null) return
  if (pdfWarmupTimer !== null) window.clearTimeout(pdfWarmupTimer)
  pdfWarmupScheduledFor = routePath
  const scheduleToken = ++pdfWarmupScheduleToken

  const warm = () => {
    pdfWarmupTimer = null
    pdfWarmupScheduledFor = ''
    // A click may arrive while the delayed timer is firing. Export state is
    // set synchronously by both public entry points, so skip optional work
    // before it can enter the Worker queue ahead of the user's request.
    if (exporting.value || scheduleToken !== pdfWarmupScheduleToken) return
    void (async () => {
      // Font loading and Worker startup can overlap progressive Markdown
      // rendering. Keep this request deliberately lightweight: the complete
      // document generation below warms formulas and images while also
      // producing the bytes the user actually needs.
      const workerWarmup = import('../utils/pdfWorkerClient')
        .then(({ warmPdfWorker }) => warmPdfWorker())
        .catch(() => undefined)
      const body = await waitForArticleBody()
      await waitForMarkdownRenderComplete(body)
      if (exporting.value || scheduleToken !== pdfWarmupScheduleToken) return
      try {
        if (exporting.value || scheduleToken !== pdfWarmupScheduleToken) return

        // Generate the complete document while the reader is idle. Preview and
        // download clicks can then only create a Blob URL and navigate, instead
        // of making the user wait through image decoding and pdfmake layout.
        // Do not wait for the lightweight Worker warm-up here: DOM conversion
        // can overlap it, and the Worker queue will serialize generation after
        // any still-active warm request.
        if (window.location.pathname === routePath) {
          const source = buildPdfSource(routePath)
          if (source) {
            const key = pdfSourceFingerprint(source, siteTitle)
            await prepareCachedPdf(source, siteTitle, key)
          }
        }
        await workerWarmup
      } catch {
        // A page may leave the route before its body finishes mounting; the
        // font/context warm-up above is still useful for the next export.
      }
    })().catch(() => {
      // Worker construction is optional; the export path still falls back to
      // the main-thread renderer when CSP or an older browser rejects it.
    })
  }

  // Yield the initial paint, then overlap Worker startup with progressive
  // Markdown rendering. The complete PDF is cached as soon as the article is
  // ready instead of waiting an arbitrary 15 seconds before doing useful work.
  pdfWarmupTimer = window.setTimeout(warm, 50)
}

function findArticleBodyElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>(ARTICLE_BODY_SELECTOR)
}

function findArticleBody(): HTMLElement | null {
  const body = findArticleBodyElement()
  return body && body.textContent?.trim() ? body : null
}

function waitForArticleBody(): Promise<HTMLElement> {
  const existing = findArticleBodyElement()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    let observer: MutationObserver | null = null
    let timeout = 0
    let settled = false

    const finish = (body?: HTMLElement, error?: Error) => {
      if (settled) return
      settled = true
      observer?.disconnect()
      window.clearTimeout(timeout)
      if (error) reject(error)
      else if (body) resolve(body)
      else reject(new Error('Article body is unavailable.'))
    }

    const check = () => {
      const body = findArticleBodyElement()
      if (body) finish(body)
    }

    observer = new MutationObserver(check)
    observer.observe(document.documentElement, { childList: true, subtree: true })
    timeout = window.setTimeout(() => {
      finish(undefined, new Error('Timed out waiting for the article body.'))
    }, MARKDOWN_RENDER_WAIT_TIMEOUT)
    check()
  })
}

function waitForMarkdownRenderComplete(body: HTMLElement): Promise<void> {
  const state = body.dataset.mdRenderState
  // Consumers outside MarkdownContent may provide a static markdown body. Keep
  // those callers compatible while waiting for the progressive renderer used by
  // article and note views.
  if (!state || state === 'complete') return Promise.resolve()

  return new Promise((resolve, reject) => {
    let observer: MutationObserver | null = null
    let timeout = 0
    let settled = false

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      observer?.disconnect()
      window.clearTimeout(timeout)
      if (error) reject(error)
      else resolve()
    }

    const check = () => {
      const nextState = body.dataset.mdRenderState
      if (!nextState || nextState === 'complete') finish()
    }

    observer = new MutationObserver(check)
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-md-render-state'],
    })
    timeout = window.setTimeout(() => {
      finish(new Error('Timed out waiting for Markdown rendering to complete.'))
    }, MARKDOWN_RENDER_WAIT_TIMEOUT)
    check()
  })
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

  watch(
    () => [String(route.name || ''), route.path] as const,
    ([routeName, routePath]) => {
      if (routeName === 'post-detail' || routeName === 'note-detail') {
        schedulePdfWorkerWarmup(routePath, siteProfile.title || 'Nexus')
      } else {
        cancelPdfWarmup()
      }
    },
    { immediate: true },
  )

  async function previewArticlePdf(): Promise<boolean> {
    if (exporting.value) return false
    cancelPdfWarmup()

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
      const body = await waitForArticleBody()
      await waitForMarkdownRenderComplete(body)
      const source = buildPdfSource(route.path)
      if (!source) {
        previewWindow.close()
        return false
      }

      const siteTitle = siteProfile.title || 'Nexus'
      const key = pdfSourceFingerprint(source, siteTitle)
      const { deliverArticlePdfBytes, generateArticlePdf } = await import('../utils/exportPdf')
      try {
        const bytes = await prepareCachedPdf(source, siteTitle, key)
        deliverArticlePdfBytes(bytes, source.title, {
          mode: 'preview',
          targetWindow: previewWindow,
        })
      } catch (error) {
        if (!isPdfWorkerUnavailable(error)) throw error
        await generateArticlePdf(source, siteTitle, {
          mode: 'preview',
          targetWindow: previewWindow,
        })
      }
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
    cancelPdfWarmup()

    exporting.value = true
    try {
      const body = await waitForArticleBody()
      await waitForMarkdownRenderComplete(body)
      const source = buildPdfSource(route.path)
      if (!source) return false
      const siteTitle = siteProfile.title || 'Nexus'
      const key = pdfSourceFingerprint(source, siteTitle)
      const { deliverArticlePdfBytes, generateArticlePdf } = await import('../utils/exportPdf')
      try {
        const bytes = await prepareCachedPdf(source, siteTitle, key)
        deliverArticlePdfBytes(bytes, source.title)
      } catch (error) {
        if (!isPdfWorkerUnavailable(error)) throw error
        await generateArticlePdf(source, siteTitle)
      }
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
