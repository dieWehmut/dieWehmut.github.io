<template>
  <div class="search w-[min(960px,92vw)] mx-auto rounded-xl border-0 bg-transparent px-2 py-0.5 shadow-none max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-0.5" :class="{ 'entering': enterReady }">
    <el-input
      id="global-search-input"
      ref="inputRef"
      v-model="innerValue"
      size="large"
      clearable
      :placeholder="placeholderText"
      @clear="$emit('clear')"
      @input="onInput"
      class="search-input"
    >
      <template #prefix>
        <el-icon class="search-icon text-[18px]"><Search /></el-icon>
      </template>
      <template #suffix>
        <div class="mr-1 max-[640px]:hidden">
          <span class="text-[11px] text-white/[0.88] border border-white/[0.12] px-1.5 py-0.5 rounded-md select-none bg-transparent font-medium">Ctrl + K</span>
        </div>
      </template>
    </el-input>

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
import { computed, ref, watch, nextTick, defineExpose } from 'vue'
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

function onInput() {
  emit('update:modelValue', innerValue.value)
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
.search-input :deep(.el-input) {
  --el-input-border-color: rgba(255, 255, 255, 0.18);
  --el-input-hover-border-color: rgba(255, 255, 255, 0.28);
  --el-input-focus-border-color: rgba(255, 154, 197, 0.9);
  --el-color-primary: rgba(255, 154, 197, 0.9);
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 10px 28px rgba(0,0,0,0.12) !important;
  transition: all 0.2s ease;
  padding: 4px 16px;
}
.search-input :deep(.el-input__wrapper):hover {
  border-color: rgba(255,255,255,0.28) !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 14px 32px rgba(0,0,0,0.16) !important;
}
.search-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 154, 197, 0.9) !important;
  box-shadow: 0 0 0 1px rgba(255,154,197,0.36), 0 0 0 4px rgba(255,154,197,0.16), 0 16px 36px rgba(0,0,0,0.18) !important;
}
.search-input :deep(.el-input__wrapper:focus-within) {
  border-color: rgba(255, 154, 197, 0.9) !important;
  box-shadow: 0 0 0 1px rgba(255,154,197,0.36), 0 0 0 4px rgba(255,154,197,0.16), 0 16px 36px rgba(0,0,0,0.18) !important;
}
.search-input :deep(.el-input__inner) {
  background: transparent !important;
  color: rgba(255,255,255,0.99) !important;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  border: none;
  outline: none;
  box-shadow: none !important;
}
.search-input :deep(.el-input__inner:focus) {
  outline: none !important;
  box-shadow: none !important;
}
.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255,255,255,0.82) !important;
}
.search-icon {
  color: rgba(255, 196, 217, 0.95);
  filter: drop-shadow(0 0 10px rgba(255, 168, 201, 0.34));
}
.search-input :deep(.el-input__suffix) {
  display: flex;
  align-items: center;
}
.search-input :deep(.el-input__clear) {
  color: rgba(255,255,255,0.72);
  transition: color 0.2s ease;
}
.search-input :deep(.el-input__clear:hover) {
  color: rgba(255,255,255,0.96);
}

/* entry animation */
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
  .search-input :deep(.el-input__wrapper) {
    padding: 2px 8px;
  }

  .search-input :deep(.el-input__inner) {
    font-size: 14px;
  }
}
</style>