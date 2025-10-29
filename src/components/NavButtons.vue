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
  gap: 8px;
  flex-wrap: wrap;
}
.nav-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.96);
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}
.nav-btn:active {
  transform: translateY(1px);
}
</style>
