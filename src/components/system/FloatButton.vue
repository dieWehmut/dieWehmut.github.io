<template>
  <div class="float-controls" :class="{ 'is-top-hidden': atTop }" aria-label="Quick controls">
    <div class="float-controls__langs" :class="{ 'is-open': languageOpen }">
      <button
        v-for="lang in languages"
        :key="lang.code"
        class="float-controls__button float-controls__lang"
        :class="{ 'is-active': locale === lang.code }"
        type="button"
        :title="lang.name"
        :aria-label="lang.name"
        @click="selectLanguage(lang.code)"
      >
        {{ lang.label }}
      </button>
    </div>

    <div class="float-controls__schemes" :class="{ 'is-open': colorSchemeOpen }">
      <button
        v-for="scheme in colorSchemeOptions"
        :key="scheme.id"
        class="float-controls__button float-controls__scheme"
        :class="{ 'is-active': colorScheme === scheme.id }"
        type="button"
        :title="scheme.label"
        :aria-label="scheme.label"
        :style="{ '--scheme-color': scheme.preview }"
        @click="selectColorScheme(scheme.id)"
      >
        <span class="float-controls__scheme-swatch" aria-hidden="true"></span>
      </button>
    </div>

    <button
      class="float-controls__button float-controls__opt-dynamic"
      :class="{ 'is-visible': settingsOpen, 'is-active': dynamicBackgroundEnabled }"
      type="button"
      title="Toggle dynamic background"
      aria-label="Toggle dynamic background"
      @click="toggleDynamicBackground"
    >
      <el-icon><MagicStick /></el-icon>
    </button>

    <button
      class="float-controls__button float-controls__opt-language"
      :class="{ 'is-visible': settingsOpen }"
      type="button"
      title="Language"
      aria-label="Language"
      @click="toggleLanguagePanel"
    >
      <span class="float-controls__globe">Aa</span>
    </button>

    <button
      class="float-controls__button float-controls__opt-color"
      :class="{ 'is-visible': settingsOpen, 'is-active': colorSchemeOpen }"
      type="button"
      title="Color scheme"
      aria-label="Color scheme"
      @click="toggleColorSchemePanel"
    >
      <el-icon><Brush /></el-icon>
    </button>

    <button
      class="float-controls__button float-controls__opt-theme"
      :class="{ 'is-visible': settingsOpen }"
      type="button"
      title="Toggle theme"
      aria-label="Toggle theme"
      @click="toggleTheme"
    >
      <el-icon><Sunny v-if="theme === 'dark'" /><Moon v-else /></el-icon>
    </button>

    <button
      class="float-controls__button float-controls__settings"
      type="button"
      title="Settings"
      aria-label="Settings"
      @click="toggleSettings"
    >
      <el-icon><Setting /></el-icon>
    </button>

    <button
      class="float-controls__button float-controls__top"
      type="button"
      title="Back to top"
      aria-label="Back to top"
      @click="scrollToTop"
    >
      <el-icon><Top /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Brush, MagicStick, Setting, Top, Moon, Sunny } from '@element-plus/icons-vue'
import { useBackgroundPreference } from '../../composables/useBackgroundPreference'
import { useColorSchemePreference } from '../../composables/useColorSchemePreference'
import { useThemePreference } from '../../composables/useThemePreference'

const { locale } = useI18n()
const { dynamicBackgroundEnabled, toggleDynamicBackground } = useBackgroundPreference()
const { colorScheme, colorSchemeOptions, setColorScheme } = useColorSchemePreference()
const { theme, toggleTheme: toggleThemePreference } = useThemePreference()

const settingsOpen = ref(false)
const languageOpen = ref(false)
const colorSchemeOpen = ref(false)
const atTop = ref(true)

