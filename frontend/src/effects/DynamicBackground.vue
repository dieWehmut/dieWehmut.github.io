<template>
  <div class="bg-root fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div class="bg-base"></div>
    <div class="bg-blur bg-blur--a"></div>
    <div class="bg-blur bg-blur--b"></div>
    <div class="bg-blur bg-blur--c"></div>
    <div class="bg-blur bg-blur--d"></div>
    <div class="bg-ribbon bg-ribbon--a"></div>
    <div class="bg-ribbon bg-ribbon--b"></div>
    <div class="bg-sheen"></div>
    <div class="bg-vignette"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

const emit = defineEmits(['ready'])

onMounted(() => {
  requestAnimationFrame(() => {
    emit('ready')
  })
})
</script>
