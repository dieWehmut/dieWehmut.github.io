<template>
  <div class="desktop-layout">
    <SiteSidebar class="desktop-layout__sidebar" />
    <div class="desktop-layout__content">
      <RouteBreadcrumb />
      <main class="desktop-layout__main">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
      <GiscusComments layout="desktop" />
      <Footer />
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import SiteSidebar from '../components/navigation/SiteSidebar.vue'
import Footer from '../components/system/Footer.vue'
import GiscusComments from '../components/system/GiscusComments.vue'
import RouteBreadcrumb from '../components/system/RouteBreadcrumb.vue'
</script>

<style scoped>
.desktop-layout {
  position: relative;
  z-index: 2;
  min-height: 100vh;
}

.desktop-layout__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 10;
}

.desktop-layout__content {
  position: relative;
  min-width: 0;
  margin-left: var(--site-sidebar-width);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  isolation: isolate;
  background:
    var(--site-mesh-line-row),
    var(--site-mesh-line-column),
    radial-gradient(circle at 76% 7%, color-mix(in srgb, var(--site-accent) 8%, transparent), transparent 32%),
    transparent;
  background-attachment: fixed;
  background-size: var(--site-mesh-background-size);
}

:root.dynamic-background-enabled .desktop-layout__content {
  background:
    var(--site-mesh-line-row),
    var(--site-mesh-line-column),
    transparent;
  background-attachment: fixed;
  background-size: var(--site-mesh-background-size);
}

.desktop-layout__main {
  position: relative;
  z-index: 1;
  flex: 1;
  width: min(
    var(--site-content-width),
    calc(100vw - var(--site-sidebar-width) - var(--site-desktop-content-gutter) - var(--site-desktop-content-end-gutter))
  );
  margin: 0 auto 0 var(--site-desktop-content-gutter);
  padding: 46px 0 54px;
}

/* 快速淡出 + 平滑淡入，enter 用 ease-out 减速落位，leave 只淡出不位移，避免上滑跳动 */
.page-fade-enter-active {
  transition: opacity 220ms ease-out, transform 220ms ease-out;
  will-change: opacity, transform;
}

.page-fade-leave-active {
  transition: opacity 110ms ease-in;
  will-change: opacity;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition-duration: 1ms;
  }
  .page-fade-enter-from {
    transform: none;
  }
}

@media (max-width: 900px) {
  .desktop-layout {
    display: none;
  }
}

@media (min-width: 901px) and (max-width: 1100px) {
  .desktop-layout__main {
    width: calc(
      100vw - var(--site-sidebar-width) - var(--site-desktop-content-gutter) - var(--site-desktop-content-end-gutter)
    );
  }
}
</style>
