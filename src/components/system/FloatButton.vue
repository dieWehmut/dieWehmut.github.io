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
      @click="languageOpen = !languageOpen"
    >
      <span class="float-controls__globe">Aa</span>
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
import { MagicStick, Setting, Top, Moon, Sunny } from '@element-plus/icons-vue'
import { useBackgroundPreference } from '../../composables/useBackgroundPreference'
import { useThemePreference } from '../../composables/useThemePreference'

const { locale } = useI18n()
const { dynamicBackgroundEnabled, toggleDynamicBackground } = useBackgroundPreference()
const { theme, toggleTheme: toggleThemePreference } = useThemePreference()

const settingsOpen = ref(false)
const languageOpen = ref(false)
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
  if (!settingsOpen.value) languageOpen.value = false
}

function selectLanguage(code) {
  locale.value = code
  try {
    localStorage.setItem('locale', code)
  } catch {}
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
  right: 20px;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.float-controls__button:hover,
.float-controls__button:focus-visible {
  border-color: rgba(31, 196, 31, 0.5);
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
  border-color: rgba(31, 196, 31, 0.18);
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
  border-color: #1fc41f;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.1);
  box-shadow:
    0 0 0 1px rgba(31, 196, 31, 0.12),
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
  box-shadow:
    0 8px 28px rgba(26, 158, 26, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

:root[data-theme="light"] .float-controls__settings:hover,
:root[data-theme="light"] .float-controls__settings:focus-visible {
  border-color: #1fc41f;
  color: var(--site-accent);
  background: rgba(255, 255, 255, 0.78);
  box-shadow:
    0 14px 36px rgba(26, 158, 26, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.float-controls__opt-dynamic,
.float-controls__opt-language,
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
  bottom: 150px;
}

.float-controls.is-top-hidden .float-controls__opt-language {
  bottom: 100px;
}

.float-controls__opt-dynamic {
  bottom: 200px;
}

.float-controls.is-top-hidden .float-controls__opt-dynamic {
  bottom: 150px;
}

.float-controls__opt-dynamic.is-visible,
.float-controls__opt-language.is-visible,
.float-controls__opt-theme.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.float-controls__button.is-active {
  color: var(--site-accent);
  border-color: rgba(31, 196, 31, 0.58);
  background: rgba(31, 196, 31, 0.14);
}

.float-controls__globe {
  font-size: 13px;
  font-weight: 900;
}

.float-controls__langs {
  position: absolute;
  right: 54px;
  bottom: 150px;
  display: flex;
  gap: 10px;
  opacity: 0;
  transform: translateX(8px);
  pointer-events: none;
  transition: transform 180ms ease, opacity 180ms ease, bottom 200ms ease;
}

.float-controls.is-top-hidden .float-controls__langs {
  bottom: 100px;
}

.float-controls__langs.is-open {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.float-controls__lang {
  position: static;
  width: 44px;
  height: 44px;
  font-size: 12px;
  font-weight: 900;
}

@keyframes settings-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .float-controls {
    right: 14px;
    bottom: 14px;
  }

  .float-controls__langs {
    right: 54px;
    bottom: 150px;
    display: grid;
    grid-template-columns: repeat(3, 44px);
    column-gap: 8px;
    row-gap: 6px;
    width: auto;
    justify-content: end;
  }

  .float-controls.is-top-hidden .float-controls__langs {
    bottom: 100px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .float-controls__button,
  .float-controls__langs {
    transition: none;
  }

  .float-controls__settings :deep(.el-icon) {
    animation: none;
  }
}
</style>
