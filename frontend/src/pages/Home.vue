<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
    <div class="relative min-h-screen overflow-x-clip text-white">
      <DynamicBackground @ready="onBackgroundReady" />
      <ParticleCanvas v-if="showParticleCanvas" />
      <SakuraCanvas v-if="showHeavyEffects" />
      <BounceCursor v-if="showHeavyEffects" />
      <IntroSplash v-if="showIntro" :background-ready="backgroundReady" @skip="skipIntro" />

      <div class="relative z-10 min-h-screen flex flex-col">
        <header class="sticky top-0 z-[2200] border-b border-white/8 bg-black/15 backdrop-blur-md flex-shrink-0">
          <div class="mx-auto w-full max-w-[2000px] px-4 py-1.5 sm:px-6 lg:px-8 max-[640px]:px-0 max-[640px]:py-1">
            <SearchBar
              ref="searchBarRef"
              v-model="query"
              :enter-ready="!showIntro"
              @submit="openFirst"
              @clear="onClear"
            />
          </div>
        </header>

        <div class="mx-auto flex w-full max-w-[2000px] flex-1 items-start gap-4 px-4 py-5 sm:px-6 lg:px-8 max-[1000px]:flex-col max-[640px]:gap-2.5 max-[640px]:px-0 max-[640px]:py-3">
          <SideBar v-if="!(isMobile && query.trim())" :enter-ready="!showIntro" />

          <main class="min-w-0 flex-1 max-[640px]:w-full">
            <div class="flex flex-col gap-2 max-[640px]:gap-1.5 transition-all duration-500" :class="showIntro ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'">
              <section id="section-pages" v-if="!hasQuery || matchedPagesCount > 0" :class="sectionCardClass" :style="sectionDelayStyle(0)">
                <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('pages')">
                  <div :class="sectionToggleInnerClass">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                      <Collection class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                    </span>
                    <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                      <div class="text-base font-semibold tracking-wide text-white max-[640px]:text-[13px]">{{ t('nav.pages') }}</div>
                      <div class="text-[13px] text-white/60 max-[640px]:text-[11px] mt-[1px]">
                        <template v-if="readExposed(pagesAutoLoaderRef?.loading, false)">{{ t('common.loading') }}...</template>
                        <template v-else-if="readExposed(pagesAutoLoaderRef?.error, '')">{{ t('error.unable_load') }}</template>
                        <template v-else>
                          {{ t('common.totalFormat', { count: totalPagesCount }) }}
                          <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedPagesCount }) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <component :is="showPages ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-white/70 max-[640px]:h-4 max-[640px]:w-4" />
                </button>

                <transition name="section-toggle">
                  <div v-show="showPages" :class="sectionContentClass">
                    <PagesAutoLoader v-if="activatedSections.pages" ref="pagesAutoLoaderRef" :filter-query="normalizedQuery" />
                  </div>
                </transition>
              </section>

              <section id="section-tools" v-if="!hasQuery || matchedToolsCount > 0" :class="sectionCardClass" :style="sectionDelayStyle(1)">
                <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('tools')">
                  <div :class="sectionToggleInnerClass">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                      <Cpu class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                    </span>
                    <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                      <div class="text-base font-semibold tracking-wide text-white max-[640px]:text-[13px]">{{ t('nav.tools') }}</div>
                      <div class="text-[13px] text-white/60 max-[640px]:text-[11px] mt-[1px]">
                        <template v-if="!activatedSections.tools">{{ t('common.loading') }}...</template>
                        <template v-else>
                          {{ t('common.totalFormat', { count: totalToolsCount }) }}
                          <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedToolsCount }) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <component :is="showTools ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-white/70 max-[640px]:h-4 max-[640px]:w-4" />
                </button>

                <transition name="section-toggle">
                  <div v-show="showTools" :class="sectionContentClass">
                    <ToolsAutoLoader v-if="activatedSections.tools" ref="toolsRef" :filter-query="normalizedQuery" />
                  </div>
                </transition>
              </section>

              <section id="section-games" v-if="(!hasQuery && gamesAutoLoadEnabled) || (hasQuery && filteredGames.length > 0)" :class="sectionCardClass" :style="sectionDelayStyle(2)">
                <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('games')">
                  <div :class="sectionToggleInnerClass">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                      <Flag class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                    </span>
                    <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                      <div class="text-base font-semibold tracking-wide text-white max-[640px]:text-[13px]">{{ t('nav.games') }}</div>
                      <div class="text-[13px] text-white/60 max-[640px]:text-[11px] mt-[1px]">
                        <template v-if="!activatedSections.games">{{ t('common.loading') }}...</template>
                        <template v-else>
                          {{ t('common.totalFormat', { count: totalGamesCount }) }}
                          <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedGamesCount }) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <component :is="showGames ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-white/70 max-[640px]:h-4 max-[640px]:w-4" />
                </button>

                <transition name="section-toggle">
                  <div v-show="showGames" :class="sectionContentClass">
                    <ReleasesAutoLoader v-if="activatedSections.games" ref="gamesReleasesRef" type="games" :filter-query="normalizedQuery" />
                  </div>
                </transition>
              </section>

              <section id="section-apps" v-if="(!hasQuery && appsAutoLoadEnabled) || (hasQuery && filteredApps.length > 0)" :class="sectionCardClass" :style="sectionDelayStyle(3)">
                <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('apps')">
                  <div :class="sectionToggleInnerClass">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                      <Monitor class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                    </span>
                    <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                      <div class="text-base font-semibold tracking-wide text-white max-[640px]:text-[13px]">{{ t('nav.apps') }}</div>
                      <div class="text-[13px] text-white/60 max-[640px]:text-[11px] mt-[1px]">
                        <template v-if="!activatedSections.apps">{{ t('common.loading') }}...</template>
                        <template v-else>
                          {{ t('common.totalFormat', { count: totalAppsCount }) }}
                          <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedAppsCount }) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <component :is="showApps ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-white/70 max-[640px]:h-4 max-[640px]:w-4" />
                </button>

                <transition name="section-toggle">
                  <div v-show="showApps" :class="sectionContentClass">
                    <ReleasesAutoLoader v-if="activatedSections.apps" ref="appsReleasesRef" type="apps" :filter-query="normalizedQuery" />
                  </div>
                </transition>
              </section>

              <section id="section-files" v-if="!hasQuery || matchedFilesCount > 0" :class="sectionCardClass" :style="sectionDelayStyle(4)">
                <button type="button" :class="sectionToggleButtonClass" @click="toggleSection('files')">
                  <div :class="sectionToggleInnerClass">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                      <FolderOpened class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
                    </span>
                    <div class="min-w-0 flex flex-1 items-center gap-2.5 max-[640px]:gap-2">
                      <div class="text-base font-semibold tracking-wide text-white max-[640px]:text-[13px]">{{ t('nav.files') }}</div>
                      <div class="text-[13px] text-white/60 max-[640px]:text-[11px] mt-[1px]">
                        <template v-if="!activatedSections.files || readExposed(filesRef?.loading, false)">{{ t('common.loading') }}...</template>
                        <template v-else-if="readExposed(filesRef?.error, '')">{{ t('error.unable_load') }}</template>
                        <template v-else>
                          {{ t('common.totalFormat', { count: totalFilesCount }) }}
                          <span v-if="hasQuery">, {{ t('common.matchedFormat', { count: matchedFilesCount }) }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <component :is="showFiles ? ArrowUp : ArrowDown" class="h-5 w-5 shrink-0 text-white/70 max-[640px]:h-4 max-[640px]:w-4" />
                </button>

                <transition name="section-toggle">
                  <div v-show="showFiles" :class="sectionContentClass">
                    <FilesAutoLoader v-if="activatedSections.files" ref="filesRef" :filter-query="normalizedQuery" />
                  </div>
                </transition>
              </section>

              <section v-if="hasQuery && matchedPagesCount === 0 && filteredGames.length === 0 && filteredApps.length === 0 && matchedFilesCount === 0 && matchedToolsCount === 0" :class="sectionCardClass" :style="sectionDelayStyle(5)">
                <div class="px-4 py-12 text-center sm:px-5 max-[640px]:px-2">
                  <div class="text-lg font-semibold text-white">No matching content found</div>
                  <div class="mt-2 text-sm text-white/60">Try a different keyword.</div>
                </div>
              </section>
            </div>
          </main>
        </div>

        <footer class="relative z-10 mt-auto flex-shrink-0">
          <Footer />
        </footer>

        <FloatButton />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref, unref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, ArrowUp, Collection, Cpu, Flag, FolderOpened, Monitor } from '@element-plus/icons-vue'
