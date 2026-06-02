<template>
  <aside v-if="items.length" class="scroll-spy" :class="`scroll-spy--${mode}`">
    <div class="scroll-spy__status">
      <div class="scroll-spy__progress">
        <div class="scroll-spy__bar">
          <span :style="{ height: `${progress}%` }" />
        </div>
        <span class="scroll-spy__percent">{{ progress }}%</span>
      </div>
    </div>
    <nav class="scroll-spy__nav" aria-label="目录">
      <button
        v-for="item in items"
        :key="item.id"
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
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  rootSelector: { type: String, default: 'body' },
  headingSelector: { type: String, default: 'h2, h3' },
  offset: { type: Number, default: 120 },
  mode: { type: String, default: 'desktop' },
})

const emit = defineEmits(['navigate'])

const items = ref([])
const activeId = ref('')
const progress = ref(0)

let headings = []
let scrollFrame = 0
let collectFrame = 0
let resizeObserver = null
let mediaQuery = null
let isEnabled = true

function findRoot() {
  return document.querySelector(props.rootSelector) || document.body
}

function shouldEnable() {
  return props.mode === 'mobile' || !mediaQuery || !mediaQuery.matches
}

function clearHeadings() {
  headings = []
  items.value = []
  activeId.value = ''
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
    const rawText = (node.getAttribute('data-scroll-title') || node.textContent || '').trim()
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
}

function scrollToHeading(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - props.offset
  window.scrollTo({ top, behavior: 'smooth' })
  emit('navigate', id)
}

function onScroll() {
  if (!isEnabled) return
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0
    updateProgress()
    updateActive()
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

function onResize() {
  scheduleCollectHeadings()
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
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)

  const root = findRoot()
  if (window.ResizeObserver && root) {
    resizeObserver = new ResizeObserver(scheduleCollectHeadings)
    resizeObserver.observe(root)
  }

  // handle initial hash with smooth scroll
  if (window.location.hash) {
    const id = window.location.hash.slice(1)
    const el = document.getElementById(id)
    if (el) {
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - props.offset
        window.scrollTo({ top, behavior: 'smooth' })
      })
    }
  }
})

onBeforeUnmount(() => {
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  if (collectFrame) window.cancelAnimationFrame(collectFrame)
  resizeObserver?.disconnect()
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
  width: 200px;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 24px;
  max-height: 100vh;
  overflow-y: auto;
  color: var(--site-muted);
  min-width: 0;
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
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.scroll-spy__bar span {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 999px;
  background: var(--site-accent);
}

.scroll-spy__percent {
  color: var(--site-text);
  font-size: 18px;
  font-weight: 800;
}

.scroll-spy__nav {
  display: grid;
  gap: 6px;
}

.scroll-spy__nav button {
  all: unset;
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 600;
  border-left: 2px solid transparent;
  padding: 4px 0 4px 10px;
  transition: color 160ms ease, border-color 160ms ease;
  box-sizing: border-box;
}

.scroll-spy__nav button.is-active {
  color: var(--site-text);
  border-left-color: var(--site-accent);
}

.scroll-spy__nav button:hover,
.scroll-spy__nav button:focus-visible {
  color: var(--site-text);
  outline: none;
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
