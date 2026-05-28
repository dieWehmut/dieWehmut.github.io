<template>
  <div class="mobile-layout">
    <MobileHeader @toggle-menu="openDrawer" />

    <Transition name="drawer-overlay">
      <button
        v-if="drawerOpen"
        class="mobile-layout__overlay"
        type="button"
        aria-label="Close menu"
        @click="closeDrawer"
      />
    </Transition>

    <aside class="mobile-layout__drawer" :class="{ 'is-open': drawerOpen }" aria-label="Mobile navigation">
      <SiteSidebar @navigate="closeDrawer" />
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
import { onBeforeUnmount, watch, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import MobileHeader from '../components/navigation/MobileHeader.vue'
import SiteSidebar from '../components/navigation/SiteSidebar.vue'
import Footer from '../components/system/Footer.vue'
import GiscusComments from '../components/system/GiscusComments.vue'

const route = useRoute()
const drawerOpen = ref(false)
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
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') closeDrawer()
}

watch(drawerOpen, (open) => {
  if (open) {
    lockBody()
    window.addEventListener('keydown', onKeydown)
  } else {
    unlockBody()
    window.removeEventListener('keydown', onKeydown)
  }
})

watch(() => route.fullPath, closeDrawer)

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
}

.mobile-layout__main {
  min-height: calc(100vh - var(--site-mobile-header-height));
  padding: 24px 18px 42px;
}

.mobile-layout__overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  border: 0;
  background: rgba(0, 0, 0, 0.58);
}

.mobile-layout__drawer {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 260ms cubic-bezier(.2, .9, .2, 1);
  will-change: transform;
}

.mobile-layout__drawer.is-open {
  transform: translateX(0);
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
  .drawer-overlay-enter-active,
  .drawer-overlay-leave-active,
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition-duration: 1ms;
  }
}
</style>