const SearchBar = defineAsyncComponent(() => import('../ui/SearchBar.vue'))
const DynamicBackground = defineAsyncComponent(() => import('../effects/DynamicBackground.vue'))
const ParticleCanvas = defineAsyncComponent(() => import('../effects/ParticleCanvas.vue'))
const SakuraCanvas = defineAsyncComponent(() => import('../effects/SakuraCanvas.vue'))
const BounceCursor = defineAsyncComponent(() => import('../effects/BounceCursor.vue'))
const Footer = defineAsyncComponent(() => import('../layouts/Footer.vue'))
const SideBar = defineAsyncComponent(() => import('../layouts/SideBar.vue'))
const IntroSplash = defineAsyncComponent(() => import('../ui/IntroSplash.vue'))
const FloatButton = defineAsyncComponent(() => import('../layouts/FloatButton.vue'))
const PagesAutoLoader = defineAsyncComponent(() => import('../loaders/PagesAutoLoader.vue'))
const ReleasesAutoLoader = defineAsyncComponent(() => import('../loaders/ReleasesAutoLoader.vue'))
const FilesAutoLoader = defineAsyncComponent(() => import('../loaders/FilesAutoLoader.vue'))
const ToolsAutoLoader = defineAsyncComponent(() => import('../loaders/ToolsAutoLoader.vue'))
import { useContent } from '../data/content'

