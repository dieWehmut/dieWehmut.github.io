<template>
  <div class="nav-buttons">
  <button class="nav-btn" @click="go('pages')">{{ t('nav.pages') }}</button>
  <button class="nav-btn" @click="go('tools')">{{ t('nav.tools') }}</button>
  <button class="nav-btn" @click="go('games')">{{ t('nav.games') }}</button>
  <button class="nav-btn" @click="go('apps')">{{ t('nav.apps') }}</button>
  <button class="nav-btn" @click="go('files')">{{ t('nav.files') }}</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const headerOffset = 90
  const rect = el.getBoundingClientRect()
  const docTop = window.pageYOffset || document.documentElement.scrollTop
  const top = rect.top + docTop - headerOffset
  window.scrollTo({ top, behavior: 'smooth' })
}

function go(name) {
  const map = {
    pages: 'section-pages',
    games: 'section-games',
    apps: 'section-apps',
    files: 'section-files',
    tools: 'section-tools',
  }
  const id = map[name]
  if (!id) return
  try {
    window.dispatchEvent(new CustomEvent('open-section', { detail: name }))
  } catch (e) {}
  // add small timeout so any listeners can react first
  setTimeout(() => scrollToSection(id), 120)
}

// keep exports simple; no props needed since behavior is self-contained
onMounted(() => {})
</script>

<style scoped>
.nav-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center; /* center the nav buttons horizontally */
}
.nav-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.96);
  border: none;
  padding: 4px 8px; /* reduced padding to shrink distance between border and text */
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
.nav-btn:active {
  transform: translateY(1px);
}

/* pink glow for nav buttons on hover */
.nav-btn {
  position: relative;
  overflow: visible;
}
.nav-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  width: 160%;
  height: 120%;
  pointer-events: none;
  border-radius: 10px;
  background: radial-gradient(40% 40% at 20% 20%, rgba(255,160,200,0.18), transparent 20%), radial-gradient(30% 30% at 80% 80%, rgba(255,120,190,0.08), transparent 20%);
  filter: blur(10px) saturate(150%);
  opacity: 0;
  transition: opacity 220ms ease, transform 220ms ease;
}
.nav-btn:hover::after {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.04);
}
</style>
