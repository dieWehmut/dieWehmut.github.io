<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
    <DynamicBackground @ready="onBackgroundReady" />
    <ParticleCanvas />
    <SakuraCanvas />
    <BounceCursor />
    <el-container class="app">
      <el-header class="app__header" height="80px">
        <div class="app__main app__header-inner">
          <div class="app__header-left" v-if="viewMode">
            <img class="app__avatar" :src="avatarUrl" alt="avatar" />
            <span class="app__name">{{ displayName }}</span>
          </div>
          <div class="app__header-center">
            <div class="app__center">
              <SearchBar
                ref="searchBarRef"
                v-model="query"
                @submit="openFirst"
                @clear="onClear"
                :enter-ready="true"
              />
            </div>
          </div>
          <div class="app__header-right" v-if="viewMode">
            <span class="app__commit">{{ t('header.latestCommit') }}: {{ lastUpdated }}</span>
            <a
              class="app__github app__github--icon"
              :href="githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.39-3.37-1.39-.45-1.18-1.11-1.5-1.11-1.5-.9-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0112 7.07c.85 0 1.71.12 2.51.36 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.2 10.2 0 0022 12.26C22 6.58 17.52 2 12 2z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </el-header>

      <SideBar v-if="!isMobile && !viewMode" :enter-ready="true" />

      <div class="content">
        <div class="layout" v-if="!viewMode">
          <el-main>
            <div class="app__center">
              <Home
                ref="homeRef"
                :query="query"
                :enter-ready="true"
              />
            </div>
          </el-main>

          <!-- right column placeholder (if you add a RightBar, place it here) -->
        </div>
        <div class="layout layout--section" v-else>
          <el-main>
            <RouterView v-slot="{ Component, route: r }">
              <Transition :name="'focus-fade'">
                <component :is="Component" :key="r.path" :query="query" />
              </Transition>
            </RouterView>
          </el-main>
        </div>

        <el-footer class="app__footer" height="auto">
          <div class="app__main">
            <Footer />
          </div>
        </el-footer>
      </div>
    <!-- global float button (fixed to viewport bottom-right) -->
    <FloatButton />
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SearchBar from './components/SearchBar.vue'
import DynamicBackground from './components/DynamicBackground.vue'
import ParticleCanvas from './components/ParticleCanvas.vue'
import SakuraCanvas from './components/SakuraCanvas.vue'
import BounceCursor from './components/BounceCursor.vue'
import Home from './components/Home.vue'
import Footer from './components/Footer.vue'
import SideBar from './components/SideBar.vue'
import FloatButton from './components/FloatButton.vue'
import { useProfile } from './composables/useProfile'
import { useViewMode } from './composables/useViewMode'

const { t } = useI18n()
const { viewMode } = useViewMode()
const { avatarUrl, displayName, lastUpdated, githubUrl } = useProfile()
const route = useRoute()
const router = useRouter()

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

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const headerOffset = 90
  const rect = el.getBoundingClientRect()
  const docTop = window.pageYOffset || document.documentElement.scrollTop
  const top = rect.top + docTop - headerOffset
  window.scrollTo({ top, behavior: 'smooth' })
}

function routeToSection(path) {
  const map = {
    '/': 'services',
    '/services': 'services',
    '/pages': 'pages',
    '/games': 'games',
    '/apps': 'apps',
    '/files': 'files',
    '/tools': 'tools',
  }
  return map[path]
}

async function syncRouteToSection(path) {
  if (viewMode.value) return
  const section = routeToSection(path)
  if (!section) return
  scrollRouteEnabled = false // disable observer during programmatic scroll
  try {
    window.dispatchEvent(new CustomEvent('open-section', { detail: section }))
  } catch (e) {}
  await nextTick()
  setTimeout(() => scrollToSection(`section-${section}`), 80)
  setTimeout(() => { scrollRouteEnabled = true }, 600) // re-enable after scroll settles
}

// Scroll-based section detection: auto-update route when scrolling in non-Focus mode
const sectionNames = ['services', 'pages', 'games', 'apps', 'files', 'tools']
let sectionObserver = null
let scrollRouteEnabled = true // disable during programmatic scrolls

