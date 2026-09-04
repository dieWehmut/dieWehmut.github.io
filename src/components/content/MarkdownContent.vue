<template>
  <div
    ref="containerRef"
    class="markdown-content"
    :data-md-render-state="renderState"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  source: string
  docId?: string
  codeRunner?: boolean
}>()

const emit = defineEmits(['ready'])

const containerRef = ref<HTMLElement | null>(null)
const renderState = ref<'idle' | 'rendering' | 'complete'>('idle')

let cleanup: (() => void) | null = null
let renderToken = 0
let readyEmitted = false
let markdownModulePromise: Promise<typeof import('../../utils/markdown')> | null = null
const scheduledHandles = new Set<number>()

async function bindInteractions(token: number): Promise<void> {
  cleanup?.()
  const { bindMarkdownInteractions, ensureMermaidRendered } = await loadMarkdownModule()
  if (token !== renderToken) return

  // The first chunk is allowed to announce `ready` for the reader, but PDF
  // export waits for `complete`. Mermaid figures must be hydrated before that
  // final signal, otherwise the exporter can clone source placeholders.
  try {
    await ensureMermaidRendered(containerRef.value)
  } catch {
    // Individual diagrams already expose a source fallback. A failed optional
    // hydration must not leave the document permanently stuck in rendering.
  }
  if (token !== renderToken) return
  cleanup = bindMarkdownInteractions(containerRef.value)
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
  if (!readyEmitted) {
    readyEmitted = true
    emit('ready')
  }
  const section = document.createElement('section')
  section.className = 'markdown-content__chunk'
  section.innerHTML = renderedHtml
  containerRef.value.append(section)
}

function scheduleDrain(callback: () => void): number {
  if (typeof window === 'undefined') {
    callback()
    return 0
  }

  const wrapped = () => {
    scheduledHandles.delete(handle)
    callback()
  }
  const handle = window.setTimeout(wrapped, 0)
  scheduledHandles.add(handle)
  return handle
}

function cancelScheduledWork() {
  if (typeof window === 'undefined') return
  scheduledHandles.forEach((handle) => {
    window.clearTimeout(handle)
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
  renderMarkdown: typeof import('../../utils/markdown').renderMarkdown,
  headingIds: Map<string, number>,
  onDone?: () => void
) {
  if (token !== renderToken) return
  if (index >= chunks.length) {
    // All chunks painted; the document just reached its full height, so keep
    // the HMR restore loop alive long enough to re-pin against this layout.
    bumpHmrSettle()
    onDone?.()
    return
  }

  scheduleDrain(() => {
    if (token !== renderToken) return
    // Render one chunk per macrotask: each chunk gets a chance to paint before
    // the next one starts, and a long document no longer blocks the main
    // thread for the whole render at once.
    appendRenderedHtml(renderMarkdown(chunks[index], {
      codeRunner: props.codeRunner,
      docId: props.docId,
      headingIds,
    }))
    if (token !== renderToken) return
    bumpHmrSettle()
    renderRemainingChunks(chunks, index + 1, token, renderMarkdown, headingIds, onDone)
  })
}

watch(
  () => [props.source, props.docId, props.codeRunner] as const,
  ([source]) => {
    const token = ++renderToken
    renderState.value = 'rendering'
    readyEmitted = false
    cleanup?.()
    cleanup = null
    cancelScheduledWork()

    // Restore the reader's pre-edit scroll position after a dev-time HMR edit.
    ensureHmrScrollRestore()

    if (!source) {
      setRenderedHtml('')
      renderState.value = 'complete'
      return
    }

    // Short documents render synchronously so the full document (headings,
    // etc.) is available immediately; large documents render progressively in
    // idle slices so the first content appears without a long main-thread block.
    void (async () => {
      const { renderMarkdown, splitMarkdownForProgressiveRender } = await loadMarkdownModule()
      if (token !== renderToken) return
      const chunks = splitMarkdownForProgressiveRender(source)
      const headingIds = new Map<string, number>()
      if (chunks.length <= 1) {
        const renderedHtml = renderMarkdown(source, {
          codeRunner: props.codeRunner,
          docId: props.docId,
          headingIds,
        })
        if (token !== renderToken) return
        setRenderedHtml(renderedHtml)
        if (!readyEmitted) {
          readyEmitted = true
          emit('ready')
        }
        void bindInteractions(token).then(() => {
          if (token !== renderToken) return
          renderState.value = 'complete'
          bumpHmrSettle()
        })
        return
      }

      // Large documents render progressively in idle slices: the first chunk
      // paints right away and the remaining chunks drain without blocking the
      // main thread, so big articles appear much sooner.
      setRenderedHtml('')
      renderRemainingChunks(chunks, 0, token, renderMarkdown, headingIds, () => {
        void bindInteractions(token).then(() => {
          if (token !== renderToken) return
          renderState.value = 'complete'
        })
      })
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
