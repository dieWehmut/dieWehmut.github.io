<template>
  <div class="bg-root fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
    <div class="bg-video-stage">
      <div class="bg-video-wrap" :class="{ 'is-visible': videoVisible }">
        <video
          ref="videoEl"
          class="bg-video"
          autoplay
          muted
          loop
          playsinline
          webkit-playsinline
          x5-playsinline
          preload="metadata"
        >
          <template v-if="videoStarted">
            <source :src="bgWebm" type="video/webm" />
            <source :src="bgMp4" type="video/mp4" />
          </template>
        </video>
      </div>
      <div class="bg-video-glass"></div>
    </div>
    <div class="bg-base"></div>
    <div class="bg-grid"></div>
    <div class="bg-grid-flow"></div>
    <div class="bg-blur bg-blur--a"></div>
    <div class="bg-blur bg-blur--b"></div>
    <div class="bg-blur bg-blur--c"></div>
    <div class="bg-blur bg-blur--d"></div>
    <div class="bg-orbit bg-orbit--a"></div>
    <div class="bg-orbit bg-orbit--b"></div>
    <div class="bg-ribbon bg-ribbon--a"></div>
    <div class="bg-ribbon bg-ribbon--b"></div>
    <div class="bg-sheen"></div>
    <div class="bg-sparks">
      <span v-for="spark in sparkItems" :key="spark.id" class="bg-spark" :style="spark.style"></span>
    </div>
    <div class="bg-vignette"></div>
    <div class="bg-noise"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import bgMp4 from '../assets/bg/mov/bg.mp4'
import bgWebm from '../assets/bg/mov/bg.webm'

const emit = defineEmits(['ready'])
const videoEl = ref(null)
const videoStarted = ref(false)
const videoVisible = ref(false)

const sparkItems = computed(() => {
  const items = []

  for (let i = 0; i < 26; i += 1) {
    const size = 6 + (i % 5) * 3
    const left = 4 + ((i * 11) % 92)
    const delay = -(i * 1.1)
    const duration = 8.6 + (i % 6) * 1.15
    const drift = ((i % 7) - 3) * 1.6
    const scale = 0.72 + (i % 4) * 0.11

    items.push({
      id: `spark-${i}`,
      style: {
        left: `${left}%`,
        bottom: `${-10 - (i % 5) * 4}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        '--spark-size': size,
        '--spark-drift': `${drift}vw`,
        '--spark-scale': scale,
      },
    })
  }

  return items
})

onMounted(() => {
  const video = videoEl.value
  let readyFired = false

  const markReady = () => {
    if (readyFired) return
    readyFired = true
    videoVisible.value = true
    emit('ready')
  }

  const startVideo = () => {
    if (!video || videoStarted.value) return

    videoStarted.value = true

    requestAnimationFrame(() => {
      try {
        video.load()
      } catch (e) {}

      const onCanPlay = () => {
        window.setTimeout(() => {
          videoVisible.value = true
        }, 100)
      }

      video.addEventListener('canplay', onCanPlay, { once: true })

      try {
        video.play().catch(() => {})
      } catch (e) {}
    })
  }

  requestAnimationFrame(() => {
    window.setTimeout(markReady, 120)
  })

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => startVideo(), { timeout: 1200 })
  } else {
    window.setTimeout(() => startVideo(), 480)
  }
})
</script>
