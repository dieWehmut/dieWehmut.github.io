<template>
  <div class="relative isolate min-h-screen overflow-x-clip text-[#3b4cb8]">
    <DynamicBackground @ready="onBackgroundReady" />
    <SnowCanvas v-if="showSnowCanvas" :density-scale="snowDensityScale" />
    <SakuraCanvas v-if="showHeavyEffects" :density-scale="sakuraDensityScale" />
    <BounceCursor v-if="showHeavyEffects" />
    <IntroSplash v-if="showIntro" :exiting="introExiting" @skip="skipIntro" />

    <div class="relative z-10 min-h-screen flex flex-col" :class="mainContentVisible ? 'main-visible' : 'main-hidden'">
      <header class="sticky top-0 z-[2200] bg-transparent flex-shrink-0">
        <div class="mx-auto w-full max-w-[2000px] px-4 py-1.5 sm:px-6 lg:px-8 max-[640px]:px-0 max-[640px]:py-1">
          <SearchBar
            ref="searchBarRef"
            v-model="query"
            :enter-ready="true"
            @submit="openFirst"
            @clear="onClear"
          />
        </div>
      </header>

      <div class="home-layout mx-auto flex w-full max-w-[2000px] flex-1 items-start gap-4 px-4 py-5 sm:px-6 lg:px-8 max-[1000px]:flex-col max-[640px]:gap-2.5 max-[640px]:px-0 max-[640px]:py-3">
        <SideBar :enter-ready="true" :show-last-updated="showLastUpdatedInSidebar" />

        <main class="content-rail min-w-0 flex-1 max-[640px]:w-full">
          <div class="sections-stack flex flex-col gap-2 max-[640px]:gap-1.5 transition-all duration-500" :class="mainContentVisible ? 'pointer-events-auto' : 'pointer-events-none'">
            <section id="section-pages" v-show="showPagesSection" :class="sectionCardClass" :style="sectionDelayStyle(0)">
              <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('pages')">
                <div :class="sectionToggleInnerClass">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                    <Collection class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                  </span>
                  <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                    <div class="text-base font-semibold tracking-wide text-[#3b4cb8] max-[640px]:text-[13px]">{{ t('nav.pages') }}</div>
                    <div class="text-[13px] text-[#3b4cb8]/55 max-[640px]:text-[11px] mt-[1px]">
                      <template v-if="readExposed(pageListRef?.loading, true)">{{ t('common.loading') }}...</template>
                      <template v-else-if="readExposed(pageListRef?.error, '')">{{ t('error.unable_load') }}</template>
                      <template v-else>
                        {{ t('common.totalFormat', { count: totalPagesCount }) }}
                        <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedPagesCount }) }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <component :is="showPages ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-[#3b4cb8]/45 max-[640px]:h-4 max-[640px]:w-4" />
              </button>

              <transition name="section-toggle">
                <div v-show="showPages" :class="sectionContentClass">
                  <PageList ref="pageListRef" :filter-query="normalizedQuery" />
                </div>
              </transition>
            </section>

            <section id="section-tools" v-show="showToolsSection" :class="sectionCardClass" :style="sectionDelayStyle(1)">
              <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('tools')">
                <div :class="sectionToggleInnerClass">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                    <Cpu class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                  </span>
                  <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                    <div class="text-base font-semibold tracking-wide text-[#3b4cb8] max-[640px]:text-[13px]">{{ t('nav.tools') }}</div>
                    <div class="text-[13px] text-[#3b4cb8]/55 max-[640px]:text-[11px] mt-[1px]">
                      <template v-if="readExposed(toolListRef?.loading, true)">{{ t('common.loading') }}...</template>
                      <template v-else>
                        {{ t('common.totalFormat', { count: totalToolsCount }) }}
                        <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedToolsCount }) }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <component :is="showTools ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-[#3b4cb8]/45 max-[640px]:h-4 max-[640px]:w-4" />
              </button>

              <transition name="section-toggle">
                <div v-show="showTools" :class="sectionContentClass">
                  <ToolList ref="toolListRef" :filter-query="normalizedQuery" />
                </div>
              </transition>
            </section>

            <section id="section-games" v-show="showGamesSection" :class="sectionCardClass" :style="sectionDelayStyle(2)">
              <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('games')">
                <div :class="sectionToggleInnerClass">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                    <Flag class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                  </span>
                  <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                    <div class="text-base font-semibold tracking-wide text-[#3b4cb8] max-[640px]:text-[13px]">{{ t('nav.games') }}</div>
                    <div class="text-[13px] text-[#3b4cb8]/55 max-[640px]:text-[11px] mt-[1px]">
                      <template v-if="readExposed(gameListRef?.loading, true)">{{ t('common.loading') }}...</template>
                      <template v-else>
                        {{ t('common.totalFormat', { count: totalGamesCount }) }}
                        <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedGamesCount }) }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <component :is="showGames ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-[#3b4cb8]/45 max-[640px]:h-4 max-[640px]:w-4" />
              </button>

              <transition name="section-toggle">
                <div v-show="showGames" :class="sectionContentClass">
                  <GameList ref="gameListRef" :filter-query="normalizedQuery" />
                </div>
              </transition>
            </section>

            <section id="section-apps" v-show="showAppsSection" :class="sectionCardClass" :style="sectionDelayStyle(3)">
              <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('apps')">
                <div :class="sectionToggleInnerClass">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                    <Monitor class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                  </span>
                  <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                    <div class="text-base font-semibold tracking-wide text-[#3b4cb8] max-[640px]:text-[13px]">{{ t('nav.apps') }}</div>
                    <div class="text-[13px] text-[#3b4cb8]/55 max-[640px]:text-[11px] mt-[1px]">
                      <template v-if="readExposed(appListRef?.loading, true)">{{ t('common.loading') }}...</template>
                      <template v-else>
                        {{ t('common.totalFormat', { count: totalAppsCount }) }}
                        <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedAppsCount }) }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <component :is="showApps ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-[#3b4cb8]/45 max-[640px]:h-4 max-[640px]:w-4" />
              </button>

              <transition name="section-toggle">
                <div v-show="showApps" :class="sectionContentClass">
                  <AppList ref="appListRef" :filter-query="normalizedQuery" />
                </div>
              </transition>
            </section>

            <section id="section-files" v-show="showFilesSection" :class="sectionCardClass" :style="sectionDelayStyle(4)">
              <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('files')">
                <div :class="sectionToggleInnerClass">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                    <FolderOpened class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                  </span>
                  <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                    <div class="text-base font-semibold tracking-wide text-[#3b4cb8] max-[640px]:text-[13px]">{{ t('nav.files') }}</div>
                    <div class="text-[13px] text-[#3b4cb8]/55 max-[640px]:text-[11px] mt-[1px]">
                      <template v-if="readExposed(fileListRef?.loading, true)">{{ t('common.loading') }}...</template>
                      <template v-else-if="readExposed(fileListRef?.error, '')">{{ t('error.unable_load') }}</template>
                      <template v-else>
                        {{ t('common.totalFormat', { count: totalFilesCount }) }}
                        <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedFilesCount }) }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <component :is="showFiles ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-[#3b4cb8]/45 max-[640px]:h-4 max-[640px]:w-4" />
              </button>

              <transition name="section-toggle">
                <div v-show="showFiles" :class="sectionContentClass">
                  <FileList ref="fileListRef" :filter-query="normalizedQuery" />
                </div>
              </transition>
            </section>

            <section v-if="hasQuery && matchedPagesCount === 0 && filteredGames.length === 0 && filteredApps.length === 0 && matchedFilesCount === 0 && matchedToolsCount === 0" :class="sectionCardClass" :style="sectionDelayStyle(5)">
              <div class="px-4 py-12 text-center sm:px-5 max-[640px]:px-2">
                <div class="text-lg font-semibold text-[#3b4cb8]">No matching content found</div>
                <div class="mt-2 text-sm text-[#3b4cb8]/55">Try a different keyword.</div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <footer v-if="showDeferredUi" ref="footerRef" class="relative z-10 mt-auto flex-shrink-0">
        <Footer :show-last-updated="showLastUpdatedInFooter" />
      </footer>

      <FloatButton v-if="showDeferredUi" />
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, unref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, ArrowUp, Collection, Cpu, Flag, FolderOpened, Monitor } from '@element-plus/icons-vue'
import SearchBar from '../ui/SearchBar.vue'
import DynamicBackground from '../effects/DynamicBackground.vue'
import SideBar from '../layouts/SideBar.vue'
import PageList from '../List/PageList.vue'
import AppList from '../List/AppList.vue'
import GameList from '../List/GameList.vue'
import FileList from '../List/FileList.vue'
import ToolList from '../List/ToolList.vue'
import { useContent } from '../data/content'

