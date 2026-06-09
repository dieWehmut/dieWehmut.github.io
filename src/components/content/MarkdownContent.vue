<template>
  <div ref="containerRef" class="markdown-content" v-html="html" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  source: string
}>()

const containerRef = ref<HTMLElement | null>(null)
const html = ref('')

let cleanup: (() => void) | null = null
let renderToken = 0
let idleHandle: ReturnType<Window['setTimeout']> = 0
let markdownModulePromise: Promise<typeof import('../../utils/markdown')> | null = null

type IdleScheduler = Window & typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
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

function scheduleIdle(callback: () => void) {
  if (typeof window === 'undefined') {
    callback()
    return
  }

  const scheduler = window as IdleScheduler
  if (scheduler.requestIdleCallback) {
    idleHandle = scheduler.requestIdleCallback(callback, { timeout: 700 })
    return
  }

  idleHandle = window.setTimeout(callback, 0)
}

function cancelIdle() {
  if (!idleHandle || typeof window === 'undefined') return
  const scheduler = window as IdleScheduler
  if (scheduler.cancelIdleCallback) {
    scheduler.cancelIdleCallback(idleHandle)
  } else {
    window.clearTimeout(idleHandle)
  }
  idleHandle = 0
}

watch(
  () => props.source,
  (source) => {
    const token = ++renderToken
    html.value = ''
    cleanup?.()
    cleanup = null
    cancelIdle()

    if (!source) return

    scheduleIdle(async () => {
      idleHandle = 0
      const { renderMarkdown } = await loadMarkdownModule()
      const rendered = renderMarkdown(source)
      if (token !== renderToken) return
      html.value = rendered
      await nextTick()
      if (token !== renderToken) return
      bindInteractions(token)
    })
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  renderToken += 1
  cancelIdle()
  cleanup?.()
})
</script>
