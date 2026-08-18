<template>
  <aside
    v-if="items.length"
    class="scroll-spy"
    :class="[`scroll-spy--${effectiveMode}`, { 'console-top-row': effectiveMode === 'console' }]"
  >
    <div class="scroll-spy__status">
      <div class="scroll-spy__progress">
        <div class="scroll-spy__bar">
          <span :style="{ height: `${progress}%` }" />
        </div>
        <span class="scroll-spy__percent">{{ displayProgress }}%</span>
      </div>
    </div>
    <nav ref="navRef" class="scroll-spy__nav" aria-label="目录">
      <button
        v-for="item in items"
        :key="item.id"
        :ref="(el) => registerButton(item.id, el)"
        :class="{ 'is-active': item.id === activeId }"
        :style="{ paddingLeft: `${itemPaddingLeft(item)}px` }"
        @click="scrollToHeading(item.id)"
      >
        {{ item.title }}
      </button>
    </nav>
  </aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setReadingPath, useScrollRequests } from '../../composables/useReadingPath'
import {
  canonicalHeadingHash,
  resolveHeading,
  scrollHeadingIntoView,
  waitForHeading,
} from '../../utils/headingNavigation'
import { useDisplayModePreference } from '../../composables/useDisplayModePreference'
import { useConsoleRowNavigation } from '../../composables/useConsoleRowNavigation'
import { moveConsoleSelection } from '../../console/selection'

const props = defineProps({
  rootSelector: { type: String, default: 'body' },
  headingSelector: { type: String, default: 'h2, h3' },
  offset: { type: Number, default: 120 },
  mode: { type: String, default: 'desktop' },
})

const emit = defineEmits(['navigate'])
const scrollRequests = useScrollRequests()
const route = useRoute()
const router = useRouter()

const items = ref([])
const activeId = ref('')
const progress = ref(0)
const navRef = ref(null)
const buttonEls = new Map()

let headings = []
let scrollFrame = 0
let collectFrame = 0
let resizeObserver = null
let mutationObserver = null
let mediaQuery = null
let isEnabled = true
let pendingHashController = null
let hashScrollFrame = 0
let queuedHash = ''
let queuedHashShouldEmit = false
let pendingRequestHash = ''
let handledHash = ''
let handledRequestHash = ''
let ignoredRouteHash = ''
let spyEl = null

function registerButton(id, el) {
  if (el) buttonEls.set(id, el)
  else buttonEls.delete(id)
}

function findRoot() {
  return document.querySelector(props.rootSelector) || document.body
}

function shouldEnable() {
  return effectiveMode.value === 'mobile' || effectiveMode.value === 'console' || !mediaQuery || !mediaQuery.matches
}

function clearHeadings() {
  headings = []
  items.value = []
  activeId.value = ''
  setReadingPath(null)
}

function updateEnabledState() {
  isEnabled = shouldEnable()
  if (!isEnabled) {
    clearHeadings()
    return
  }

  scheduleCollectHeadings()
}

function measureTop(el) {
  return el.getBoundingClientRect().top + window.scrollY
}

function itemPaddingLeft(item) {
  const base = props.mode === 'mobile' ? 8 : 10
  const step = props.mode === 'mobile' ? 8 : 12
  return base + item.indent * step
}

function collectHeadings() {
  if (!isEnabled) return
  const root = findRoot()
  const nodes = Array.from(root.querySelectorAll(props.headingSelector))
  const collected = nodes.map((node, index) => {
    const rawText = (
      node.getAttribute('data-md-heading-title')
      || node.getAttribute('data-scroll-title')
      || node.textContent
      || ''
    ).trim()
    const title = rawText || `Section ${index + 1}`
    let id = node.id
    if (!id) {
      id = `section-${index + 1}`
      node.id = id
    }
    const level = Number(node.tagName.replace('H', '')) || 2
    return { id, title, level, el: node, top: measureTop(node) }
  })

  const minLevel = collected.length
    ? Math.min(...collected.map((item) => item.level))
    : 2

  items.value = collected.map((item) => ({
    id: item.id,
    title: item.title,
    level: item.level,
    indent: Math.max(0, item.level - minLevel),
  }))

  headings = collected
}