function setupSectionObserver() {
  if (sectionObserver) sectionObserver.disconnect()
  if (viewMode.value) return

  const options = {
    root: null,
    rootMargin: '-80px 0px -50% 0px', // trigger when section enters top half of viewport
    threshold: 0,
  }

  sectionObserver = new IntersectionObserver((entries) => {
    if (!scrollRouteEnabled || viewMode.value) return
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id // e.g. "section-services"
        const name = id.replace('section-', '')
        if (sectionNames.includes(name) && route.path !== '/' + name) {
          router.replace('/' + name).catch(() => {})
        }
      }
    }
  }, options)

  nextTick(() => {
    sectionNames.forEach((name) => {
      const el = document.getElementById(`section-${name}`)
      if (el) sectionObserver.observe(el)
    })
  })
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

// intro/background removed: no splash or video fallback logic

function handleMqChange(e) {
  isMobile.value = e.matches
  syncLayoutModeForViewport()
}

function syncLayoutModeForViewport() {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (isMobile.value) {
    // Mobile is always single-column.
    root.classList.add('sidebar-collapsed')
    return
  }

  // Desktop restores the user's saved single/double-column preference.
  try {
    const stored = localStorage.getItem('sidebarCollapsed')
    root.classList.toggle('sidebar-collapsed', stored === '1')
  } catch (e) {
    root.classList.remove('sidebar-collapsed')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalHotkeys)
  if (typeof window !== 'undefined' && window.matchMedia) {
    _mq = window.matchMedia('(max-width: 1000px)')
    isMobile.value = _mq.matches
    syncLayoutModeForViewport()
    try {
      _mq.addEventListener('change', handleMqChange)
    } catch (e) {
      // fallback for older browsers
      _mq.addListener(handleMqChange)
    }
  }
  // Start scroll-based section detection
  if (!viewMode.value) {
    nextTick(() => setupSectionObserver())
  }
})

watch(
  () => route.path,
  (path) => {
    syncRouteToSection(path)
  },
  { immediate: true }
)

watch(viewMode, (enabled) => {
  if (!enabled) {
    syncRouteToSection(route.path)
    nextTick(() => setupSectionObserver())
  } else {
    if (sectionObserver) sectionObserver.disconnect()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalHotkeys)
  if (sectionObserver) sectionObserver.disconnect()
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
  --sidebar-width: 300px;
  --sidebar-left-gap: 32px; /* extra gap between sidebar and main content */
  --sidebar-right-gap: 32px; /* placeholder for a right sidebar if present */
    /* layout padding-top used by sidebar sticky offset to align with main content */
    --layout-padding-top: 20px;
  /* header height (used by sidebar sticky offset) */
  --header-height: 80px;
  min-height: 100vh;
  background: transparent;
  color: #2c2c2c;
  padding-left: 0;
  padding-right: var(--sidebar-right-gap);
}

/* main content wrapper shifted to the right of the fixed sidebar */
.content {
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
}

.view-mode .app__header {
  margin-left: 0;
  width: 100%;
}

.app__footer {
  background: rgba(4, 8, 22, 0.82);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.view-mode .app__footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

/* Smaller footer in Focus mode */
.view-mode .app__footer :deep(.footer) {
  padding: 6px 12px 10px;
}

/* No scroll in Focus mode */
.view-mode .content {
  margin-left: 0;
  width: 100%;
  padding-bottom: 60px;
}

/* Mobile: view-mode footer back to normal flow */
@media (max-width: 1000px) {
  .view-mode .content {
    padding-bottom: 0;
    overflow: auto;
  }
  .view-mode .app__footer {
    position: static;
  }

  /* Hide header side columns on mobile Focus to give search bar full width */
  .view-mode .app__header-left,
  .view-mode .app__header-right {
    display: none;
  }
  .view-mode .app__header-inner {
    gap: 0;
  }
  .view-mode .app__header-center {
    flex: 1;
    padding: 0;
  }
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
  justify-content: flex-start;
  /* Desktop: align header block with content block */
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 2200;
  background: rgba(4, 8, 22, 0.82) !important;
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding-top: 10px;
  padding-bottom: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.app__main {
  width: 100%;
  box-sizing: border-box;
}

.app__header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app__header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.app__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,0.24);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
}

.app__avatar:hover {
  transform: scale(1.15);
  border-color: rgba(40, 255, 252, 0.7);
  box-shadow:
    0 0 20px rgba(40, 255, 252, 0.5),
    0 0 40px rgba(40, 255, 252, 0.25),
    0 0 80px rgba(167, 139, 250, 0.2);
}

.app__name {
  font-weight: 700;
  color: rgba(255,255,255,0.96);
}

.app__header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.app__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 220px;
}

