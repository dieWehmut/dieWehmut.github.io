<template>
  <div ref="container" class="bg-root" aria-hidden="true">
    <img
      v-if="posterSrc"
      :src="posterSrc"
      class="bg-poster"
      :class="{ 'is-hidden': videoVisible }
    "
      alt="background poster"
    />

    <video
      ref="videoEl"
      class="bg-video"
      autoplay
      muted
      loop
      playsinline
      preload="none"
      :class="{ visible: videoVisible }"
      aria-hidden="true"
    ></video>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import bgUrl from '../assets/bg.mp4'

// states
const posterSrc = ref('')
const videoVisible = ref(false)
const container = ref(null)
const videoEl = ref(null)
let io = null
let started = false

function extractFirstFrame(videoUrl) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.playsInline = true
    v.crossOrigin = 'anonymous'
    v.src = videoUrl

    const cleanup = () => {
      v.pause()
      v.src = ''
      v.removeAttribute('src')
    }

    function fail(e) {
      cleanup()
      reject(e)
    }

    v.addEventListener('loadeddata', () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = v.videoWidth || 1920
        canvas.height = v.videoHeight || 1080
        const ctx = canvas.getContext('2d')
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
        const data = canvas.toDataURL('image/jpeg', 0.85)
        cleanup()
        resolve(data)
      } catch (err) {
        fail(err)
      }
    }, { once: true })

    v.addEventListener('error', (e) => fail(e), { once: true })
  })
}

const emit = defineEmits(['ready'])

async function startLoading() {
  if (started) return
  started = true

  // 1) try to extract first frame to use as poster
  try {
    const dataUrl = await extractFirstFrame(bgUrl)
    posterSrc.value = dataUrl
  } catch (e) {
    // fail silently: leave poster empty (CSS fallback will show)
    posterSrc.value = ''
  }

  // 2) attach video src and begin loading/playing when ready
  const v = videoEl.value
  if (!v) return
  // set attributes for loading now
  v.preload = 'auto'
  v.src = bgUrl

  // Ensure can autoplay: muted + playsinline already set in template
  const onCanPlay = () => {
    // crossfade: give poster a little time then show video
    requestAnimationFrame(() => {
      // small timeout to allow paint of poster
      setTimeout(() => {
        videoVisible.value = true
        // notify parent that background is ready
        try { emit('ready') } catch (e) {}
      }, 60)
    })
  }

  v.addEventListener('canplay', onCanPlay, { once: true })
  // fallback in case canplay doesn't fire fast enough
  setTimeout(() => {
    if (!videoVisible.value) videoVisible.value = true
  }, 3000)

  // try to play (browsers allow autoplay only when muted)
  try { v.play().catch(() => {}) } catch (e) {}
}

onMounted(() => {
  // Lazy start: observe container, start when visible in viewport
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          startLoading()
          if (io && container.value) io.unobserve(container.value)
          break
        }
      }
    }, { root: null, threshold: 0 })

    if (container.value) io.observe(container.value)
  } else {
    // no IO -> start immediately but defer to idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => startLoading())
    } else {
      setTimeout(() => startLoading(), 200)
    }
  }
})

onBeforeUnmount(() => {
  if (io && container.value) io.unobserve(container.value)
})
</script>

<style scoped>
.bg-root {
  position: fixed;
  inset: 0;
  z-index: -1; /* keep behind page content */
  pointer-events: none;
  overflow: hidden;
}

.bg-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: translateZ(0);
  transition: opacity 700ms ease, filter 700ms ease;
  opacity: 1;
  filter: blur(0.3px);
}
.bg-poster.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 900ms ease;
  will-change: opacity;
}
.bg-video.visible {
  opacity: 1;
}

/* fallback gradient if poster not available */
.bg-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0f1724 0%, rgba(15,23,36,0.5) 50%, rgba(15,23,36,0.6) 100%);
  z-index: -2;
}

/* ensure background doesn't cover fixed header content visually (you can tweak) */
@media (max-width: 1000px) {
  .bg-root { display: block }
}
</style>
