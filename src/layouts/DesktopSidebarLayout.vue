<template>
  <div
    class="desktop-layout"
    :class="{ 'desktop-layout--console': isConsole }"
    :data-console-mode="isConsole ? 'on' : 'off'"
  >
    <SiteSidebar v-if="!isConsole" class="desktop-layout__sidebar" :inert="sidebarCollapsed" />
    <div class="desktop-layout__content">
      <RouteBreadcrumb v-if="!isConsole" />
      <ConsoleOverviewHeader v-if="isConsole" />
      <div
        class="desktop-layout__result"
        :class="{ 'desktop-layout__result--empty': isConsole && route.name === 'root' }"
      >
        <main
          ref="outputRef"
          class="desktop-layout__main"
          data-console-output-start
        >
          <RouterView v-slot="{ Component, route: viewRoute }">
            <Transition name="page-fade" mode="out-in" @after-enter="handleRouteAfterEnter">
              <component :is="Component" :key="routeViewKey(viewRoute)" />
            </Transition>
          </RouterView>
        </main>

        <section
          v-if="isConsole && commentTarget"
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
import { useSidebarPreference } from '../composables/useSidebarPreference'

const { isConsole } = useDisplayModePreference()
const { sidebarCollapsed } = useSidebarPreference()
const { target: commentTarget } = useConsoleCommentSession()
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

/**
 * Giscus builds its editor inside a cross-origin iframe on an idle callback, so
 * the frame can still be missing right after a navigation and the page can only
 * ever hand focus to the frame itself, not to the textarea inside it. Retry for
 * a bounded while, and stop if the user has navigated on in the meantime.
 */
function focusCommentFrame(routePath: string, attempt = 0) {
  if (typeof window === 'undefined' || route.fullPath !== routePath) return
  const frame = commentRef.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (frame) {
    frame.focus()
    return
  }
  if (attempt >= 20) return
  window.setTimeout(() => focusCommentFrame(routePath, attempt + 1), 100)
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
      afterLayout(() => {
        scrollToAnchor(commentRef.value)
        focusCommentFrame(route.fullPath)
      })
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
  /* One duration and one curve for the whole column swap, so the sidebar's slide,
     the content's reflow and the breadcrumb's shift read as a single gesture. */
  --sidebar-swap-duration: 340ms;
  --sidebar-swap-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --sidebar-row-duration: 220ms;
}

.desktop-layout__result {
  display: contents;
}

.desktop-layout__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 10;
  /* The panel stays mounted and simply travels: nothing to build on the way in,
     and the browser can keep the whole slide on the compositor. `visibility`
     switches with no duration so it only takes effect once the panel has left,
     which is what keeps the offscreen links out of the tab order. */
  transition:
    transform var(--sidebar-swap-duration) var(--sidebar-swap-ease),
    visibility 0s linear 0s;
}

html.sidebar-collapsed .desktop-layout__sidebar {
  transform: translateX(-100%);
  visibility: hidden;
  transition:
    transform var(--sidebar-swap-duration) var(--sidebar-swap-ease),
    visibility 0s linear var(--sidebar-swap-duration);
}

/* Expanding deals the panel's own rows back in one after another. They ride a
   transition rather than keyframes so nothing animates on first paint, and the
   stagger is spent only on the way in — collapsing takes them out with the panel
   instead of unwinding the queue backwards. */
.desktop-layout__sidebar :deep(.site-sidebar__avatar-link),
.desktop-layout__sidebar :deep(.site-sidebar__identity),
.desktop-layout__sidebar :deep(.nav-menu__item) {
  transition:
    opacity var(--sidebar-row-duration) var(--sidebar-swap-ease) var(--sidebar-row-delay, 0ms),
    transform var(--sidebar-row-duration) var(--sidebar-swap-ease) var(--sidebar-row-delay, 0ms);
}

html.sidebar-collapsed .desktop-layout__sidebar :deep(.site-sidebar__avatar-link),
html.sidebar-collapsed .desktop-layout__sidebar :deep(.site-sidebar__identity),
html.sidebar-collapsed .desktop-layout__sidebar :deep(.nav-menu__item) {
  opacity: 0;
  transform: translateX(-14px);
  transition-delay: 0ms;
}

.desktop-layout__sidebar :deep(.site-sidebar__avatar-link) { --sidebar-row-delay: 40ms; }
.desktop-layout__sidebar :deep(.site-sidebar__identity) { --sidebar-row-delay: 70ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(1)) { --sidebar-row-delay: 100ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(2)) { --sidebar-row-delay: 118ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(3)) { --sidebar-row-delay: 136ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(4)) { --sidebar-row-delay: 154ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(5)) { --sidebar-row-delay: 172ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(6)) { --sidebar-row-delay: 190ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(7)) { --sidebar-row-delay: 208ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(8)) { --sidebar-row-delay: 226ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(9)) { --sidebar-row-delay: 244ms; }
.desktop-layout__sidebar :deep(.nav-menu__item:nth-child(10)) { --sidebar-row-delay: 262ms; }