import IntroSplash from '../ui/IntroSplash.vue'

const SnowCanvas = defineAsyncComponent(() => import('../effects/SnowCanvas.vue'))
const SakuraCanvas = defineAsyncComponent(() => import('../effects/SakuraCanvas.vue'))
const BounceCursor = defineAsyncComponent(() => import('../effects/BounceCursor.vue'))
const Footer = defineAsyncComponent(() => import('../layouts/Footer.vue'))
const FloatButton = defineAsyncComponent(() => import('../layouts/FloatButton.vue'))

const INTRO_SEEN_KEY = 'nexus:intro-seen'

function getConnectionInfo() {
  if (typeof navigator === 'undefined') {
    return null
  }

  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null
}

function isSlowConnection() {
  const connection = getConnectionInfo()
  const effectiveType = connection?.effectiveType || ''
  return !!connection?.saveData || effectiveType === 'slow-2g' || effectiveType === '2g'
}

function shouldShowIntroInitially() {
  if (typeof window === 'undefined') {
    return false
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || isSlowConnection()) {
    return false
  }

  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

const { t } = useI18n()
const { games, apps } = useContent()

const query = ref('')
const searchBarRef = shallowRef(null)
const pageListRef = shallowRef(null)
const toolListRef = shallowRef(null)
const gameListRef = shallowRef(null)
const appListRef = shallowRef(null)
const fileListRef = shallowRef(null)
const footerRef = shallowRef(null)
const isMobile = ref(false)
const prefersReducedMotion = ref(false)
const footerInView = ref(false)

const showIntro = ref(shouldShowIntroInitially())
const introExiting = ref(false)
const mainContentVisible = ref(!showIntro.value)
const showDeferredUi = ref(!showIntro.value)
const backgroundReady = ref(false)
let introFallbackTimer = null
let introHideTimer = null
let mediaQuery = null
let footerObserver = null

const showPages = ref(true)
const showGames = ref(true)
const showApps = ref(true)
const showFiles = ref(true)
const showTools = ref(true)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const hasQuery = computed(() => normalizedQuery.value.length > 0)
const showSnowCanvas = computed(() => backgroundReady.value && !prefersReducedMotion.value)
const showHeavyEffects = computed(() => showSnowCanvas.value && mainContentVisible.value)
const snowDensityScale = computed(() => (isMobile.value ? 0.05 : 0.12))
const sakuraDensityScale = computed(() => (isMobile.value ? 0.1 : 0.24))
const sectionCardClass = 'section-card overflow-hidden rounded-[28px] border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(180,160,220,0.14)] max-[640px]:rounded-2xl'
const sectionToggleButtonClass = 'flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 max-[640px]:gap-2 max-[640px]:px-2.5 max-[640px]:py-2.5'
const sectionToggleInnerClass = 'flex min-w-0 items-center gap-3 max-[640px]:gap-2'
const sectionContentClass = 'px-4 pb-4 sm:px-5 sm:pb-5 max-[640px]:px-0.5 max-[640px]:pb-2.5'

const gamesAutoLoadEnabled = computed(() => games.value.length > 0 && !!games.value[0]?.autoLoad)
const appsAutoLoadEnabled = computed(() => apps.value.length > 0 && !!apps.value[0]?.autoLoad)

const totalPagesCount = computed(() => readExposed(pageListRef.value?.pagesCount, 0))
const matchedPagesCount = computed(() => readExposed(pageListRef.value?.matchedCount, 0))
const toolItems = computed(() => readExposed(toolListRef.value?.tools, []))
const filteredTools = computed(() => readExposed(toolListRef.value?.displayedTools, []))
const totalToolsCount = computed(() => toolItems.value.length)
const matchedToolsCount = computed(() => filteredTools.value.length)
const filteredGames = computed(() => readExposed(gameListRef.value?.filteredGames, []))
const filteredApps = computed(() => readExposed(appListRef.value?.filteredApps, []))
const totalGamesCount = computed(() => readExposed(gameListRef.value?.games, []).length)
const totalAppsCount = computed(() => readExposed(appListRef.value?.apps, []).length)
const matchedGamesCount = computed(() => filteredGames.value.length)
const matchedAppsCount = computed(() => filteredApps.value.length)
const totalFilesCount = computed(() => readExposed(fileListRef.value?.filesCount, 0))
const matchedFilesCount = computed(() => readExposed(fileListRef.value?.matchedFilesCount, 0))
const showPagesSection = computed(() => !hasQuery.value || matchedPagesCount.value > 0)
const showToolsSection = computed(() => !hasQuery.value || matchedToolsCount.value > 0)
const showGamesSection = computed(() => (!hasQuery.value && gamesAutoLoadEnabled.value) || (hasQuery.value && matchedGamesCount.value > 0))
const showAppsSection = computed(() => (!hasQuery.value && appsAutoLoadEnabled.value) || (hasQuery.value && matchedAppsCount.value > 0))
const showFilesSection = computed(() => !hasQuery.value || matchedFilesCount.value > 0)
const showLastUpdatedInFooter = computed(() => isMobile.value && footerInView.value)
const showLastUpdatedInSidebar = computed(() => !isMobile.value || !footerInView.value)

function readExposed(value, fallback) {
  return value == null ? fallback : unref(value)
}

function sectionDelayStyle(index) {
  return { transitionDelay: showIntro.value ? '0ms' : `${120 + index * 70}ms` }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
  }
}