.app__commit {
  font-size: 12px;
  color: rgba(255,255,255,0.86);
}

.app__github {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.95);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  transition: transform 0.16s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.app__github:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.16);
  box-shadow: 0 10px 28px rgba(0,0,0,0.3);
}

  /* inner centered container used by the main column to constrain content width */
  .app__center {
    max-width: 1080px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

.layout {
  /* layout stretches full width of .content (fills to page right) */
  max-width: none;
  margin: 0;
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

/* make header/footer inner container align with main's right edge compensation */
.app__header .app__main,
.app__footer .app__main {
  box-sizing: border-box;
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

  /* On small screens, sidebar becomes part of normal flow so content must not reserve sidebar width */
  .content {
    margin-left: 0 !important;
    width: 100% !important;
  }

  .app__header .app__main,
  .app__footer .app__main {
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
  }

  .app__header {
    margin-left: 0 !important;
    width: 100% !important;
  }

  /* Ensure header's inner center container becomes full-width on small screens */
  .app__header .app__center {
    max-width: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
  }
}
/* When sidebar is collapsed ensure content fills full viewport */
html.sidebar-collapsed .content {
  margin-left: 0 !important;
  width: 100% !important;
}

html.sidebar-collapsed .app__header .app__main,
html.sidebar-collapsed .app__footer .app__main {
  width: 100% !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
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
  .sidebar .name, .sidebar .nav-btn, .sidebar .follow-text,
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
html.sidebar-collapsed .app { padding-left: 0 !important; padding-right: 0 !important; --sidebar-left-gap: 0 !important; --sidebar-right-gap: 0 !important; --sidebar-width: 0 !important; }
html.sidebar-collapsed .app__header { padding-left: 0 !important; padding-right: 0 !important; }

/* Smooth sidebar toggle animation */
.content,
.app__header,
.layout,
.layout .el-main,
.el-main {
  transition: margin-left 0.35s cubic-bezier(.4,0,.2,1),
              width 0.35s cubic-bezier(.4,0,.2,1),
              max-width 0.35s cubic-bezier(.4,0,.2,1),
              padding-left 0.35s cubic-bezier(.4,0,.2,1),
              padding-right 0.35s cubic-bezier(.4,0,.2,1) !important;
}

.sidebar {
  transition: transform 0.35s cubic-bezier(.4,0,.2,1),
              opacity 0.3s ease,
              width 0.35s cubic-bezier(.4,0,.2,1) !important;
}

.sidebar-collapsed .sidebar {
  display: none !important;
  padding-top: 0 !important; padding-bottom: 0 !important; overflow: hidden !important; height: 0 !important;
}
.sidebar-collapsed .sidebar .avatar-container,
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

/* ── View mode transitions ── */
.sidebar, .home, .app__footer, .app__header, .home__card, .layout, .el-main {
  transition: opacity 360ms cubic-bezier(.2,.9,.2,1), transform 360ms cubic-bezier(.2,.9,.2,1);
}

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

/* ── Route transition: smooth fade + slight slide ── */
.focus-fade-enter-active,
.focus-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.focus-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.focus-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Focus mode: hide scrollbar completely on desktop ── */
@media (min-width: 1001px) {
  html.view-mode,
  html.view-mode body {
    overflow: hidden;
    height: 100%;
  }
}

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