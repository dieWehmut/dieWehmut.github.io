<template>
  <div class="mobile-layout" :class="{ 'has-open-drawer': drawerOpen || tocDrawerOpen }">
    <MobileHeader @toggle-menu="openDrawer" @toggle-toc="openTocDrawer" />

    <Transition name="drawer-overlay">
      <button
        v-if="drawerOpen || tocDrawerOpen"
        class="mobile-layout__overlay"
        type="button"
        aria-label="Close menu"
        @click="closeDrawers"
      />
    </Transition>

    <aside class="mobile-layout__drawer" :class="{ 'is-open': drawerOpen }" aria-label="Mobile navigation">
      <SiteSidebar @navigate="closeDrawer" />
    </aside>

    <aside class="mobile-layout__toc-drawer" :class="{ 'is-open': tocDrawerOpen }" aria-label="Page timeline">
      <ScrollSpySidebar
        :key="`${route.fullPath}:${tocKey}`"
        class="mobile-layout__toc"
        root-selector=".mobile-layout__main"
        :heading-selector="tocHeadingSelector"
        :offset="72"
        mode="mobile"
        @navigate="closeTocDrawer"
      />
    </aside>

    <main class="mobile-layout__main">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>

    <GiscusComments layout="mobile" />
    <Footer />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, watch, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import MobileHeader from '../components/navigation/MobileHeader.vue'
import SiteSidebar from '../components/navigation/SiteSidebar.vue'
import Footer from '../components/system/Footer.vue'
import GiscusComments from '../components/system/GiscusComments.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'

const route = useRoute()
const drawerOpen = ref(false)
const tocDrawerOpen = ref(false)
const tocKey = ref(0)
const tocHeadingSelector = computed(() => {
  if (route.name === 'capture') return '.capture-time-heading'
  if (['home', 'archive', 'notes', 'tag-detail'].includes(String(route.name || ''))) {
    return '.content-time-heading'
  }
  return 'h1, h2, h3'
})
let previousBodyOverflow = ''

function lockBody() {
  if (typeof document === 'undefined') return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockBody() {
  if (typeof document === 'undefined') return
  document.body.style.overflow = previousBodyOverflow
}

function openDrawer() {
  tocDrawerOpen.value = false
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function openTocDrawer() {
  drawerOpen.value = false
  tocKey.value += 1
  tocDrawerOpen.value = true
}

function closeTocDrawer() {
  tocDrawerOpen.value = false
}

function closeDrawers() {
  closeDrawer()
  closeTocDrawer()
}

function onKeydown(event) {
  if (event.key === 'Escape') closeDrawers()
}

watch([drawerOpen, tocDrawerOpen], ([navOpen, tocOpen]) => {
  const open = navOpen || tocOpen
  if (open) {
    lockBody()
    window.addEventListener('keydown', onKeydown)
  } else {
    unlockBody()
    window.removeEventListener('keydown', onKeydown)
  }
})

watch(() => route.fullPath, closeDrawers)

onBeforeUnmount(() => {
  unlockBody()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.mobile-layout {
  position: relative;
  z-index: 2;
  display: none;
  min-height: 100vh;
  isolation: isolate;
  background:
    var(--site-mesh-line-row),
    var(--site-mesh-line-column),
    radial-gradient(circle at 78% 4%, color-mix(in srgb, var(--site-accent) 8%, transparent), transparent 34%),
    transparent;
  background-size: var(--site-mesh-background-size);
}

:root.dynamic-background-enabled .mobile-layout {
  background:
    var(--site-mesh-line-row),
    var(--site-mesh-line-column),
    transparent;
  background-size: var(--site-mesh-background-size);
}

.mobile-layout.has-open-drawer {
  z-index: 90;
}

.mobile-layout__main {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - var(--site-mobile-header-height));
  padding: 24px 18px 42px;
}

.mobile-layout__overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  border: 0;
  background: rgba(0, 0, 0, 0.58);
}

.mobile-layout__drawer {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 260ms cubic-bezier(.2, .9, .2, 1);
  will-change: transform;
}

.mobile-layout__drawer.is-open {
  transform: translateX(0);
}

.mobile-layout__toc-drawer {
  position: fixed;
  inset: 0 0 0 auto;
  z-index: 100;
  width: clamp(124px, 36vw, 148px);
  min-height: 100%;
  padding: 0;
  color: var(--site-text);
  background: var(--site-sidebar-bg);
  border-left: 1px solid var(--site-border);
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 260ms cubic-bezier(.2, .9, .2, 1);
  will-change: transform;
}

.mobile-layout__toc-drawer.is-open {
  transform: translateX(0);
}

.mobile-layout__toc {
  min-height: 100%;
  padding: 0 10px 22px;
}

.drawer-overlay-enter-active,
.drawer-overlay-leave-active {
  transition: opacity 180ms ease;
}

.drawer-overlay-enter-from,
.drawer-overlay-leave-to {
  opacity: 0;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 900px) {
  .mobile-layout {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-layout__drawer,
  .mobile-layout__toc-drawer,
  .drawer-overlay-enter-active,
  .drawer-overlay-leave-active,
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition-duration: 1ms;
  }
}
</style>
