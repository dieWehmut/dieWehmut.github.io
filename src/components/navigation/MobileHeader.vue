<template>
  <header class="mobile-header">
    <div class="mobile-header__left">
      <button class="mobile-header__menu" type="button" aria-label="Open menu" @click="$emit('toggle-menu')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
      <button
        v-if="showCaptureBack"
        class="mobile-header__back"
        type="button"
        aria-label="Back to capture"
        title="Back to capture"
        @click="backToCapture"
      >
        <el-icon><ArrowLeft /></el-icon>
      </button>
    </div>
    <RouteBreadcrumb class="mobile-header__breadcrumb" variant="inline" />
    <button class="mobile-header__toc" type="button" aria-label="Open page timeline" @click="$emit('toggle-toc')">
      <el-icon><Calendar /></el-icon>
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar } from '@element-plus/icons-vue'
import RouteBreadcrumb from '../system/RouteBreadcrumb.vue'

defineEmits(['toggle-menu', 'toggle-toc'])

const route = useRoute()
const router = useRouter()
const showCaptureBack = computed(() => route.name === 'capture-detail')

function backToCapture() {
  router.push('/capture')
}
</script>

<style scoped>
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: none;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  min-height: var(--site-mobile-header-height);
  padding: 10px 6px;
  background: var(--site-sidebar-bg);
  border-bottom: 1px solid var(--site-border);
  backdrop-filter: blur(12px);
}

.mobile-header__left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.mobile-header__menu,
.mobile-header__back,
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
  flex: 0 0 auto;
}

.mobile-header__toc {
  font-size: 21px;
}

.mobile-header__breadcrumb {
  flex: 1 1 auto;
  min-width: 0;
}

@media (max-width: 900px) {
  .mobile-header {
    display: flex;
  }
}
</style>
