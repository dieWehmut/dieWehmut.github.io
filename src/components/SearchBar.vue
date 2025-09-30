<template>
  <div class="search">
    <el-input
      id="global-search-input"
      ref="inputRef"
      v-model="innerValue"
      size="large"
      clearable
      :placeholder="placeholderText"
      @clear="$emit('clear')"
      @input="onInput"
      @keydown.enter.prevent
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
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, defineExpose } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue', 'submit', 'clear'])

const innerValue = ref(props.modelValue)
watch(() => props.modelValue, v => (innerValue.value = v))
watch(innerValue, v => emit('update:modelValue', v))

const placeholderText = computed(
  () => 'Search pages, versions, or logs...'
)

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
.search {
  width: min(960px, 92vw);
  margin: 0 auto;
  padding: 0 8px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  background: #fefefe;
  transition: all 0.3s ease;
  padding: 8px 16px;
}

.search-input :deep(.el-input__wrapper):hover {
  border-color: #e0e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #b8d4f0;
  box-shadow: 0 0 0 3px rgba(123, 179, 240, 0.1);
}

.search-input :deep(.el-input__inner) {
  color: #4a4a4a;
  font-size: 15px;
  border: none;
  outline: none;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: #a0a0a0;
}

.search-icon {
  color: #9a9a9a;
  font-size: 16px;
}

.shortcut-hint {
  margin-right: 4px;
}

.hint {
  font-size: 11px;
  color: #b8b8b8;
  border: 1px solid #e8e8e8;
  padding: 2px 6px;
  border-radius: 6px;
  user-select: none;
  background: #f8f8f8;
  font-weight: 500;
}

.search-input :deep(.el-input__suffix) {
  display: flex;
  align-items: center;
}

.search-input :deep(.el-input__clear) {
  color: #c0c0c0;
  transition: color 0.2s ease;
}

.search-input :deep(.el-input__clear:hover) {
  color: #9a9a9a;
}
</style>