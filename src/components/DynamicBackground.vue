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
      webkit-playsinline
      x5-playsinline
      disablepictureinpicture
      disableremoteplayback
      tabindex="-1"
      preload="none"
      :class="{ visible: videoVisible }"
      aria-hidden="true"
    >
      <template v-if="started">
        <source v-for="s in sources" :key="s.src" :src="s.src" :type="s.type" />
      </template>
    </video>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import bgMp4 from '../assets/bg.mp4'
import bgWebm from '../assets/bg.webm'

// states
const posterSrc = ref('')
const videoVisible = ref(false)
const container = ref(null)
const videoEl = ref(null)
const started = ref(false) // reactive so template can render <source> only when starting
const sources = ref([])
let io = null

function extractFirstFrame(videoUrl) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.playsInline = true
  // 不为临时 video 设置 crossOrigin，避免在同源但未返回 CORS 头时污染 canvas
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
  if (started.value) return

  // 1) try to extract first frame to use as poster (try mp4 first, fallback to webm)
  try {
    let dataUrl = ''
    try {
      dataUrl = await extractFirstFrame(bgMp4)
    } catch (e) {
      // try webm if mp4 extraction fails
      try { dataUrl = await extractFirstFrame(bgWebm) } catch (e2) { dataUrl = '' }
    }
    posterSrc.value = dataUrl
  } catch (e) {
    posterSrc.value = ''
  }

  // 2) attach video sources and begin loading/playing when ready
  const v = videoEl.value
  if (!v) return
  // prepare sources (webm first, then mp4) and render them
  sources.value = []
  if (bgWebm) sources.value.push({ src: bgWebm, type: 'video/webm' })
  if (bgMp4) sources.value.push({ src: bgMp4, type: 'video/mp4' })
  started.value = true
  // set attributes for loading now
  v.preload = 'auto'
  // call load so browser will parse the added <source> elements
  try { v.load() } catch (e) {}

  // Ensure can autoplay: muted + playsinline already set in template
  // But also explicitly set a few runtime flags for better cross-browser behavior
  try {
    v.playsInline = true
    v.setAttribute('webkit-playsinline', '')
    v.setAttribute('x5-playsinline', '')

    v.muted = true
    v.setAttribute('muted', '')

    try { v.disablePictureInPicture = true } catch (e) {}
    v.setAttribute('disablePictureInPicture', '')
    try { v.disableRemotePlayback = true } catch (e) {}
    v.setAttribute('disableRemotePlayback', '')
  } catch (e) {}
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

  // If autoplay is blocked on some browsers despite muted, allow first user interaction to kickstart
  const onUserInteraction = () => {
    try { v.play().catch(() => {}) } catch (err) {}
  }
  document.addEventListener('click', onUserInteraction, { once: true, passive: true })
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