function updateProgress() {
  if (!isEnabled) return
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 0) {
    if (progress.value !== 0) progress.value = 0
    return
  }
  const ratio = Math.min(1, Math.max(0, window.scrollY / max))
  const nextProgress = Math.round(ratio * 100)
  if (nextProgress !== progress.value) progress.value = nextProgress
}

function updateActive() {
  if (!isEnabled) return
  if (!headings.length) return
  const threshold = window.scrollY + props.offset
  let current = headings[0]

  for (const item of headings) {
    if (item.top > threshold) break
    current = item
  }

  const nextActiveId = current?.id || ''
  if (nextActiveId !== activeId.value) activeId.value = nextActiveId
  const heading = headings.find((item) => item.id === nextActiveId)
  setReadingPath(
    heading
      ? { activeId: heading.id, title: heading.title, progress: progress.value }
      : null
  )
}

function cancelPendingScroll() {
  pendingHashController?.abort()
  pendingHashController = null
  pendingRequestHash = ''
  if (hashScrollFrame) {
    window.cancelAnimationFrame(hashScrollFrame)
    hashScrollFrame = 0
  }
  queuedHash = ''
  queuedHashShouldEmit = false
}

async function scrollToHash(hash, shouldEmit = false) {
  cancelPendingScroll()
  if (!hash) {
    handledHash = ''
    handledRequestHash = ''
    return
  }

  const controller = new AbortController()
  pendingHashController = controller
  pendingRequestHash = hash
  const root = findRoot()
  const immediate = root ? resolveHeading(root, hash, props.headingSelector) : null
  const target = immediate || await waitForHeading({
    getRoot: findRoot,
    hash,
    selector: props.headingSelector,
    signal: controller.signal,
  })

  if (controller.signal.aborted || !target) {
    if (pendingRequestHash === hash) pendingRequestHash = ''
    return
  }
  pendingHashController = null
  pendingRequestHash = ''

  const canonicalHash = canonicalHeadingHash(target.id)
  handledHash = canonicalHash || hash
  handledRequestHash = hash
  if (canonicalHash && route.hash !== canonicalHash) {
    ignoredRouteHash = canonicalHash
    void router.replace({ hash: canonicalHash }).catch(() => {
      if (ignoredRouteHash === canonicalHash) ignoredRouteHash = ''
    })
  }

  scrollHeadingIntoView(target, props.offset)
  if (shouldEmit) emit('navigate', target.id)
}

function scheduleHashScroll(hash, shouldEmit = false) {
  if (!isEnabled) return
  if (!hash) {
    cancelPendingScroll()
    handledHash = ''
    handledRequestHash = ''
    return
  }
  if (!shouldEmit && (
    pendingRequestHash === hash
    || handledHash === hash
    || handledRequestHash === hash
  )) return
  queuedHash = hash
  queuedHashShouldEmit = queuedHashShouldEmit || shouldEmit
  if (hashScrollFrame) return

  hashScrollFrame = window.requestAnimationFrame(() => {
    hashScrollFrame = 0
    const nextHash = queuedHash
    const nextShouldEmit = queuedHashShouldEmit
    queuedHash = ''
    queuedHashShouldEmit = false
    void scrollToHash(nextHash, nextShouldEmit)
  })
}

function scrollToHeading(id) {
  scheduleHashScroll(canonicalHeadingHash(id), true)
}

/**
 * Left/Right on the console prompt walks this row the way it walks the month
 * strip: one box per press, wrapping at either end. Scrolling to the heading is
 * the whole move — `updateActive()` stays the only writer of `activeId`, so the
 * percentage and the highlight follow the page instead of racing it.
 */
function stepSection(delta) {
  if (!items.value.length) return
  const index = items.value.findIndex((item) => item.id === activeId.value)
  const next = items.value[moveConsoleSelection(index, delta, items.value.length)]
  if (next) scrollToHeading(next.id)
}

useConsoleRowNavigation(stepSection)

