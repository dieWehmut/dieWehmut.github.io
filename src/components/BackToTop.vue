<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const visible = ref(true);

function handleKey(e) {
  if (e.key === 'Home') scrollToTop();
}

onMounted(() => window.addEventListener('keyup', handleKey));
onBeforeUnmount(() => window.removeEventListener('keyup', handleKey));
</script>

<template>
  <button
    class="btt-button"
    @click="scrollToTop"
    title="回到顶部"
    aria-label="Back to top"
    v-if="visible"
  >
    <!-- Arrow icon (white on black background) -->
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 20V4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 11L12 4L19 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</template>

<style scoped>
.btt-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  padding: 8px;
  border-radius: 12px;
  background: #000000; /* black button */
  border: none;
  color: #fff;
  box-shadow: 0 8px 20px rgba(0,0,0,0.24);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(.2,.9,.2,1), box-shadow 160ms ease, background-color 160ms ease;
}

@media (hover: hover) {
  .btt-button:hover,
  .btt-button:focus {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 44px rgba(0,0,0,0.28);
    background-color: #0b0b0b;
    outline: none;
  }
}

/* ensure icon strokes are white */
.btt-button svg path {
  stroke: #fff !important;
}

/* respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .btt-button,
  .btt-button:hover,
  .btt-button:focus {
    transition: none !important;
    transform: none !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.18) !important;
  }
}

</style>
