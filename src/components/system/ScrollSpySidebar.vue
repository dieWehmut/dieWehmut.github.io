<template>
  <aside v-if="items.length" class="scroll-spy">
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
        :style="{ paddingLeft: `${10 + item.indent * 12}px` }"
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
})

const items = ref([])
const activeId = ref('')
const progress = ref(0)

let headings = []

function collectHeadings() {
  const root = document.querySelector(props.rootSelector) || document.body
  const nodes = Array.from(root.querySelectorAll(props.headingSelector))
  const collected = nodes.map((node, index) => {
    const rawText = (node.textContent || '').trim()
    const title = rawText || `Section ${index + 1}`
    let id = node.id
    if (!id) {
      id = `section-${index + 1}`
      node.id = id
    }
    const level = Number(node.tagName.replace('H', '')) || 2
    return { id, title, level, el: node }
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
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 0) {
    progress.value = 0
    return
  }
  const ratio = Math.min(1, Math.max(0, window.scrollY / max))
  progress.value = Math.round(ratio * 100)
}

function updateActive() {
  if (!headings.length) return
  const threshold = window.scrollY + props.offset
  let current = headings[0]

  for (const item of headings) {
    const top = item.el.getBoundingClientRect().top + window.scrollY
    if (top <= threshold) current = item
  }

  activeId.value = current?.id || ''
}

function scrollToHeading(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - props.offset
  window.scrollTo({ top, behavior: 'smooth' })
}

function onScroll() {
  updateProgress()
  updateActive()
}

function onResize() {
  collectHeadings()
  onScroll()
}

onMounted(async () => {
  await nextTick()
  collectHeadings()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)

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
  .scroll-spy {
    display: none;
  }
}

.scroll-spy__status {
  display: grid;
  gap: 8px;
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

:global([data-theme="light"]) .scroll-spy__bar {
  background: rgba(0, 0, 0, 0.08);
}
</style>
