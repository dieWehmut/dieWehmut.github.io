<template>
  <header class="mobile-header">
    <button class="mobile-header__menu" type="button" aria-label="Open menu" @click="$emit('toggle-menu')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    </button>
    <button class="mobile-header__toc" type="button" aria-label="Open page timeline" @click="$emit('toggle-toc')">
      <el-icon><Calendar /></el-icon>
    </button>
  </header>
</template>

<script setup>
import { Calendar } from '@element-plus/icons-vue'

defineEmits(['toggle-menu', 'toggle-toc'])
</script>

<style scoped>
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--site-mobile-header-height);
  padding: 10px 14px;
  background: var(--site-sidebar-bg);
  border-bottom: 1px solid var(--site-border);
  backdrop-filter: blur(12px);
}

.mobile-header__menu,
.mobile-header__toc {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  color: var(--site-text);
  background: transparent;
}

.mobile-header__toc {
  font-size: 21px;
}

@media (max-width: 900px) {
  .mobile-header {
    display: flex;
  }
}
</style>
