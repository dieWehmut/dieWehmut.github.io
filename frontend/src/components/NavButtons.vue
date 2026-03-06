<template>
  <div class="flex gap-1 max-[640px]:gap-0.5 flex-wrap justify-center px-0">
    <button class="nav-btn relative border-0 px-2 py-1 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-xs rounded-lg font-bold cursor-pointer bg-white/[0.06] text-white/[0.96] active:translate-y-px" @click="go('pages')">{{ t('nav.pages') }}</button>
    <button class="nav-btn relative border-0 px-2 py-1 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-xs rounded-lg font-bold cursor-pointer bg-white/[0.06] text-white/[0.96] active:translate-y-px" @click="go('tools')">{{ t('nav.tools') }}</button>
    <button class="nav-btn relative border-0 px-2 py-1 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-xs rounded-lg font-bold cursor-pointer bg-white/[0.06] text-white/[0.96] active:translate-y-px" @click="go('games')">{{ t('nav.games') }}</button>
    <button class="nav-btn relative border-0 px-2 py-1 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-xs rounded-lg font-bold cursor-pointer bg-white/[0.06] text-white/[0.96] active:translate-y-px" @click="go('apps')">{{ t('nav.apps') }}</button>
    <button class="nav-btn relative border-0 px-2 py-1 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-xs rounded-lg font-bold cursor-pointer bg-white/[0.06] text-white/[0.96] active:translate-y-px" @click="go('files')">{{ t('nav.files') }}</button>
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
/* pink glow hover effect via pseudo-element */
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
  background: radial-gradient(40% 40% at 20% 20%, rgba(255,160,200,0.18), transparent 20%),
              radial-gradient(30% 30% at 80% 80%, rgba(255,120,190,0.08), transparent 20%);
  filter: blur(10px) saturate(150%);
  opacity: 0;
  transition: opacity 220ms ease, transform 220ms ease;
}
.nav-btn:hover::after {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.04);
}
</style>