const { t } = useI18n()
const { games, apps } = useContent()

const query = ref('')
const searchBarRef = ref(null)
const pagesAutoLoaderRef = ref(null)
const toolsRef = ref(null)
const gamesReleasesRef = ref(null)
const appsReleasesRef = ref(null)
const filesRef = ref(null)
const isMobile = ref(false)
const prefersReducedMotion = ref(false)
const deferredActivationTimers = []

const showIntro = ref(true)
const backgroundReady = ref(false)
let introFallbackTimer = null
let mediaQuery = null

const showPages = ref(true)
const showGames = ref(true)
const showApps = ref(true)
const showFiles = ref(true)
const showTools = ref(true)
const activatedSections = reactive({
  pages: true,
  tools: false,
  games: false,
  apps: false,
  files: false,
})

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const hasQuery = computed(() => normalizedQuery.value.length > 0)
const showParticleCanvas = computed(() => backgroundReady.value && !prefersReducedMotion.value && !isMobile.value)
const showHeavyEffects = computed(() => showParticleCanvas.value && !showIntro.value)
const sectionCardClass = 'overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-md transition duration-500 max-[640px]:rounded-2xl'
const sectionToggleButtonClass = 'flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 max-[640px]:gap-2 max-[640px]:px-2.5 max-[640px]:py-2.5'
const sectionToggleInnerClass = 'flex min-w-0 items-center gap-3 max-[640px]:gap-2'
const sectionContentClass = 'px-4 pb-4 sm:px-5 sm:pb-5 max-[640px]:px-0.5 max-[640px]:pb-2.5'

