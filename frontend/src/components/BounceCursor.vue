<template>
  <div
    v-show="visible"
    class="heart-bounce-cursor"
    :style="{ left: `${x}px`, top: `${y}px` }"
    aria-hidden="true"
  >
    <div class="ripple" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const x = ref(-9999)
const y = ref(-9999)
const visible = ref(false)

const CLICKABLE_SELECTOR = [
  'button',
  'a',
  '[role="button"]',
  '.clickable',
  '.action-btn',
  '.repo-link',
  '.repo-button',
  '.link-button',
  '.copy-btn',
  '.nav-btn',
  '.github-btn',
  '.tool-row',
].join(',')

function isTextInputLike(el) {
  if (!el) return false
  if (el.matches?.('input, textarea, select, option, [contenteditable="true"]')) return true
  return !!el.closest?.('input, textarea, select, [contenteditable="true"]')
}

function updateHoverState(target) {
  const root = document.documentElement
  if (!target || isTextInputLike(target)) {
    visible.value = false
    root.classList.remove('heart-bounce-active')
    return
  }

  const hit = target.closest?.(CLICKABLE_SELECTOR)
  if (hit) {
    visible.value = true
    root.classList.add('heart-bounce-active')
  } else {
    visible.value = false
    root.classList.remove('heart-bounce-active')
  }
}

function onMouseMove(e) {
  x.value = e.clientX
  y.value = e.clientY
  updateHoverState(e.target)
}

function onMouseLeave() {
  visible.value = false
  document.documentElement.classList.remove('heart-bounce-active')
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('mouseleave', onMouseLeave, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  document.documentElement.classList.remove('heart-bounce-active')
})
</script>

<style scoped>
.heart-bounce-cursor {
  position: fixed;
  width: 24px;
  height: 24px;
  transform: translate(-12px, -20px);
  pointer-events: none;
  z-index: 2147483647 !important;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='%23ff69b4'/%3E%3C/svg%3E");
  animation: heartBounce 560ms ease-in-out infinite;
}

.heart-bounce-cursor .ripple {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 10px;
  height: 4px;
  transform: translate(-50%, -6px) scale(0);
  border-radius: 50%;
  background: rgba(255,40,40,0.95);
  opacity: 0;
  filter: blur(0.6px);
  pointer-events: none;
  animation: heartRipple 560ms ease-out infinite;
  transform-origin: center;
}

@keyframes heartRipple {
  0%, 78% { opacity: 0; transform: translate(-50%, -6px) scale(0); }
  86% { opacity: 0.65; transform: translate(-50%, -2px) scale(0.6); }
  100% { opacity: 0; transform: translate(-50%, 0px) scale(2.2); }
}

@keyframes heartBounce {
  0%, 100% { transform: translate(-12px, -20px) scale(1); }
  35% { transform: translate(-12px, -24px) scale(1.08); }
  60% { transform: translate(-12px, -18px) scale(0.96); }
}

:global(html.heart-bounce-active a),
:global(html.heart-bounce-active button),
:global(html.heart-bounce-active [role="button"]),
:global(html.heart-bounce-active .clickable),
:global(html.heart-bounce-active .action-btn),
:global(html.heart-bounce-active .repo-link),
:global(html.heart-bounce-active .repo-button),
:global(html.heart-bounce-active .link-button),
:global(html.heart-bounce-active .copy-btn),
:global(html.heart-bounce-active .nav-btn),
:global(html.heart-bounce-active .github-btn),
:global(html.heart-bounce-active .tool-row) {
  cursor: none !important;
}

/* Also cover float controls and custom buttons so native cursor is hidden there too */
:global(html.heart-bounce-active .btt-button),
:global(html.heart-bounce-active .lang-btn),
:global(html.heart-bounce-active .sidebar-toggle),
:global(html.heart-bounce-active .settings-button),
:global(html.heart-bounce-active .lang-toggle),
:global(html.heart-bounce-active .clean-toggle),
:global(html.heart-bounce-active .float-container) {
  cursor: none !important;
}
</style>
