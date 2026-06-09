<template>
  <span class="markdown-preview">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  source: string
}>()

const text = computed(() => props.source.replace(/\s+/g, ' ').trim())
</script>
