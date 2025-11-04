<template>
  <div class="search" :class="{ 'entering': enterReady }">
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
        <el-icon class="search-icon"><Search /></el-icon>
      </template>
      <template #suffix>
        <div class="shortcut-hint">
          <span class="hint">Ctrl + K</span>
        </div>
      </template>
    </el-input>
  <!-- Show the nav buttons beneath the search when input is empty (also for desktop) -->
  <NavButtons v-if="!innerValue" class="mobile-nav" />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, defineExpose, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import NavButtons from './NavButtons.vue'

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

const inputRef = ref(null)
function focusInput() {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// responsive flag - show nav buttons under search only on mobile
const isMobile = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 1000px)')
  const update = () => (isMobile.value = mq.matches)
  update()
  if (mq.addEventListener) mq.addEventListener('change', update)
  else mq.addListener(update)
})

function onInput() {
  emit('update:modelValue', innerValue.value)
}

defineExpose({ focusInput })
</script>

<style scoped>
.search {
  width: min(960px, 92vw);
  margin: 0 auto;
  padding: 6px 8px;
  /* make the search container sit on a dark translucent header for legibility */
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 16px;
  /* make fully transparent to expose background video */
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  transition: all 0.2s ease;
  padding: 8px 16px;
}

.search-input :deep(.el-input__wrapper):hover {
  border-color: transparent !important;
  box-shadow: none !important;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: transparent !important;
  box-shadow: none !important;
}

/* Ensure actual input inner background is transparent too (Element Plus may add white background) */

.search-input :deep(.el-input__inner) {
  background: transparent !important;
  /* 强制白色文本，便于在深色/动态背景上可读 */
  color: rgba(255,255,255,0.96) !important;
  font-size: 15px;
  border: none;
  outline: none;
}

.search-input :deep(.el-input__inner::placeholder) {
  /* placeholder 更柔和的白色 */
  color: rgba(255,255,255,0.7) !important;
}

.search-icon {
  color: rgba(255,255,255,0.85);
  font-size: 16px;
}

.shortcut-hint {
  margin-right: 4px;
}

.hint {
  font-size: 11px;
  color: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.12);
  padding: 2px 6px;
  border-radius: 6px;
  user-select: none;
  background: transparent !important;
  font-weight: 500;
}

.search-input :deep(.el-input__suffix) {
  display: flex;
  align-items: center;
}

.search-input :deep(.el-input__clear) {
  color: #b0a2a2;
  transition: color 0.2s ease;
}

.search-input :deep(.el-input__clear:hover) {
  color: #9a9a9a;
}

/* entry animation for search bar */
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

/* Mobile: lower the search bar slightly so it's not too close to the top */
@media (max-width: 1000px) {
  .search {
    margin-top: 10px;
    margin-bottom: 6px;
  }
}
</style>