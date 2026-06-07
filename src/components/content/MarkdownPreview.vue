<template>
  <span class="markdown-preview" v-html="html" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdownPreview } from '../../utils/markdown'

const props = defineProps<{
  source: string
}>()

const html = computed(() => renderMarkdownPreview(props.source))
</script>
