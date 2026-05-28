<template>
  <section v-if="shouldRender && (hasConfig || showConfigHint)" class="giscus-comments" aria-label="Comments">
    <p v-if="!hasConfig" class="giscus-comments__empty">
      Configure VITE_GISCUS_* to enable GitHub comments.
    </p>

    <div v-else ref="containerRef" :key="renderKey" class="giscus-comments__container"></div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  layout: {
    type: String,
    default: 'desktop',
  },
})

const route = useRoute()
const containerRef = ref(null)
const renderKey = ref(0)
const isActiveLayout = ref(false)
const currentTheme = ref('dark')
const excludedRouteNames = new Set(['search', 'not-found'])
const showConfigHint = import.meta.env.DEV

let mediaQuery = null
let themeObserver = null
let renderedRoute = ''

const config = {
  repo: import.meta.env.VITE_GISCUS_REPO || '',
  repoId: import.meta.env.VITE_GISCUS_REPO_ID || '',
  category: import.meta.env.VITE_GISCUS_CATEGORY || '',
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID || '',
  mapping: import.meta.env.VITE_GISCUS_MAPPING || 'pathname',
  strict: import.meta.env.VITE_GISCUS_STRICT || '0',
  reactionsEnabled: import.meta.env.VITE_GISCUS_REACTIONS_ENABLED || '1',
  inputPosition: import.meta.env.VITE_GISCUS_INPUT_POSITION || 'bottom',
  theme: import.meta.env.VITE_GISCUS_THEME || 'nexus',
  lang: import.meta.env.VITE_GISCUS_LANG || 'zh-CN',
}

const hasConfig = computed(() =>
  Boolean(config.repo && config.repoId && config.category && config.categoryId)
)

const shouldRender = computed(() =>
  isActiveLayout.value && !excludedRouteNames.has(String(route.name || ''))
)

const routeTerm = computed(() => {
  const name = String(route.name || 'route')
  const path = route.path === '/' ? 'home' : route.path.replace(/^\/+/, '').replace(/\/+$/g, '')
  return `route:${name}:${path || 'home'}`
})

function updateActiveLayout() {
  if (!mediaQuery) return
  isActiveLayout.value = props.layout === 'mobile' ? mediaQuery.matches : !mediaQuery.matches
}

function clearContainer() {
  const container = containerRef.value
  if (container) container.innerHTML = ''
}

function readSiteTheme() {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function updateCurrentTheme() {
  currentTheme.value = readSiteTheme()
}

function resolveTheme(theme) {
  if (theme === 'nexus') {
    const themeFile = currentTheme.value === 'light' ? 'giscus-nexus-light.css' : 'giscus-nexus.css'
    return new URL(`${import.meta.env.BASE_URL}${themeFile}`, window.location.origin).toString()
  }

  return theme
}

function syncGiscusTheme() {
  const iframe = containerRef.value?.querySelector('iframe.giscus-frame')
  if (!iframe?.contentWindow) return

  iframe.contentWindow.postMessage(
    {
      giscus: {
        setConfig: {
          theme: resolveTheme(config.theme),
        },
      },
    },
    'https://giscus.app'
  )
}

async function renderGiscus() {
  if (!shouldRender.value || !hasConfig.value) {
    clearContainer()
    renderedRoute = ''
    return
  }

  await nextTick()

  const container = containerRef.value
  if (!container || renderedRoute === route.fullPath) return

  container.innerHTML = ''
  renderedRoute = route.fullPath

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', config.repo)
  script.setAttribute('data-repo-id', config.repoId)
  script.setAttribute('data-category', config.category)
  script.setAttribute('data-category-id', config.categoryId)
  script.setAttribute('data-mapping', config.mapping)
  script.setAttribute('data-strict', config.strict)
  script.setAttribute('data-reactions-enabled', config.reactionsEnabled)
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', config.inputPosition)
  script.setAttribute('data-theme', resolveTheme(config.theme))
  script.setAttribute('data-lang', config.lang)
  script.setAttribute('data-loading', 'lazy')

  if (config.mapping === 'specific') {
    script.setAttribute('data-term', routeTerm.value)
  }

  container.appendChild(script)
}

function resetAndRender() {
  renderKey.value += 1
  renderedRoute = ''
  renderGiscus()
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 900px)')
  updateCurrentTheme()
  themeObserver = new MutationObserver(updateCurrentTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  updateActiveLayout()

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', updateActiveLayout)
  } else {
    mediaQuery.addListener(updateActiveLayout)
  }

  renderGiscus()
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()

  if (!mediaQuery) return

  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', updateActiveLayout)
  } else {
    mediaQuery.removeListener(updateActiveLayout)
  }
})

watch(() => route.fullPath, resetAndRender)
watch(shouldRender, resetAndRender)
watch(currentTheme, () => {
  if (config.theme === 'nexus') syncGiscusTheme()
})
</script>

<style scoped>
.giscus-comments {
  width: min(var(--site-content-width), calc(100vw - var(--site-sidebar-width) - 96px));
  margin: 0 auto;
  padding: 0 0 24px;
  color: var(--site-text);
}

.giscus-comments__header {
  margin-bottom: 14px;
  padding-top: 18px;
  border-top: 1px solid var(--site-border);
}

.giscus-comments__header > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
}

.giscus-comments__header span,
.giscus-comments__header small {
  display: block;
}

.giscus-comments__header span {
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.giscus-comments__header small,
.giscus-comments__empty {
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 800;
}

.giscus-comments__header small {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.giscus-comments__empty {
  margin: 0;
  padding: 14px 0 4px;
}

.giscus-comments__container {
  min-width: 0;
}

.giscus-comments__container :deep(.giscus),
.giscus-comments__container :deep(.giscus-frame) {
  width: 100%;
}

@media (min-width: 901px) and (max-width: 1100px) {
  .giscus-comments {
    width: calc(100vw - var(--site-sidebar-width) - 44px);
  }
}

@media (max-width: 900px) {
  .giscus-comments {
    width: auto;
    margin: 0 18px;
    padding-bottom: 18px;
  }

  .giscus-comments__header span {
    font-size: 24px;
  }

  .giscus-comments__header > div {
    display: block;
  }

  .giscus-comments__header small {
    margin-top: 5px;
    text-align: left;
  }
}
</style>
