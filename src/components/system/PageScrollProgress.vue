<template>
  <div class="page-scroll-progress" aria-hidden="true">
    <span :style="{ width: `${progress}%` }" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const progress = ref(0)
let frame = 0

function updateProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0
  progress.value = Math.min(100, Math.max(0, ratio * 100))
}

function onScroll() {
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    updateProgress()
  })
}

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onBeforeUnmount(() => {
  if (frame) window.cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
.page-scroll-progress {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 120;
  height: 3px;
  background: color-mix(in srgb, var(--site-accent) 10%, transparent);
  pointer-events: none;
}

.page-scroll-progress span {
  display: block;
  width: 0;
  height: 100%;
  background: var(--site-accent);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--site-accent) 72%, var(--site-bg)),
    var(--site-accent)
  );
  box-shadow: 0 0 10px color-mix(in srgb, var(--site-accent) 28%, transparent);
  transition: width 90ms linear;
}
</style>
