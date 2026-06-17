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

function renderRemainingChunks(
  chunks: string[],
  index: number,
  token: number,
  renderMarkdown: typeof import('../../utils/markdown').renderMarkdown
) {
  if (token !== renderToken) return
  if (index >= chunks.length) return

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

    if (!source) {
      setRenderedHtml('')
      return
    }

    // Render the first chunk as soon as the markdown module is ready instead
    // of waiting on an idle gap, so navigating to a doc paints immediately.
    void (async () => {
      const { renderMarkdown, splitMarkdownForProgressiveRender } = await loadMarkdownModule()
      if (token !== renderToken) return
      const chunks = splitMarkdownForProgressiveRender(source)
      const firstChunkHtml = renderMarkdown(chunks[0] || '', {
        codeRunner: props.codeRunner,
        docId: props.docId,
      })
      if (token !== renderToken) return
      setRenderedHtml(firstChunkHtml)
      bindInteractions(token)
      if (chunks.length <= 1) {
        return
      }
      renderRemainingChunks(chunks, 1, token, renderMarkdown)
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
