<template>
  <div class="search w-[min(960px,92vw)] mx-auto rounded-xl border-0 bg-transparent px-2 py-0.5 shadow-none max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-0.5" :class="{ 'entering': enterReady }">
    <div class="search-shell flex items-center gap-3 rounded-2xl border border-white/[0.18] bg-[linear-gradient(135deg,rgba(53,56,68,0.76),rgba(45,54,63,0.76))] px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-[10px] backdrop-saturate-[118%] transition-all duration-200 max-[640px]:gap-2 max-[640px]:rounded-xl max-[640px]:px-2.5 max-[640px]:py-1.5">
      <Search class="search-icon h-[18px] w-[18px] shrink-0" />
      <input
        id="global-search-input"
        ref="inputRef"
        v-model="innerValue"
        type="text"
        :placeholder="placeholderText"
        class="search-field min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] font-medium tracking-[0.01em] text-white/[0.99] outline-none placeholder:text-white/[0.82] max-[640px]:text-sm"
        @keydown.enter="$emit('submit')"
      />
      <button
        v-if="innerValue"
        type="button"
        class="clear-btn inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-white/[0.72] transition hover:border-white/20 hover:bg-white/[0.1] hover:text-white/[0.96] max-[640px]:h-7 max-[640px]:w-7"
        aria-label="Clear search"
        @click="clearInput"
      >
        X
      </button>
      <div v-else class="mr-1 max-[640px]:hidden">
        <span class="rounded-md border border-white/[0.12] bg-transparent px-1.5 py-0.5 text-[11px] font-medium text-white/[0.88] select-none">Ctrl + K</span>
      </div>
    </div>

    <div v-if="!innerValue" class="mt-0.5 mb-0 flex w-full flex-wrap justify-center gap-1 max-[640px]:gap-x-0.5 max-[640px]:gap-y-1 max-[640px]:px-0">
      <button
        v-for="item in navItems"
        :key="item.name"
        type="button"
        class="nav-btn relative rounded-lg border border-white/[0.08] bg-white/[0.06] px-2 py-1 font-bold text-white/[0.96] active:translate-y-px max-[640px]:px-1 max-[640px]:py-0.5 max-[640px]:text-[11px]"
        @click="go(item.name)"
      >
        {{ t(item.label) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineExpose, nextTick, ref, watch } from 'vue'
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
  border-color: rgba(255, 172, 209, 0.32);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 18px 42px rgba(0,0,0,0.2);
}

.search-shell:focus-within {
  background: linear-gradient(135deg, rgba(58, 61, 74, 0.82), rgba(46, 56, 66, 0.82));
  border-color: rgba(255, 154, 197, 0.9);
  box-shadow: 0 0 0 1px rgba(255,154,197,0.36), 0 0 0 4px rgba(255,154,197,0.16), 0 16px 36px rgba(0,0,0,0.18);
}

.search-field::-ms-clear,
.search-field::-ms-reveal {
  display: none;
}

.search-icon {
  color: rgba(255, 196, 217, 0.95);
  filter: drop-shadow(0 0 10px rgba(255, 168, 201, 0.34));
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
  background: radial-gradient(40% 40% at 20% 20%, rgba(255,160,200,0.18), transparent 20%),
              radial-gradient(30% 30% at 80% 80%, rgba(255,120,190,0.08), transparent 20%);
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
  background: rgba(255, 138, 188, 0.18);
  border-color: rgba(255, 172, 209, 0.42);
  color: rgba(255, 245, 249, 0.98);
  box-shadow: 0 14px 30px rgba(255, 126, 180, 0.18);
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
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 12px 28px rgba(0,0,0,0.16);
  }
}
</style>