function toggleSection(name) {
  if (name === 'pages') {
    showPages.value = !showPages.value
    return
  }

  if (name === 'tools') {
    showTools.value = !showTools.value
    return
  }

  if (name === 'games') {
    showGames.value = !showGames.value
    return
  }

  if (name === 'apps') {
    showApps.value = !showApps.value
    return
  }

  if (name === 'files') {
    showFiles.value = !showFiles.value
  }
}

function focusSearch() {
  searchBarRef.value?.focusInput?.()
}

function firstResultUrl() {
  const firstGame = filteredGames.value[0]
  if (firstGame) {
    return firstGame.url || firstGame.html_url || firstGame.repo_url
  }

  const firstApp = filteredApps.value[0]
  if (firstApp) {
    return firstApp.url || firstApp.html_url || firstApp.repo_url
  }

  return ''
}

function openFirst() {
  const url = firstResultUrl()
  if (url) {
    window.open(url, '_blank', 'noopener')
  }
}

function onClear() {
  query.value = ''
}

function hideIntro() {
  showIntro.value = false
  introExiting.value = false
  mainContentVisible.value = true
  showDeferredUi.value = true
  markIntroSeen()
  if (introFallbackTimer) {
    clearTimeout(introFallbackTimer)
    introFallbackTimer = null
  }
  if (introHideTimer) {
    clearTimeout(introHideTimer)
    introHideTimer = null
  }
}