function followActive() {
  if (effectiveMode.value === 'console') {
    const button = buttonEls.get(activeId.value)
    const nav = navRef.value
    if (button && nav) {
      const navRect = nav.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      if (buttonRect.left < navRect.left) nav.scrollLeft -= navRect.left - buttonRect.left + 12
      else if (buttonRect.right > navRect.right) nav.scrollLeft += buttonRect.right - navRect.right + 12
    }
    return
  }
  if (props.mode !== 'desktop') return
  const button = buttonEls.get(activeId.value)
  const nav = navRef.value
  if (!button || !nav) return
  const aside = nav.closest('.scroll-spy')
  if (!aside) return

  const asideRect = aside.getBoundingClientRect()
  const btnRect = button.getBoundingClientRect()
  const margin = 24
  if (btnRect.top < asideRect.top + margin) {
    aside.scrollTop -= asideRect.top + margin - btnRect.top
  } else if (btnRect.bottom > asideRect.bottom - margin) {
    aside.scrollTop += btnRect.bottom - (asideRect.bottom - margin)
  }
}

function onSidebarWheel(event) {
  // The console row is stuck to the top of the page, so it sits under the pointer
  // for most of a scroll. Redirecting the wheel into it would trap the page, and
  // the row already follows the active section on its own.
  if (effectiveMode.value === 'console') return
  event.preventDefault()
  window.scrollBy({ top: event.deltaY, behavior: 'auto' })
}

function onScroll() {
  if (!isEnabled) return
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0
    updateProgress()
    updateActive()
    followActive()
  })
}

function scheduleCollectHeadings() {
  if (!isEnabled) return
  if (collectFrame) return
  collectFrame = window.requestAnimationFrame(() => {
    collectFrame = 0
    collectHeadings()
    updateProgress()
    updateActive()
  })
}

function updateNow() {
  updateProgress()
  updateActive()
}

watch(activeId, () => {
  nextTick(followActive)
})

const { isConsole } = useDisplayModePreference()
const effectiveMode = computed(() => isConsole.value ? 'console' : props.mode)

/**
 * Console draws one box per section, so its percentage reports which box is
 * active. The sidebar keeps pixel scroll progress, which is what its vertical
 * bar fills.
 */
const displayProgress = computed(() => {
  if (effectiveMode.value !== 'console') return progress.value
  if (!items.value.length) return 0
  const index = items.value.findIndex((item) => item.id === activeId.value)
  return Math.round(((index < 0 ? 0 : index) + 1) / items.value.length * 100)
})

watch(effectiveMode, () => {
  void nextTick(() => {
    scheduleCollectHeadings()
    updateNow()
  })
})

watch(scrollRequests, (request) => {
  if (request?.id) scrollToHeading(request.id)
})

watch(() => route.hash, (hash) => {
  if (hash && hash === ignoredRouteHash) {
    ignoredRouteHash = ''
    handledHash = hash
    handledRequestHash = hash
    return
  }
  ignoredRouteHash = ''
  handledHash = ''
  handledRequestHash = ''
  scheduleHashScroll(hash)
})

function onResize() {
  scheduleCollectHeadings()
}

function onContentMutation() {
  scheduleCollectHeadings()
  if (route.hash && handledHash !== route.hash && handledRequestHash !== route.hash) {
    scheduleHashScroll(route.hash)
  }
}

onMounted(async () => {
  await nextTick()
  mediaQuery = window.matchMedia('(max-width: 900px)')
  updateEnabledState()
  if (!isEnabled) return

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', updateEnabledState)
  } else {
    mediaQuery.addListener(updateEnabledState)
  }

  collectHeadings()
  updateNow()

  // Redirect sidebar wheel events to page scroll, so scrolling inside the
  // sidebar moves the page content. followActive() keeps the active item
  // visible inside the sidebar as the page moves.
  await nextTick()
  spyEl = navRef.value?.closest('.scroll-spy')
  if (spyEl) {
    spyEl.addEventListener('wheel', onSidebarWheel, { passive: false })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)

  const root = findRoot()
  if (window.ResizeObserver && root) {
    resizeObserver = new ResizeObserver(scheduleCollectHeadings)
    resizeObserver.observe(root)
  }

  if (window.MutationObserver && root) {
    mutationObserver = new MutationObserver(onContentMutation)
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['id', 'data-md-heading-title', 'data-scroll-title'],
    })
  }

  if (route.hash) scheduleHashScroll(route.hash)
})

