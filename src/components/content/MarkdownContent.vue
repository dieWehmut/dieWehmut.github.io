<template>
  <div ref="containerRef" class="markdown-content" v-html="html" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { bindMarkdownInteractions, renderMarkdown } from '../../utils/markdown'

const props = defineProps<{
  source: string
}>()

const containerRef = ref<HTMLElement | null>(null)
const html = computed(() => renderMarkdown(props.source))

let cleanup: (() => void) | null = null

function bindInteractions() {
  cleanup?.()
  cleanup = bindMarkdownInteractions(containerRef.value)
}

watch(html, () => {
  queueMicrotask(bindInteractions)
})

onMounted(() => {
  bindInteractions()
})

onBeforeUnmount(() => {
  cleanup?.()
})
</script>