function beginIntroExit(delay = prefersReducedMotion.value ? 180 : 680) {
  if (!showIntro.value) {
    return
  }

  introExiting.value = true
  mainContentVisible.value = true
  showDeferredUi.value = true

  if (introHideTimer) {
    return
  }

  introHideTimer = window.setTimeout(() => {
    hideIntro()
  }, delay)
}

function skipIntro() {
  hideIntro()
}

function onBackgroundReady() {
  backgroundReady.value = true
  if (!showIntro.value) {
    return
  }

  beginIntroExit()
}

function handleGlobalHotkeys(event) {
  const activeElement = document.activeElement
  const isTyping = ['INPUT', 'TEXTAREA'].includes(activeElement?.tagName) || activeElement?.getAttribute('contenteditable') === 'true'

  if ((event.key === '/' && !isTyping) || (event.key.toLowerCase() === 'k' && event.ctrlKey)) {
    event.preventDefault()
    focusSearch()
  }
}

function handleMediaQueryChange(event) {
  isMobile.value = event.matches
}

function handleOpenSection(event) {
  const name = event?.detail
  if (!name) {
    return
  }

  if (name === 'pages') showPages.value = true
  if (name === 'tools') showTools.value = true
  if (name === 'games') showGames.value = true
  if (name === 'apps') showApps.value = true
  if (name === 'files') showFiles.value = true
}