.desktop-layout__content {
  position: relative;
  min-width: 0;
  min-height: 100vh;
  margin-left: var(--site-sidebar-width);
  display: flex;
  flex-direction: column;
  isolation: isolate;
  /* `margin-left` resolves to a plain length even though it comes from a custom
     property, so the browser interpolates it on its own — the token can flip to 0
     instantly and the column still glides. No `@property` registration needed. */
  transition: margin-left var(--sidebar-swap-duration) var(--sidebar-swap-ease);
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
  /* The command input should read as the page's own paper rather than a raised
     panel. Light themes keep it flush with the background; dark themes still
     need the lift, since no rule is left to outline the field. */
  --console-canvas: var(--console-surface);
  --console-text: var(--site-text);
  --console-muted: color-mix(in srgb, var(--site-text) 70%, transparent);
  --console-dim: color-mix(in srgb, var(--site-text) 44%, transparent);
  --console-accent: var(--site-accent);
  /* The console draws no rules. Every frame line in console mode resolves
     through these two tokens, so keeping them invisible retires the lines in
     one place while the 1px they occupy keeps the spacing rhythm intact. */
  --console-border: transparent;
  --console-border-strong: transparent;
  --console-selection: color-mix(in srgb, var(--site-accent) 12%, transparent);
  /* One edge for every square console thumbnail — friend avatars, capture
     thumbnails, the "+n more" tile. Their scale is a single number here rather
     than one literal per view, so a fork can retune all of them at once. */
  --console-thumb: 88px;
  /* With the frame rules retired a control can no longer be outlined, so a
     tinted fill carries the affordance instead and hover deepens it. */
  --console-control: color-mix(in srgb, var(--site-accent) 10%, transparent);
  --console-control-strong: color-mix(in srgb, var(--site-accent) 24%, transparent);
  /* The air an output block leaves under itself: the seam before the comments on a
     route that has them, before the prompt on a route that does not. One number so
     a fork retunes the console's vertical rhythm in a single place. */
  --console-block-tail: 14px;
  /* How tall a page's top row stands. The row is stuck to the top of the viewport,
     so this is also how far a box below it must hold clear when it scrolls itself
     into view — otherwise the keyboard cursor lands underneath the row. */
  --console-top-row-height: 54px;
  min-height: 100vh;
}

html[data-theme='light'] .desktop-layout--console {
  --console-canvas: var(--console-bg);
}

.desktop-layout--console .desktop-layout__content {
  display: block;
  min-height: 100vh;
  margin-left: 0;
  background: var(--console-bg);
  background-attachment: initial;
  background-image: none;
  /* The console swap is a shell change, not a column change: it lands at once,
     the way its page transitions already do. */
  transition: none;
}

.desktop-layout--console .desktop-layout__result {
  position: relative;
  display: block;
  min-width: 0;
  width: 100%;
  /* Reserve a full viewport for the output block as a whole, so short routes can
     still scroll their own top to the top of the page — which is what the `/`
     reveal aligns against. Reserving it on the route output alone would spend the
     slack between that output and its comments instead of after them. */
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

/* The root route prints nothing above the prompt, so it needs neither the reserve
   nor the padding that would hold the prompt away from an empty box. */
.desktop-layout--console .desktop-layout__result--empty {
  min-height: 0;
}

.desktop-layout--console .desktop-layout__result--empty .desktop-layout__main {
  padding: 0;
}

.desktop-layout--console .desktop-layout__main {
  width: min(1180px, calc(100vw - 2 * var(--site-desktop-content-gutter)));
  margin: 0 auto;
  padding: 28px 0 var(--console-block-tail);
  overflow: visible;
}

.desktop-layout__comment {
  width: min(1180px, calc(100vw - 2 * var(--site-desktop-content-gutter)));
  margin: 0 auto;
  padding: 0 0 var(--console-block-tail);
  border-top: 1px solid var(--console-border-strong);
}

.desktop-layout__command-dock {
  position: relative;
  z-index: 3;
  min-width: 0;
  width: 100%;
}

/* While option rows are open the dock rides the bottom edge of the viewport,
   with the last row flush against it and the prompt above. Sticky rather than
   fixed so the dock keeps its box in the flow: opening the rows cannot change
   the document height, and therefore cannot move the page's scroll offset. */
.desktop-layout--console .desktop-layout__command-dock.console-shell--expanded {
  position: sticky;
  bottom: 0;
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
  transition: width var(--sidebar-swap-duration) var(--sidebar-swap-ease);
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
  .desktop-layout {
    --sidebar-swap-duration: 1ms;
    --sidebar-row-duration: 1ms;
  }

  .desktop-layout__content,
  .desktop-layout__main {
    transition: none;
  }

  .desktop-layout__sidebar :deep(.site-sidebar__avatar-link),
  .desktop-layout__sidebar :deep(.site-sidebar__identity),
  .desktop-layout__sidebar :deep(.nav-menu__item) {
    transition: none;
    --sidebar-row-delay: 0ms;
  }

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
