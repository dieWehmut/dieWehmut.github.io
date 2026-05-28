<template>
  <div class="desktop-layout">
    <SiteSidebar class="desktop-layout__sidebar" />
    <div class="desktop-layout__content">
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
  min-width: 0;
  margin-left: var(--site-sidebar-width);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.desktop-layout__main {
  flex: 1;
  width: min(var(--site-content-width), calc(100vw - var(--site-sidebar-width) - 96px));
  margin: 0 auto;
  padding: 46px 0 54px;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 900px) {
  .desktop-layout {
    display: none;
  }
}

@media (min-width: 901px) and (max-width: 1100px) {
  .desktop-layout__main {
    width: calc(100vw - var(--site-sidebar-width) - 44px);
  }
}
</style>
