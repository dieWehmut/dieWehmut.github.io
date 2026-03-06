<template>
  <div class="search w-[min(960px,92vw)] mx-auto px-2 max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-0.5 py-0.5 bg-white/[0.02] rounded-xl" :class="{ 'entering': enterReady }">
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
        <el-icon class="text-white/[0.85] text-base"><Search /></el-icon>
      </template>
      <template #suffix>
        <div class="mr-1 max-[640px]:hidden">
          <span class="text-[11px] text-white/[0.88] border border-white/[0.12] px-1.5 py-0.5 rounded-md select-none bg-transparent font-medium">Ctrl + K</span>
        </div>
      </template>
    </el-input>
  <!-- Show the nav buttons beneath the search when input is empty (also for desktop) -->
  <NavButtons v-if="!innerValue" class="mobile-nav mt-0.5 mb-0 w-full max-[640px]:px-0" />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, defineExpose } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import NavButtons from '../layouts/NavButtons.vue'

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

function onInput() {
  emit('update:modelValue', innerValue.value)
}

defineExpose({ focusInput })
</script>

<style scoped>
.search-input :deep(.el-input__wrapper) {
  border-radius: 16px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  transition: all 0.2s ease;
  padding: 4px 16px;
}
.search-input :deep(.el-input__wrapper):hover {
  border-color: transparent !important;
  box-shadow: none !important;
}
.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: transparent !important;
  box-shadow: none !important;
}
.search-input :deep(.el-input__inner) {
  background: transparent !important;
  color: rgba(255,255,255,0.96) !important;
  font-size: 15px;
  border: none;
  outline: none;
}
.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255,255,255,0.7) !important;
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