function onScroll() {
  atTop.value = window.scrollY < 60
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

const languages = [
  { code: 'zh', label: 'CN', name: 'Simplified Chinese' },
  { code: 'zh_tw', label: 'TW', name: 'Traditional Chinese' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ja', label: 'JA', name: 'Japanese' },
  { code: 'de', label: 'DE', name: 'German' },
  { code: 'la', label: 'LA', name: 'Latin' },
]

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
  if (!settingsOpen.value) {
    languageOpen.value = false
    colorSchemeOpen.value = false
  }
}

function toggleLanguagePanel() {
  languageOpen.value = !languageOpen.value
  if (languageOpen.value) colorSchemeOpen.value = false
}

function toggleColorSchemePanel() {
  colorSchemeOpen.value = !colorSchemeOpen.value
  if (colorSchemeOpen.value) languageOpen.value = false
}

function selectLanguage(code) {
  locale.value = code
  try {
    localStorage.setItem('locale', code)
  } catch {}
}

function selectColorScheme(scheme) {
  setColorScheme(scheme)
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleTheme() {
  toggleThemePreference()
}
</script>

<style scoped>
.float-controls {
  position: fixed;
  right: 4px;
  bottom: 20px;
  z-index: 80;
  width: 48px;
  pointer-events: none;
}

.float-controls__button {
  position: absolute;
  right: 0;
  width: 44px;
  height: 44px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--site-border);
  border-radius: 10px;
  color: var(--site-text);
  background: var(--site-sidebar-bg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  pointer-events: auto;
  font-size: 20px;
  transition:
    bottom 200ms ease,
    transform 180ms ease,
    opacity 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease;
}

:root[data-theme="light"] .float-controls__button {
  border-color: rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: none;
}

.float-controls__button:hover,
.float-controls__button:focus-visible {
  border-color: rgb(var(--site-accent-rgb) / 0.5);
  color: var(--site-accent);
  transform: translateY(-1px);
  outline: none;
}

.float-controls__top {
  bottom: 0;
  transition: opacity 200ms ease, transform 200ms ease;
}

.float-controls.is-top-hidden .float-controls__top {
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px) scale(0.92);
}

.float-controls__settings {
  bottom: 50px;
  border-color: rgb(var(--site-accent-rgb) / 0.18);
  color: var(--site-text);
  background: rgba(10, 10, 10, 0.74);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
  transition:
    bottom 200ms ease,
    transform 150ms ease,
    background-color 200ms ease,
    border-color 200ms ease,
    color 200ms ease,
    box-shadow 200ms ease;
}

.float-controls.is-top-hidden .float-controls__settings {
  bottom: 0;
}

.float-controls__settings :deep(.el-icon) {
  animation: settings-spin 2s linear infinite;
}

.float-controls__settings:hover,
.float-controls__settings:focus-visible {
  border-color: var(--site-accent);
  color: var(--site-accent);
  background: rgb(var(--site-accent-rgb) / 0.1);
  box-shadow:
    0 0 0 1px rgb(var(--site-accent-rgb) / 0.12),
    0 14px 40px rgba(0, 0, 0, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.float-controls__settings:hover :deep(.el-icon),
.float-controls__settings:focus-visible :deep(.el-icon) {
  animation: none;
}

:root[data-theme="light"] .float-controls__settings {
  border-color: rgba(255, 255, 255, 0.68);
  color: var(--site-text);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

:root[data-theme="light"] .float-controls__settings:hover,
:root[data-theme="light"] .float-controls__settings:focus-visible {
  border-color: var(--site-accent);
  color: var(--site-accent);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.float-controls__opt-dynamic,
.float-controls__opt-language,
.float-controls__opt-color,
.float-controls__opt-theme {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  pointer-events: none;
  transition:
    bottom 200ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

.float-controls__opt-theme {
  bottom: 100px;
}

.float-controls.is-top-hidden .float-controls__opt-theme {
  bottom: 50px;
}

.float-controls__opt-language {
  bottom: 200px;
}

.float-controls.is-top-hidden .float-controls__opt-language {
  bottom: 150px;
}

.float-controls__opt-color {
  bottom: 150px;
}

.float-controls.is-top-hidden .float-controls__opt-color {
  bottom: 100px;
}

.float-controls__opt-dynamic {
  bottom: 250px;
}

.float-controls.is-top-hidden .float-controls__opt-dynamic {
  bottom: 200px;
}

.float-controls__opt-dynamic.is-visible,
.float-controls__opt-language.is-visible,
.float-controls__opt-color.is-visible,
.float-controls__opt-theme.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.float-controls__button.is-active {
  color: var(--site-accent);
  border-color: rgb(var(--site-accent-rgb) / 0.58);
  background: rgb(var(--site-accent-rgb) / 0.14);
}

.float-controls__globe {
  font-size: 13px;
  font-weight: 900;
}

.float-controls__langs {
  position: absolute;
  right: 54px;
  bottom: 200px;
  display: flex;
  gap: 10px;
  opacity: 0;
  visibility: hidden;
  transform: translateX(8px) scale(0.95);
  pointer-events: none;
  transition: transform 200ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 200ms ease, visibility 0ms 200ms, bottom 200ms ease;
}

.float-controls.is-top-hidden .float-controls__langs {
  bottom: 150px;
}

.float-controls__langs.is-open {
  opacity: 1;
  visibility: visible;
  transform: translateX(0) scale(1);
  pointer-events: auto;
  transition: transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 200ms ease, visibility 0ms 0ms;
}

.float-controls__lang {
  position: static;
  width: 44px;
  height: 44px;
  font-size: 12px;
  font-weight: 900;
  opacity: 0;
  transform: translateX(8px) scale(0.9);
  transition: opacity 180ms ease, transform 180ms ease;
}

.float-controls__langs.is-open .float-controls__lang {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.float-controls__langs.is-open .float-controls__lang:nth-child(1) { transition-delay: 20ms; }
.float-controls__langs.is-open .float-controls__lang:nth-child(2) { transition-delay: 50ms; }
.float-controls__langs.is-open .float-controls__lang:nth-child(3) { transition-delay: 80ms; }
.float-controls__langs.is-open .float-controls__lang:nth-child(4) { transition-delay: 110ms; }
.float-controls__langs.is-open .float-controls__lang:nth-child(5) { transition-delay: 140ms; }
.float-controls__langs.is-open .float-controls__lang:nth-child(6) { transition-delay: 170ms; }

.float-controls__schemes {
  position: absolute;
  right: 54px;
  bottom: 150px;
  display: flex;
  gap: 10px;
  opacity: 0;
  visibility: hidden;
  transform: translateX(8px) scale(0.95);
  pointer-events: none;
  transition: transform 200ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 200ms ease, visibility 0ms 200ms, bottom 200ms ease;
}

.float-controls.is-top-hidden .float-controls__schemes {
  bottom: 100px;
}

.float-controls__schemes.is-open {
  opacity: 1;
  visibility: visible;
  transform: translateX(0) scale(1);
  pointer-events: auto;
  transition: transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 200ms ease, visibility 0ms 0ms;
}

.float-controls__scheme {
  position: static;
  width: 44px;
  height: 44px;
  opacity: 0;
  transform: translateX(8px) scale(0.9);
  transition: opacity 180ms ease, transform 180ms ease;
}

.float-controls__schemes.is-open .float-controls__scheme {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.float-controls__schemes.is-open .float-controls__scheme:nth-child(1) { transition-delay: 20ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(2) { transition-delay: 50ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(3) { transition-delay: 80ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(4) { transition-delay: 110ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(5) { transition-delay: 140ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(6) { transition-delay: 170ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(7) { transition-delay: 200ms; }
.float-controls__schemes.is-open .float-controls__scheme:nth-child(8) { transition-delay: 230ms; }

.float-controls__scheme-swatch {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.64);
  border-radius: 50%;
  background: var(--scheme-color);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.28);
}

@keyframes settings-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .float-controls {
    right: 4px;
    bottom: 14px;
  }

  .float-controls__button {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .float-controls__globe,
  .float-controls__lang {
    font-size: 11px;
  }

  .float-controls__settings {
    bottom: 46px;
  }

  .float-controls__opt-theme {
    bottom: 92px;
  }

  .float-controls.is-top-hidden .float-controls__opt-theme {
    bottom: 46px;
  }

  .float-controls__opt-language {
    bottom: 184px;
  }

  .float-controls.is-top-hidden .float-controls__opt-language {
    bottom: 138px;
  }

  .float-controls__opt-color {
    bottom: 138px;
  }

  .float-controls.is-top-hidden .float-controls__opt-color {
    bottom: 92px;
  }

  .float-controls__opt-dynamic {
    bottom: 230px;
  }

  .float-controls.is-top-hidden .float-controls__opt-dynamic {
    bottom: 184px;
  }

  .float-controls__langs {
    right: 48px;
    bottom: 184px;
    display: grid;
    grid-template-columns: repeat(3, 38px);
    column-gap: 8px;
    row-gap: 6px;
    width: auto;
    justify-content: end;
  }

  .float-controls.is-top-hidden .float-controls__langs {
    bottom: 138px;
  }

  .float-controls__schemes {
    right: 48px;
    bottom: 138px;
  }

  .float-controls.is-top-hidden .float-controls__schemes {
    bottom: 92px;
  }

  .float-controls__scheme {
    width: 38px;
    height: 38px;
  }

  .float-controls__scheme-swatch {
    width: 18px;
    height: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .float-controls__button,
  .float-controls__langs,
  .float-controls__schemes {
    transition: none;
  }

  .float-controls__settings :deep(.el-icon) {
    animation: none;
  }
}
</style>