onBeforeUnmount(() => {
  setReadingPath(null)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  if (collectFrame) window.cancelAnimationFrame(collectFrame)
  cancelPendingScroll()
  if (spyEl) spyEl.removeEventListener('wheel', onSidebarWheel)
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  if (mediaQuery?.removeEventListener) {
    mediaQuery.removeEventListener('change', updateEnabledState)
  } else {
    mediaQuery?.removeListener?.(updateEnabledState)
  }
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.scroll-spy {
  flex-shrink: 0;
  width: var(--site-scroll-spy-width);
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 24px;
  max-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--site-muted);
  font-size: 14px;
  min-width: 0;
  scrollbar-color:
    color-mix(in srgb, var(--site-accent) 58%, transparent)
    color-mix(in srgb, var(--site-accent) 10%, transparent);
}

@media (max-width: 900px) {
  .scroll-spy:not(.scroll-spy--mobile) {
    display: none;
  }
}

.scroll-spy__status {
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  gap: 8px;
  padding: 0 0 12px;
  background: var(--site-sidebar-bg);
  backdrop-filter: blur(10px);
}

.scroll-spy__progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scroll-spy__bar {
  position: relative;
  width: 4px;
  height: 90px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--site-accent) 10%, transparent);
  overflow: hidden;
}

.scroll-spy__bar span {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 999px;
  background: var(--site-accent);
  transition: height 90ms linear;
}

.scroll-spy__percent {
  color: var(--site-text);
  font-size: 18px;
  font-weight: 800;
}

.scroll-spy__nav {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.scroll-spy__nav button {
  all: unset;
  position: relative;
  overflow: hidden;
  display: block;
  width: 100%;
  min-height: 30px;
  text-align: left;
  cursor: pointer;
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  border-left: 2px solid transparent;
  padding: 4px 0 4px 10px;
  transition:
    color 160ms ease,
    border-color 160ms ease,
    padding-left 160ms ease;
  box-sizing: border-box;
  overflow-wrap: anywhere;
}

.scroll-spy__nav button::before {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 18% 50%,
      color-mix(in srgb, var(--site-accent) 16%, transparent),
      transparent 54%
    );
  content: "";
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.scroll-spy__nav button.is-active {
  color: var(--site-text);
  border-left-color: var(--site-accent);
  padding-left: 12px;
}

.scroll-spy__nav button:hover,
.scroll-spy__nav button:focus-visible {
  color: var(--site-text);
  outline: none;
  padding-left: 12px;
}

.scroll-spy__nav button:hover::before,
.scroll-spy__nav button:focus-visible::before,
.scroll-spy__nav button.is-active::before {
  opacity: 1;
}

.scroll-spy--console {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0;
  width: 100%;
  max-height: none;
  overflow: visible;
  padding: 0 0 10px;
}

.scroll-spy--console .scroll-spy__status {
  position: static;
  display: flex;
  align-items: center;
  padding: 0 12px 0 0;
  background: transparent;
  backdrop-filter: none;
}

.scroll-spy--console .scroll-spy__bar {
  display: none;
}

.scroll-spy--console .scroll-spy__percent {
  color: var(--console-accent, var(--site-accent));
  font-size: inherit;
  font-weight: 700;
}

.scroll-spy--console .scroll-spy__nav {
  display: flex;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-spy--console .scroll-spy__nav::-webkit-scrollbar {
  display: none;
}

.scroll-spy--mobile {
  position: static;
  width: 100%;
  max-height: none;
  padding-bottom: 0;
  overflow: visible;
  gap: 10px;
}

.scroll-spy--mobile .scroll-spy__status {
  top: 0;
  margin: 0 -10px;
  padding: 14px 10px 12px;
  border-bottom: 1px solid var(--site-border);
}

.scroll-spy--mobile .scroll-spy__progress {
  justify-content: flex-start;
  gap: 9px;
}

.scroll-spy--mobile .scroll-spy__bar {
  height: 76px;
}

.scroll-spy--mobile .scroll-spy__percent {
  font-size: 14px;
}

.scroll-spy--mobile .scroll-spy__nav {
  gap: 5px;
  padding-top: 6px;
}

.scroll-spy--mobile .scroll-spy__nav button {
  min-height: 30px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

:global([data-theme="light"]) .scroll-spy__bar {
  background: rgba(0, 0, 0, 0.08);
}
</style>