function teardownFooterObserver() {
  if (footerObserver) {
    footerObserver.disconnect()
    footerObserver = null
  }
}

function observeFooterVisibility() {
  teardownFooterObserver()

  if (!footerRef.value || !window.IntersectionObserver) {
    footerInView.value = false
    return
  }

  footerObserver = new window.IntersectionObserver(
    ([entry]) => {
      footerInView.value = !!entry?.isIntersecting
    },
    {
      threshold: 0.08,
    },
  )

  footerObserver.observe(footerRef.value)
}

watch(normalizedQuery, (queryValue) => {
  if (!queryValue) {
    return
  }

  showPages.value = true
  showTools.value = true
  showGames.value = true
  showApps.value = true
  showFiles.value = true
})

watch(showDeferredUi, (visible) => {
  if (!visible) {
    footerInView.value = false
    teardownFooterObserver()
    return
  }

  window.requestAnimationFrame(() => {
    observeFooterVisibility()
  })
})

watch(isMobile, (mobile) => {
  if (!mobile) {
    footerInView.value = false
  }

  window.requestAnimationFrame(() => {
    observeFooterVisibility()
  })
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalHotkeys)
  window.addEventListener('open-section', handleOpenSection)

  prefersReducedMotion.value = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 1000px)')
    isMobile.value = mediaQuery.matches
    try {
      mediaQuery.addEventListener('change', handleMediaQueryChange)
    } catch {
      mediaQuery.addListener(handleMediaQueryChange)
    }
  }

  introFallbackTimer = window.setTimeout(() => {
    if (!backgroundReady.value) {
      beginIntroExit(prefersReducedMotion.value ? 180 : 420)
    }
  }, prefersReducedMotion.value ? 600 : 2200)

  if (!showIntro.value) {
    markIntroSeen()
    showDeferredUi.value = true
  }

  window.requestAnimationFrame(() => {
    observeFooterVisibility()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalHotkeys)
  window.removeEventListener('open-section', handleOpenSection)

  if (mediaQuery) {
    try {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    } catch {
      mediaQuery.removeListener(handleMediaQueryChange)
    }
  }

  if (introFallbackTimer) {
    clearTimeout(introFallbackTimer)
  }

  if (introHideTimer) {
    clearTimeout(introHideTimer)
  }

  teardownFooterObserver()
})
</script>

<style scoped>
.home-layout {
  transition: none;
}

html.sidebar-collapsed .home-layout {
  gap: 0;
}

.content-rail {
  transition: none;
}

.sections-stack {
  transition: none;
}

.section-card {
  contain: layout paint;
  transform-origin: left center;
  transition: none;
  will-change: auto;
}

/* Apply backdrop-filter only on desktop for better performance */
@media (min-width: 1024px) and (hover: hover) {
  .section-card {
    backdrop-filter: blur(12px);
  }
}

@media (min-width: 1001px) {
  html.sidebar-collapsed .content-rail {
    transform: none;
  }

  html.sidebar-collapsed .section-card {
    transform: none;
  }
}

.section-toggle-enter-active,
.section-toggle-leave-active {
  transition: opacity 220ms cubic-bezier(0.4, 0, 0.2, 1), transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
}

.section-toggle-enter-from,
.section-toggle-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.section-toggle-enter-to,
.section-toggle-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.main-hidden {
  opacity: 0;
  pointer-events: none;
}

.main-visible {
  opacity: 1;
  transition: opacity 420ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