const gamesAutoLoadEnabled = computed(() => games.value.length > 0 && !!games.value[0]?.autoLoad)
const appsAutoLoadEnabled = computed(() => apps.value.length > 0 && !!apps.value[0]?.autoLoad)

const totalPagesCount = computed(() => readExposed(pagesAutoLoaderRef.value?.pagesCount, 0))
const matchedPagesCount = computed(() => readExposed(pagesAutoLoaderRef.value?.matchedCount, 0))
const toolItems = computed(() => readExposed(toolsRef.value?.tools, []))
const filteredTools = computed(() => readExposed(toolsRef.value?.displayedTools, []))
const totalToolsCount = computed(() => toolItems.value.length)
const matchedToolsCount = computed(() => filteredTools.value.length)
const filteredGames = computed(() => readExposed(gamesReleasesRef.value?.filteredGames, []))
const filteredApps = computed(() => readExposed(appsReleasesRef.value?.filteredApps, []))
const totalGamesCount = computed(() => readExposed(gamesReleasesRef.value?.games, []).length)
const totalAppsCount = computed(() => readExposed(appsReleasesRef.value?.apps, []).length)
const matchedGamesCount = computed(() => filteredGames.value.length)
const matchedAppsCount = computed(() => filteredApps.value.length)
const totalFilesCount = computed(() => readExposed(filesRef.value?.filesCount, 0))
const matchedFilesCount = computed(() => readExposed(filesRef.value?.matchedFilesCount, 0))

function readExposed(value, fallback) {
  return value == null ? fallback : unref(value)
}

function sectionDelayStyle(index) {
  return { transitionDelay: showIntro.value ? '0ms' : `${120 + index * 70}ms` }
}

function activateSection(name) {
  if (name in activatedSections) {
    activatedSections[name] = true
  }
}

function queueSectionActivation(name, delay) {
  const timer = window.setTimeout(() => activateSection(name), delay)
  deferredActivationTimers.push(timer)
}

function toggleSection(name) {
  if (name === 'pages') {
    activateSection('pages')
    showPages.value = !showPages.value
    return
  }

  if (name === 'tools') {
    activateSection('tools')
    showTools.value = !showTools.value
    return
  }

  if (name === 'games') {
    activateSection('games')
    showGames.value = !showGames.value
    return
  }

  if (name === 'apps') {
    activateSection('apps')
    showApps.value = !showApps.value
    return
  }

  if (name === 'files') {
    activateSection('files')
    showFiles.value = !showFiles.value
  }
}

function activateAllSections() {
  activateSection('pages')
  activateSection('tools')
  activateSection('games')
  activateSection('apps')
  activateSection('files')
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
  if (introFallbackTimer) {
    clearTimeout(introFallbackTimer)
    introFallbackTimer = null
  }
}

function skipIntro() {
  hideIntro()
}

function onBackgroundReady() {
  backgroundReady.value = true
  window.setTimeout(() => hideIntro(), prefersReducedMotion.value ? 120 : 420)
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

  activateSection(name)
  if (name === 'pages') showPages.value = true
  if (name === 'tools') showTools.value = true
  if (name === 'games') showGames.value = true
  if (name === 'apps') showApps.value = true
  if (name === 'files') showFiles.value = true
}

watch(normalizedQuery, (queryValue) => {
  if (!queryValue) {
    return
  }

  activateAllSections()
  showPages.value = true
  showTools.value = true
  showGames.value = true
  showApps.value = true
  showFiles.value = true
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
      hideIntro()
    }
  }, prefersReducedMotion.value ? 800 : 5000)

  queueSectionActivation('tools', 300)
  queueSectionActivation('games', 700)
  queueSectionActivation('apps', 1100)
  queueSectionActivation('files', 1500)
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

  deferredActivationTimers.forEach((timer) => clearTimeout(timer))
})
</script>

<style scoped>
.section-toggle-enter-active,
.section-toggle-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.section-toggle-enter-from,
.section-toggle-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.section-toggle-enter-to,
.section-toggle-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>