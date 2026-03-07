<template>
  <div class="search w-[min(960px,92vw)] mx-auto rounded-xl border-0 bg-transparent px-2 py-0.5 shadow-none max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-0.5" :class="{ 'entering': enterReady }">
    <div class="search-shell flex items-center gap-3 rounded-2xl border border-white/40 bg-white/[0.48] px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(180,160,220,0.12)] backdrop-blur-xl backdrop-saturate-[118%] transition-all duration-200 max-[640px]:gap-2 max-[640px]:rounded-xl max-[640px]:px-2.5 max-[640px]:py-1.5">
      <Search class="search-icon h-[18px] w-[18px] shrink-0" />
      <input
        id="global-search-input"
        ref="inputRef"
        v-model="innerValue"
        type="text"
        :placeholder="placeholderText"
        class="search-field min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] font-medium tracking-[0.01em] text-[#3b4cb8] outline-none placeholder:text-[#3b4cb8]/40 max-[640px]:text-sm"
        @keydown.enter="$emit('submit')"
      />
      <button
        v-if="innerValue"
        type="button"
        class="clear-btn inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3b4cb8]/12 bg-[#3b4cb8]/6 text-sm text-[#3b4cb8]/60 transition hover:border-[#7c3aed]/20 hover:bg-[#7c3aed]/12 hover:text-[#7c3aed] max-[640px]:h-7 max-[640px]:w-7"
        aria-label="Clear search"
        @click="clearInput"
      >
        X
      </button>
      <div v-else class="mr-1 max-[640px]:hidden">
        <span class="rounded-md border border-[#3b4cb8]/12 bg-transparent px-1.5 py-0.5 text-[11px] font-medium text-[#3b4cb8]/55 select-none">Ctrl + K</span>
      </div>
    </div>

    <div v-if="!innerValue" class="mt-0.5 mb-0 flex w-full flex-wrap justify-center gap-1 max-[640px]:gap-x-0.5 max-[640px]:gap-y-1 max-[640px]:px-0">
      <button
        v-for="item in navItems"
        :key="item.name"
        type="button"
        class="nav-btn relative rounded-lg border border-[#3b4cb8]/10 bg-[#3b4cb8]/6 px-2 py-1 font-bold text-[#3b4cb8]/80 active:translate-y-px max-[640px]:px-1 max-[640px]:py-0.5 max-[640px]:text-[11px]"
        @click="go(item.name)"
      >
        {{ t(item.label) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  enterReady: {
    type: Boolean,
    default: true,
  }
})
const emit = defineEmits(['update:modelValue', 'submit', 'clear'])

const innerValue = ref(props.modelValue)
watch(() => props.modelValue, v => (innerValue.value = v))
watch(innerValue, v => emit('update:modelValue', v))

const { t } = useI18n()
const placeholderText = computed(() => t('search.hint'))
const navItems = [
  { name: 'pages', label: 'nav.pages' },
  { name: 'tools', label: 'nav.tools' },
  { name: 'games', label: 'nav.games' },
  { name: 'apps', label: 'nav.apps' },
  { name: 'files', label: 'nav.files' },
]

const inputRef = ref(null)

function focusInput() {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function clearInput() {
  innerValue.value = ''
  emit('clear')
  focusInput()
}

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
  } catch {
  }
  window.setTimeout(() => scrollToSection(id), 120)
}

defineExpose({ focusInput })
</script>

<style scoped>
.search-shell:hover {
  border-color: rgba(124, 58, 237, 0.22);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(180,160,220,0.16);
}

.search-shell:focus-within {
  background: rgba(255, 255, 255, 0.56);
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow: 0 0 0 1px rgba(124,58,237,0.18), 0 0 0 4px rgba(124,58,237,0.08), 0 8px 28px rgba(180,160,220,0.14);
}

.search-field::-ms-clear,
.search-field::-ms-reveal {
  display: none;
}

.search-icon {
  color: rgba(59, 76, 184, 0.65);
  filter: drop-shadow(0 0 8px rgba(59, 76, 184, 0.18));
}

.search {
  transition: opacity 420ms cubic-bezier(.16,.9,.2,1), transform 420ms cubic-bezier(.16,.9,.2,1);
  will-change: opacity, transform;
}

.search:not(.entering) {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}

.search.entering {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
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
  background: radial-gradient(40% 40% at 20% 20%, rgba(124,58,237,0.12), transparent 20%),
              radial-gradient(30% 30% at 80% 80%, rgba(124,58,237,0.06), transparent 20%);
  filter: blur(10px) saturate(150%);
  opacity: 0;
  transition: opacity 220ms ease, transform 220ms ease;
}

.nav-btn {
  transition: transform 220ms cubic-bezier(.2,.9,.2,1), background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease, color 220ms ease;
  will-change: transform;
}

.nav-btn:hover,
.nav-btn:focus-visible {
  transform: scale(1.06);
  background: rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.22);
  color: rgba(124, 58, 237, 0.95);
  box-shadow: 0 8px 24px rgba(180, 160, 220, 0.16);
  outline: none;
}

.nav-btn:hover::after {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.04);
}

@media (max-width: 1000px) {
  .search {
    margin-top: 2px;
    margin-bottom: 2px;
  }
}

@media (max-width: 640px) {
  .search-shell {
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 6px 20px rgba(180,160,220,0.12);
  }
}
</style>
