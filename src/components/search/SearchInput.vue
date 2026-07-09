<template>
  <label class="search-input">
    <el-icon class="search-input__icon"><Search /></el-icon>
    <input
      :value="modelValue"
      type="search"
      autocomplete="off"
      placeholder="Search posts, notes, tags, friends, projects..."
      @input="onInput"
    />
  </label>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<style scoped>
.search-input {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 0 18px;
  border: 1px solid var(--site-border);
  border-radius: 10px;
  color: var(--site-muted);
  background: rgba(255, 255, 255, 0.02);
}

.search-input:focus-within {
  border-color: rgb(var(--site-accent-rgb) / 0.55);
}

.search-input__icon {
  flex: 0 0 auto;
  font-size: 24px;
}

input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: none;
  color: var(--site-text);
  background: transparent;
  font-size: 22px;
  font-weight: 700;
}

input::placeholder {
  color: rgba(190, 190, 190, 0.64);
}

@media (max-width: 640px) {
  .search-input {
    min-height: 54px;
    padding: 0 14px;
  }

  input {
    font-size: 17px;
  }
}
</style>
