<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
        <DynamicBackground @ready="onBackgroundReady" />
    <ParticleCanvas />
        <!-- Entry splash overlay -->
        <IntroSplash v-if="showIntro" :background-ready="backgroundReady" @skip="skipIntro" />
    <el-container class="app">
      <el-header class="app__header" height="80px">
        <SearchBar
          ref="searchBarRef"
          v-model="query"
          @submit="openFirst"
          @clear="onClear"
          :enter-ready="!showIntro"
        />
      </el-header>

      <div class="layout">
  <SideBar v-if="!(isMobile && query.trim())" :enter-ready="!showIntro" />

        <el-main>
          <Home
              ref="homeRef"
              :query="query"
              :enter-ready="!showIntro"
            />
        </el-main>

        <!-- right column placeholder (if you add a RightBar, place it here) -->
      </div>

      <el-footer class="app__footer" height="auto">
        <Footer />
      </el-footer>
    <!-- global float button (fixed to viewport bottom-right) -->
    <FloatButton />
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import DynamicBackground from './components/DynamicBackground.vue'
import ParticleCanvas from './components/ParticleCanvas.vue'
import Home from './components/Home.vue'
import Footer from './components/Footer.vue'
import SideBar from './components/SideBar.vue'
import IntroSplash from './components/IntroSplash.vue'
import FloatButton from './components/FloatButton.vue'

const query = ref('')
const searchBarRef = ref(null)
const homeRef = ref(null)

function focusSearch() {
  searchBarRef.value?.focusInput()
}

function openFirst() {
  homeRef.value?.openFirstResult()
}

function onClear() {
  query.value = ''
}

function handleGlobalHotkeys(e) {
  const isTyping =
    ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) ||
    document.activeElement?.getAttribute('contenteditable') === 'true'

  // / 或 Ctrl+K 聚焦搜索框
  if ((e.key === '/' && !isTyping) || (e.key.toLowerCase() === 'k' && e.ctrlKey)) {
    e.preventDefault()
    focusSearch()
    return
  }

  // (Enter key handling for opening first result removed - no Enter-required behavior)
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalHotkeys)
})

// mobile detection: used to hide sidebar on small screens when searching
const isMobile = ref(false)
let _mq = null

// Intro splash state
const showIntro = ref(true)
function hideIntro() {
  showIntro.value = false
  // clear any pending fallback timer
  try { if (introFallbackTimer) { clearTimeout(introFallbackTimer); introFallbackTimer = null } } catch (e) {}
}
function skipIntro() {
  // allow users to click to skip immediate
  hideIntro()
}

// track whether background signaled ready and provide a max fallback
const backgroundReady = ref(false)
let introFallbackTimer = null

function onBackgroundReady() {
  backgroundReady.value = true
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const exitDelay = prefersReduced ? 120 : 420
  // short delay to allow the background crossfade to settle, then hide
  setTimeout(() => hideIntro(), exitDelay)
  if (introFallbackTimer) { clearTimeout(introFallbackTimer); introFallbackTimer = null }
}

// Max fallback: if background doesn't signal ready in time, hide the splash anyway
onMounted(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const maxWait = prefersReduced ? 800 : 5000
  introFallbackTimer = setTimeout(() => {
    if (!backgroundReady.value) hideIntro()
  }, maxWait)
})

function handleMqChange(e) {
  isMobile.value = e.matches
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalHotkeys)
  if (typeof window !== 'undefined' && window.matchMedia) {
    _mq = window.matchMedia('(max-width: 1000px)')
    isMobile.value = _mq.matches
    try {
      _mq.addEventListener('change', handleMqChange)
    } catch (e) {
      // fallback for older browsers
      _mq.addListener(handleMqChange)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalHotkeys)
  if (_mq) {
    try {
      _mq.removeEventListener('change', handleMqChange)
    } catch (e) {
      _mq.removeListener(handleMqChange)
    }
  }
})
</script>

<style scoped>
.app {
  /* reserve space for left/right fixed sidebars so they don't overlap main content */
  --sidebar-left-gap: 32px; /* left sidebar occupied width + gap */
  --sidebar-right-gap: 32px; /* placeholder for a right sidebar if present */
    /* layout padding-top used by sidebar sticky offset to align with main content */
    --layout-padding-top: 20px;
  /* header height (used by sidebar sticky offset) */
  --header-height: 80px;
  min-height: 100vh;
  background: transparent;
  color: #2c2c2c;
  padding-left: var(--sidebar-left-gap);
  padding-right: var(--sidebar-right-gap);
}

/* Entry splash overlay */
/* intro splash moved into IntroSplash.vue */

/* when overlay is removed, allow CSS transition on opacity for smooth disappearance (handled via v-if -> unmount)
   For users who prefer reduced motion, keep it short and subtle */
@media (prefers-reduced-motion: reduce) {
  .splash-inner { animation-duration: 200ms !important; }
}

.app__header {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 固定在页面顶部，不随滚动移动 */
  position: sticky;
  top: 0;
  z-index: 2200;
  /* 半透明浅色背景以提升头部可读性（仍允许背后视频透出），减轻整体黑色感 */
  background: rgba(0,0,0,0.12) !important;
  backdrop-filter: blur(6px) saturate(1.05);
  border-bottom: 1px solid rgba(255,255,255,0.04) !important;
  padding-top: 10px;
  padding-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.18);
}

.app__main {
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  /* ensure main content stays centered inside the padded area */
  box-sizing: border-box;
}

.layout {
  /* total width roughly = left(320) + main(max 1080) + right(320) */
  max-width: 2000px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 0px;
  width: 100%;
  box-sizing: border-box;
  padding: var(--layout-padding-top, 20px) 0;
}

/* ensure the main column does not add extra left padding so it can sit flush against the sidebar */
.layout .el-main {
  padding-left: 0;
  margin-left: 0;
  /* ensure main column does not introduce top spacing so cards align with sidebar */
  padding-top: 0;
  /* ensure el-main occupies remaining space and has no internal left padding that would create a gap */
  box-sizing: border-box;
  /* pull the main area to the right edge by compensating for the app's right gap */
  padding-right: 0;
  margin-right: calc(-1 * var(--sidebar-right-gap, 32px));
}

/* Responsive: collapse side padding on narrower screens so mobile layout works */
@media (max-width: 1400px) {
  .app {
    --sidebar-left-gap: 220px;
    --sidebar-right-gap: 220px;
  }
}

@media (max-width: 1000px) {
  .app {
    --sidebar-left-gap: 18px;
    --sidebar-right-gap: 18px;
    padding-left: 18px;
    padding-right: 18px;
  }
  /* also make the fixed sidebars collapse/stack via their own CSS (they check window width)
     so the main area can take full width on small devices */

  /* Stack layout vertically on small screens so sidebar doesn't push main content off-screen */
  .layout {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: calc(var(--layout-padding-top, 20px) / 2) 0; /* slightly reduce vertical padding */
  }

  .layout .el-main {
    margin-right: 0; /* remove negative compensation so main occupies full width */
    padding-right: 0;
    padding-left: 0;
  }
}

</style>