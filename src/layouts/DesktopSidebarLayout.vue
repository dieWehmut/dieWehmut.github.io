<template>
  <div
    class="desktop-layout"
    :class="{ 'desktop-layout--console': isConsole }"
    :data-console-mode="isConsole ? 'on' : 'off'"
  >
    <SiteSidebar v-if="!isConsole" class="desktop-layout__sidebar" />
    <div class="desktop-layout__content">
      <ConsoleShell v-if="isConsole" />
      <RouteBreadcrumb v-else />
      <main class="desktop-layout__main">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" :key="routeViewKey(route)" />
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
import ConsoleShell from '../components/console/ConsoleShell.vue'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { isConsole } = useDisplayModePreference()

function routeViewKey(route) {
  return String(route.fullPath || '').split('#')[0]
}
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

.desktop-layout--console {
  --console-font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --console-bg: var(--site-bg);
  --console-surface: color-mix(in srgb, var(--site-bg) 90%, var(--site-text));
  --console-text: var(--site-text);
  --console-muted: color-mix(in srgb, var(--site-text) 70%, transparent);
  --console-dim: color-mix(in srgb, var(--site-text) 44%, transparent);
  --console-accent: var(--site-accent);
  --console-border: color-mix(in srgb, var(--site-text) 18%, transparent);
  --console-border-strong: color-mix(in srgb, var(--site-accent) 48%, var(--site-text));
  --console-selection: color-mix(in srgb, var(--site-accent) 12%, transparent);
}

.desktop-layout--console .desktop-layout__content {
  margin-left: 0;
  background: var(--console-bg);
  background-attachment: initial;
  background-image: none;
}

.desktop-layout--console .desktop-layout__main {
  width: min(
    1180px,
    calc(100vw - 2 * var(--site-desktop-content-gutter))
  );
  max-height: calc(100vh - 236px);
  margin: 0 auto;
  overflow-y: auto;
  padding: 12px 0 58px;
  scrollbar-color: var(--console-border-strong) transparent;
  scrollbar-width: thin;
}

.desktop-layout--console .desktop-layout__main::-webkit-scrollbar {
  width: 8px;
}

.desktop-layout--console .desktop-layout__main::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 0;
  background: var(--console-border-strong);
  background-clip: padding-box;
}

.desktop-layout--console :deep(.giscus-comments),
.desktop-layout--console :deep(.footer) {
  width: min(1180px, calc(100vw - 2 * var(--site-desktop-content-gutter)));
  margin-right: auto;
  margin-left: auto;
}

.desktop-layout--console :deep(.giscus-comments) {
  padding-top: 16px;
  border-top: 1px solid var(--console-border);
  font-family: var(--console-font);
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
  transition: opacity 160ms ease-out, transform 160ms ease-out;
  will-change: opacity, transform;
}

.page-fade-leave-active {
  transition: opacity 60ms ease-in;
  will-change: opacity;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
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

  .desktop-layout--console .desktop-layout__main {
    width: calc(100vw - 2 * var(--site-desktop-content-gutter));
  }
}
</style>
