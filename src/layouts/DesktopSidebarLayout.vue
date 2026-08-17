<template>
  <div
    class="desktop-layout"
    :class="{ 'desktop-layout--console': isConsole }"
    :data-console-mode="isConsole ? 'on' : 'off'"
  >
    <SiteSidebar v-if="!isConsole" class="desktop-layout__sidebar" />
    <div class="desktop-layout__content">
      <RouteBreadcrumb v-if="!isConsole" />
      <ConsoleOverviewHeader v-if="isConsole" />
      <div class="desktop-layout__result">
        <main
          ref="outputRef"
          class="desktop-layout__main"
          :class="{ 'desktop-layout__main--empty': isConsole && route.name === 'root' }"
          data-console-output-start
        >
          <RouterView v-slot="{ Component, route: viewRoute }">
            <Transition name="page-fade" mode="out-in" @after-enter="handleRouteAfterEnter">
              <component :is="Component" :key="routeViewKey(viewRoute)" />
            </Transition>
          </RouterView>
        </main>

        <section
          v-if="isConsole && commentsOpen && commentTarget"
          ref="commentRef"
          class="desktop-layout__comment"
          data-console-comment-start
        >
          <GiscusComments
            explicit
            layout="desktop"
            :source="commentTarget.source"
            :term="commentTarget.term || ''"
          />
        </section>

        <GiscusComments v-if="!isConsole" layout="desktop" />
        <Footer v-if="!isConsole" />
      </div>

      <ConsoleShell v-if="isConsole" class="desktop-layout__command-dock" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ConsoleOverviewHeader from '../components/console/ConsoleOverviewHeader.vue'
import ConsoleShell from '../components/console/ConsoleShell.vue'
import SiteSidebar from '../components/navigation/SiteSidebar.vue'
import Footer from '../components/system/Footer.vue'
import GiscusComments from '../components/system/GiscusComments.vue'
import RouteBreadcrumb from '../components/system/RouteBreadcrumb.vue'
import { useConsoleCommentSession } from '../composables/useConsoleCommentSession'
import { useConsoleOutputReveal } from '../composables/useConsoleOutputReveal'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { isConsole } = useDisplayModePreference()
const { isOpen: commentsOpen, target: commentTarget, close: closeComments } = useConsoleCommentSession()
const { revealRequest } = useConsoleOutputReveal()
const route = useRoute()
const outputRef = ref<HTMLElement | null>(null)
const commentRef = ref<HTMLElement | null>(null)
let pendingRouteReveal = false

function routeViewKey(routeValue: { fullPath?: string }) {
  return String(routeValue.fullPath || '').split('#')[0]
}

function motionBehavior(): ScrollBehavior {
  if (typeof window === 'undefined') return 'auto'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: motionBehavior() })
}

function scrollToAnchor(anchor: HTMLElement | null) {
  if (typeof window === 'undefined' || !anchor) return
  const top = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top)
  window.scrollTo({ top, behavior: motionBehavior() })
}

function afterLayout(callback: () => void) {
  void nextTick(() => {
    if (typeof window === 'undefined') callback()
    else window.requestAnimationFrame(callback)
  })
}

function revealRouteOutput() {
  pendingRouteReveal = false
  if (route.name === 'root') scrollToTop()
  else scrollToAnchor(outputRef.value)
}

function handleRouteAfterEnter() {
  if (isConsole.value && pendingRouteReveal) revealRouteOutput()
}

watch(
  revealRequest,
  (request) => {
    if (!isConsole.value || request.id === 0) return
    if (request.kind === 'root') {
      pendingRouteReveal = false
      afterLayout(scrollToTop)
      return
    }
    if (request.kind === 'comment') {
      afterLayout(() => scrollToAnchor(commentRef.value))
      return
    }

    pendingRouteReveal = true
    afterLayout(revealRouteOutput)
  },
)

watch(
  () => route.path,
  () => {
    if (!isConsole.value) return
    pendingRouteReveal = true
    afterLayout(revealRouteOutput)
  },
)

watch(isConsole, (enabled) => {
  if (!enabled) {
    pendingRouteReveal = false
    closeComments()
    return
  }
  pendingRouteReveal = true
  afterLayout(revealRouteOutput)
})
</script>

<style scoped>
.desktop-layout {
  position: relative;
  z-index: 2;
  min-height: 100vh;
}

.desktop-layout__result {
  display: contents;
}

.desktop-layout__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 10;
}

.desktop-layout__content {
  position: relative;
  min-width: 0;
  min-height: 100vh;
  margin-left: var(--site-sidebar-width);
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
  min-height: 100vh;
}

.desktop-layout--console .desktop-layout__content {
  display: block;
  min-height: 100vh;
  margin-left: 0;
  background: var(--console-bg);
  background-attachment: initial;
  background-image: none;
}

.desktop-layout--console .desktop-layout__result {
  position: relative;
  display: block;
  min-width: 0;
  width: 100%;
  margin: 0;
  padding: 0;
}

.desktop-layout--console .desktop-layout__main {
  width: min(1180px, calc(100vw - 2 * var(--site-desktop-content-gutter)));
  /* Reserve a full viewport so short routes can still scroll their own top to
     the top of the page, which is what the `/` reveal aligns against. */
  min-height: 100vh;
  margin: 0 auto;
  padding: 28px 0 58px;
  overflow: visible;
}

.desktop-layout--console .desktop-layout__main--empty {
  min-height: 0;
  padding: 0;
}

.desktop-layout__comment {
  width: min(1180px, calc(100vw - 2 * var(--site-desktop-content-gutter)));
  margin: 0 auto;
  padding: 18px 0 42px;
  border-top: 1px solid var(--console-border-strong);
}

.desktop-layout__command-dock {
  position: relative;
  z-index: 3;
  min-width: 0;
  width: 100%;
}

.desktop-layout--console :deep(.desktop-layout__comment .giscus-comments) {
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: var(--console-font);
}

.desktop-layout--console .page-fade-enter-active,
.desktop-layout--console .page-fade-leave-active {
  transition: none;
}

:root.dynamic-background-enabled .desktop-layout__content {
  background:
    var(--site-mesh-line-row),
    var(--site-mesh-line-column),
    transparent;
  background-attachment: fixed;
  background-size: var(--site-mesh-background-size);
}

:root.dynamic-background-enabled .desktop-layout--console .desktop-layout__content {
  background: var(--console-bg);
  background-attachment: initial;
  background-image: none;
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

  .desktop-layout--console .desktop-layout__main,
  .desktop-layout__comment {
    width: calc(100vw - 2 * var(--site-desktop-content-gutter));
  }
}
</style>
