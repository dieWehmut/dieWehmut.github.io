<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
        <DynamicBackground @ready="onBackgroundReady" />
    <ParticleCanvas />
    <SakuraCanvas />
    <BounceCursor />
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
import SakuraCanvas from './components/SakuraCanvas.vue'
import BounceCursor from './components/BounceCursor.vue'
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

<!-- ═══════════════════════════════════════════════════════════════════════
     Global styles (migrated from src/assets/global.scss)
     Non-scoped so they apply globally across all components.
     ═══════════════════════════════════════════════════════════════════════ -->
<style>
/* ── Root Variables & Reset ── */
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light;
  --primary-color: #409eff;
  --secondary-color: #666;
  --border-color: #e8e8e8;
  --bg-light: #fafafa;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; font-family: system-ui, Avenir, Helvetica, Arial, sans-serif; font-weight: 500; line-height: 1.6; }
a { color: #409eff; text-decoration: none; transition: color 0.3s ease; }
a:hover { color: #66b1ff; }
html { scroll-behavior: smooth; }

/* ── Unified action button styles for cards ── */
.action-btn,
.copy-btn,
.repo-button,
.link-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  min-height: 36px;
  border-radius: 10px;
  text-decoration: none;
  color: #333 !important;
  background: #fff;
  border: 1px solid var(--border-color);
  font-size: 14px;
  transition: all 0.12s ease;
}
.action-btn .el-icon, .copy-btn .el-icon, .repo-button .el-icon, .link-button .el-icon,
.action-btn > svg, .copy-btn > svg, .repo-button > svg, .link-button > svg {
  width: 18px; height: 18px; fill: #2b2b2b !important;
}
.action-btn svg, .action-btn .el-icon, .action-btn .el-icon svg,
.copy-btn svg, .copy-btn .el-icon, .copy-btn .el-icon svg {
  fill: #2b2b2b !important; stroke: #2b2b2b !important; color: #2b2b2b !important;
}
.item__actions a.action-btn, .item__actions a.repo-button, .item__actions a.link-button,
.game-item__actions a.action-btn, .game-item__actions a.repo-button, .game-item__actions a.link-button,
.app-item__actions a.action-btn, .app-item__actions a.repo-button, .app-item__actions a.link-button,
.file-item__actions a.action-btn, .file-item__actions a.repo-button,
.file-item__header .repo-link.action-btn, .file-item__header a.repo-button, .file-item__header a.link-button,
a.action-btn {
  color: #333 !important; text-decoration: none !important;
}
.action-btn:hover, .copy-btn:hover, .repo-button:hover, .link-button:hover {
  background: transparent; border-color: transparent; transform: translateY(-1px) scale(1.01);
}
.action-text, .btn-text { font-weight: 600; font-size: 14px; }
.item__actions, .game-item__actions, .app-item__actions, .file-list__actions {
  display: flex; gap: 12px; align-items: center;
}

/* ── Repo-link overrides ── */
.repo-link, .repo-link.action-btn, .game-item__actions .repo-link,
.file-item__header .repo-link, .item__actions .repo-link, a.repo-link,
[class*="repo-link"], [class*="repo-link"][data-v-] {
  display: inline-flex !important; align-items: center !important; gap: 8px !important;
  padding: 8px 12px !important; min-height: 36px !important; border-radius: 10px !important;
  background: transparent !important; background-color: transparent !important;
  color: #333 !important; border: 1px solid rgba(232,232,232,0) !important;
  font-size: 14px !important; font-weight: 600 !important; text-decoration: none !important;
  align-self: center !important; height: auto !important; vertical-align: middle !important; line-height: 1.2 !important;
}
.repo-link .el-icon, .repo-link svg, .repo-link .icon, .repo-link .action-icon {
  width: 18px !important; height: 18px !important; fill: currentColor !important; stroke: currentColor !important; color: inherit !important;
}
.repo-link:hover, .repo-link.action-btn:hover, .game-item__actions .repo-link:hover, .file-item__header .repo-link:hover {
  background: transparent !important; border-color: transparent !important; transform: none !important;
}

/* ── Card / item transparency ── */
.game-item, .app-item, .page-item, .file-item, .card, .page-card, .item-card { color: #111417 !important; }
.game-item *, .app-item *, .page-item *, .file-item *, .card *, .page-card *, .item-card * { color: inherit !important; }

.version-tag, .item .version-tag, .game-item .version-tag, .page-item .version-tag,
.file-item .version-tag, .version-info .version-tag {
  background: transparent !important; border-color: transparent !important; color: inherit !important;
  font-weight: 600 !important; border-radius: 8px !important; font-size: 11px !important; padding: 2px 8px !important;
}

.game-item, .app-item, .page-item, .file-item, .card, .page-card, .item-card,
.file-item__header, .item-card > .card-body, .app-item__actions, .file-item__actions {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.repo-link, .action-btn, .copy-btn { background: transparent !important; border: none !important; }

@media (max-width: 1000px) {
  .game-item, .app-item, .page-item, .file-item, .card, .page-card, .item-card {
    background: transparent !important; border: none !important;
  }
}

/* ── Transparency overrides ── */
.app-item, .game-item, .page-item, .file-item, .card, .page-card, .item-card,
.file-item__content, .item, .app-item__actions, .game-item__actions, .file-list__item,
.sidebar {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.action-btn, .repo-link, .repo-link.action-btn,
.game-item__actions a.repo-button, .game-item__actions a.link-button,
.app-item__actions a.repo-button, .app-item__actions a.link-button,
.file-item__actions .repo-link, .repo-link[data-v-08e32229] {
  background: transparent !important; border: none !important;
}
.search-input :deep(.el-input__wrapper), .search-input :deep(.el-input__inner) {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.el-card, .el-card__body, .home__card, .home__card .el-card__body, .el-card .el-card__body {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.home__card, .home__card *, .home__card .el-card__header, .home__card .el-card__body,
.home__card .el-card__content, .home__card .card-header, .home__card .card-header-left {
  background: transparent !important; background-color: transparent !important; border: none !important; box-shadow: none !important;
}
.github-card, .github-card * { background: transparent !important; }

/* ── Sidebar readability ── */
.sidebar { color: #ffffff !important; }
.sidebar .name, .sidebar .nav-btn, .sidebar .follow-text, .sidebar .bio,
.sidebar .about-content, .sidebar .meta-item, .sidebar .email-link {
  color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
}
.sidebar .icon, .sidebar svg {
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.6)); color: #ffffff !important; fill: #ffffff !important;
}
.github-btn { color: #ffffff !important; border: 1px solid rgba(255,255,255,0.12) !important; }

/* ── Single-column / collapsed-sidebar layout ── */
html.sidebar-collapsed .home {
  margin-left: auto !important; margin-right: auto !important;
  width: min(960px, 92vw) !important; max-width: 960px !important;
  padding-left: 0 !important; padding-right: 0 !important;
}
html.sidebar-collapsed .home__card { width: 100% !important; max-width: none !important; }
@media (max-width: 1000px) {
  html.sidebar-collapsed .home { width: 100% !important; padding-left: 12px !important; padding-right: 12px !important; max-width: none !important; }
}
html.sidebar-collapsed .layout { justify-content: center !important; }
html.sidebar-collapsed .layout .el-main {
  margin-right: 0 !important; margin-left: 0 !important; padding-left: 0 !important; padding-right: 0 !important;
  width: min(960px, 92vw) !important; max-width: 960px !important;
}
html.sidebar-collapsed .app { padding-left: 0 !important; padding-right: 0 !important; --sidebar-left-gap: 0 !important; --sidebar-right-gap: 0 !important; }
html.sidebar-collapsed .app__header { padding-left: 0 !important; padding-right: 0 !important; }

.sidebar-collapsed .sidebar {
  display: block !important; padding-top: 6px !important; padding-bottom: 6px !important; overflow: hidden !important; height: auto !important;
}
.sidebar-collapsed .sidebar .avatar-container,
.sidebar-collapsed .sidebar .about-content .bio,
.sidebar-collapsed .sidebar .about-content .contact,
.sidebar-collapsed .sidebar .nav-list, .sidebar-collapsed .sidebar .contact-meta,
.sidebar-collapsed .sidebar .follow-row, .sidebar-collapsed .sidebar .github-btn { display: none !important; }
.sidebar-collapsed .sidebar .about-content { padding: 0 8px !important; }
.sidebar-collapsed .sidebar .name { margin: 0 !important; font-size: 20px !important; line-height: 1 !important; }
.sidebar-collapsed .layout { justify-content: center !important; }
.sidebar-collapsed .layout .el-main {
  margin-left: 0 !important; margin-right: 0 !important; max-width: 1080px; width: 100%; box-sizing: border-box;
  transform: translateX(0); transition: transform 220ms ease;
}
.layout { transition: justify-content 220ms ease; }

/* ── Tools row override ── */
.tools-list .tool-row, .tools-list[data-v] .tool-row {
  background: rgba(0,0,0,0.30) !important; border-radius: 10px !important;
  transition: transform 0.14s ease, box-shadow 0.18s ease, color 0.12s ease !important;
  will-change: transform, box-shadow !important; cursor: pointer !important; color: #ffffff !important;
}
@media (hover: hover) {
  .tools-list .tool-row:hover, .tools-list[data-v] .tool-row:hover {
    background: transparent !important; transform: translateY(-4px) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.22) !important;
  }
}
.tools-list .tool-row .single-title, .tools-list .tool-row .page-icon, .tools-list .tool-row .action-icon {
  color: #ffffff !important; fill: #ffffff !important;
}
.tools-list .tool-row .action-btn, .tools-list .tool-row .action-btn .btn-text {
  background: transparent !important; border: none !important; color: #ffffff !important;
}

/* ── Clean mode ── */
.sidebar, .home, .app__footer, .app__header, .home__card, .layout, .el-main {
  transition: opacity 360ms cubic-bezier(.2,.9,.2,1), transform 360ms cubic-bezier(.2,.9,.2,1);
  will-change: opacity, transform;
}
.clean-mode .sidebar, .clean-mode .home, .clean-mode .app__footer, .clean-mode .app__header,
.clean-mode .home__card, .clean-mode .layout, .clean-mode .el-main {
  opacity: 0 !important; transform: translateY(10px) !important; pointer-events: none !important;
}
.clean-mode .float-container { display: block !important; visibility: visible !important; pointer-events: auto !important; }
.clean-mode body, .clean-mode html { height: 100%; }

/* ── Legibility over dynamic backgrounds ── */
body, .home, .home *, .card, .home__card, .item, .game-item, .app-item, .page-item, .file-item,
.repo-link, .action-text, .btn-text, .page-title, .card-header, .github-body {
  color: #ffffff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.7) !important;
}
.home__card, .item, .game-item, .app-item, .page-item, .file-item, .card, .page-card, .item-card {
  background: rgba(0,0,0,0.30) !important; border-radius: 10px !important;
  padding: 10px !important; border: 1px solid rgba(255,255,255,0.03) !important;
}
.action-btn, .repo-link, .copy-btn, .link-button {
  background: rgba(255,255,255,0.06) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.06) !important;
}
.repo-link .el-icon, .action-btn .el-icon, .game-item .el-icon, .app-item .el-icon {
  fill: rgba(255,255,255,0.95) !important; color: rgba(255,255,255,0.95) !important;
}
.home, .home * { color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.55) !important; }
.home .card-header span, .home .page-title, .game-name, .app-name, .file-name-text, .single-title {
  color: #ffffff !important; font-weight: 700 !important; text-shadow: 0 1px 3px rgba(0,0,0,0.65) !important;
}
.home .version-info, .home .date, .home .single-date, .home .activity-text, .sidebar .meta-item span {
  color: rgba(255,255,255,0.85) !important;
}
.repo-link, .action-btn, .copy-btn {
  color: #ffffff !important; border: 1px solid rgba(255,255,255,0.08) !important;
}
.back-to-top { background-color: rgba(0,0,0,0.5) !important; border-color: rgba(0,0,0,0.5) !important; }

/* ── Hover/focus affordance ── */
.action-btn, .repo-link, .repo-button, .link-button, .copy-btn, .nav-btn, .github-btn, .el-button[type="text"] {
  transition: transform 0.12s ease, box-shadow 0.18s ease, color 0.12s ease;
}
.action-btn:hover, .repo-link:hover, .repo-button:hover, .link-button:hover, .copy-btn:hover, .github-btn:hover {
  transform: translateY(-3px) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.35) !important; color: #ffffff !important;
}
.nav-btn:hover {
  transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,0,0,0.28) !important;
  background: transparent !important; color: #ffffff !important;
}
.action-btn:focus, .repo-link:focus, .repo-button:focus, .link-button:focus,
.nav-btn:focus, .github-btn:focus, .el-button:focus {
  outline: none !important; box-shadow: 0 0 0 4px rgba(64,158,255,0.12) !important;
}

/* ── Copy notification ── */
.el-message.bw-message { background: #0b0b0b !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.06) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important; }
.el-message.bw-message .el-message__content { color: #ffffff !important; }
.el-message.bw-message .el-message__icon svg, .el-message.bw-message .el-message__icon i { fill: #ffffff !important; color: #ffffff !important; }
</style>