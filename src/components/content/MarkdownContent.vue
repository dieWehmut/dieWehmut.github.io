<template>
  <div ref="containerRef" class="markdown-content" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  source: string
  docId?: string
  codeRunner?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)

let cleanup: (() => void) | null = null
let renderToken = 0
let markdownModulePromise: Promise<typeof import('../../utils/markdown')> | null = null
const scheduledHandles = new Set<number>()

type IdleScheduler = Window & typeof globalThis & {
  requestIdleCallback?: (callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

function bindInteractions(token: number) {
  cleanup?.()
  loadMarkdownModule().then(({ bindMarkdownInteractions }) => {
    if (token !== renderToken) return
    cleanup = bindMarkdownInteractions(containerRef.value)
  })
}

function loadMarkdownModule() {
  markdownModulePromise ||= import('../../utils/markdown')
  return markdownModulePromise
}

function setRenderedHtml(renderedHtml: string) {
  if (!containerRef.value) return
  containerRef.value.innerHTML = renderedHtml
}

function appendRenderedHtml(renderedHtml: string) {
  if (!containerRef.value) return
  const section = document.createElement('section')
  section.className = 'markdown-content__chunk'
  section.innerHTML = renderedHtml
  containerRef.value.append(section)
}

function scheduleIdle(callback: (deadline?: IdleDeadline) => void, timeout = 700): number {
  if (typeof window === 'undefined') {
    callback()
    return 0
  }

  const scheduler = window as IdleScheduler
  const wrapped = (deadline?: IdleDeadline) => {
    scheduledHandles.delete(handle)
    callback(deadline)
  }
  let handle = 0

  if (scheduler.requestIdleCallback) {
    handle = scheduler.requestIdleCallback(wrapped, { timeout })
  } else {
    handle = window.setTimeout(wrapped, 0)
  }

  scheduledHandles.add(handle)
  return handle
}

function cancelScheduledWork() {
  if (typeof window === 'undefined') return
  const scheduler = window as IdleScheduler
  scheduledHandles.forEach((handle) => {
    if (scheduler.cancelIdleCallback) {
      scheduler.cancelIdleCallback(handle)
    } else {
      window.clearTimeout(handle)
    }
  })
  scheduledHandles.clear()
}

const HMR_SCROLL_KEY = 'md-hmr-scroll'
// How long after the last render-completion signal we keep re-pinning. A fresh
// remount/chunk-drain pushes this out, so the loop lives until the edit cascade
// actually settles rather than until a guessed wall-clock timeout.
const HMR_SETTLE_GRACE = 1500
// Absolute backstop so a pathological cascade can never pin scroll forever.
const HMR_HARD_CAP = 20000

type HmrWindow = Window & {
  __mdHmrScrollActive?: boolean
  __mdHmrSettleUntil?: number
}

// Extend the settle window. Called on every remount and every render-completion
// signal, so the restore loop keeps running for as long as content is moving.
function bumpHmrSettle() {
  if (typeof window === 'undefined') return
  const w = window as HmrWindow
  if (!w.__mdHmrScrollActive) return
  w.__mdHmrSettleUntil = performance.now() + HMR_SETTLE_GRACE
}

// A markdown HMR edit regenerates generated.ts and remounts the doc view
// (possibly several times), each pass transiently collapsing document height and
// clamping scrollY to 0. docs/index.ts stashes the reader's target Y in
// sessionStorage (which survives the remount). A single window-scoped timer loop
// re-pins the scroll until renders stop settling, so concurrent remounts all
// converge instead of fighting each other. Each remount and chunk batch pushes
// the settle deadline out (bumpHmrSettle), so the loop outlives an arbitrarily
// long or multi-pass cascade. Pinning only applies once the document is tall
// enough, otherwise scrollTo would clamp to a smaller intermediate max.
function ensureHmrScrollRestore() {
  if (typeof window === 'undefined' || !import.meta.hot) return
  const w = window as HmrWindow
  if (w.__mdHmrScrollActive) {
    // Already pinning from an earlier remount in this cascade; keep it alive.
    bumpHmrSettle()
    return
  }

  let stash: { y: number } | null = null
  try {
    const raw = sessionStorage.getItem(HMR_SCROLL_KEY)
    if (raw) stash = JSON.parse(raw)
  } catch {
    stash = null
  }
  if (!stash || !(stash.y > 0)) return

  w.__mdHmrScrollActive = true
  w.__mdHmrSettleUntil = performance.now() + HMR_SETTLE_GRACE
  const targetY = stash.y
  const hardDeadline = performance.now() + HMR_HARD_CAP

  const finish = () => {
    w.__mdHmrScrollActive = false
    w.__mdHmrSettleUntil = 0
    try {
      sessionStorage.removeItem(HMR_SCROLL_KEY)
    } catch {
      // best-effort cleanup
    }
  }

  // Drive the re-pin off a short setTimeout rather than requestAnimationFrame:
  // rAF is fully paused in a throttled/background tab (where performance.now()
  // keeps advancing), which would burn the settle deadline without ever pinning.
  // setTimeout is only throttled, not frozen, so restoration still converges.
  const tick = () => {
    const now = performance.now()
    if (now > (w.__mdHmrSettleUntil || 0) || now > hardDeadline) {
      finish()
      return
    }
    const maxY = document.documentElement.scrollHeight - window.innerHeight
    if (maxY + 1 >= targetY && Math.abs(window.scrollY - targetY) > 1) {
      window.scrollTo({ top: targetY })
    }
    window.setTimeout(tick, 32)
  }
  window.setTimeout(tick, 0)
}

function renderRemainingChunks(
  chunks: string[],
  index: number,
  token: number,
  renderMarkdown: typeof import('../../utils/markdown').renderMarkdown
) {
  if (token !== renderToken) return
  if (index >= chunks.length) {
    // All chunks painted; the document just reached its full height, so keep
    // the HMR restore loop alive long enough to re-pin against this layout.
    bumpHmrSettle()
    return
  }

  scheduleIdle((deadline) => {
    if (token !== renderToken) return
    let cursor = index
    // Drain as many chunks as fit in this idle slice instead of one per
    // callback, so a large doc finishes in a couple of frames rather than
    // dribbling out over many seconds.
    do {
      appendRenderedHtml(renderMarkdown(chunks[cursor], {
        codeRunner: props.codeRunner,
        docId: props.docId,
      }))
      cursor += 1
      if (token !== renderToken) return
    } while (
      cursor < chunks.length &&
      (!deadline || deadline.timeRemaining() > 4)
    )
    // Each appended batch grows the document, so keep the HMR restore loop alive
    // across the whole drain rather than only at final completion. On a saturated
    // main thread the full render can outlast a single settle grace window.
    bumpHmrSettle()
    renderRemainingChunks(chunks, cursor, token, renderMarkdown)
  }, 300)
}

watch(
  () => [props.source, props.docId, props.codeRunner] as const,
  ([source]) => {
    const token = ++renderToken
    cleanup?.()
    cleanup = null
    cancelScheduledWork()

    // Restore the reader's pre-edit scroll position after a dev-time HMR edit.
    ensureHmrScrollRestore()

    if (!source) {
      setRenderedHtml('')
      return
    }

    // Render all content synchronously so the full document (headings, etc.)
    // is available immediately for ScrollSpySidebar and other observers.
    void (async () => {
      const { renderMarkdown } = await loadMarkdownModule()
      if (token !== renderToken) return
      const renderedHtml = renderMarkdown(source, {
        codeRunner: props.codeRunner,
        docId: props.docId,
      })
      if (token !== renderToken) return
      setRenderedHtml(renderedHtml)
      bindInteractions(token)
      bumpHmrSettle()
    })()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  renderToken += 1
  cancelScheduledWork()
  cleanup?.()
})
</script>
