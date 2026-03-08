<template>
  <div
    ref="cursorEl"
    class="heart-bounce-cursor"
    aria-hidden="true"
  >
    <div class="heart-bounce-cursor__inner">
      <div class="ripple" aria-hidden="true"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const cursorEl = ref(null)
let currentVisible = false
let rafId = null
let pendingEvent = null

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

function setVisible(show) {
  if (currentVisible === show) return
  currentVisible = show
  const el = cursorEl.value
  if (el) el.style.display = show ? '' : 'none'
  if (show) {
    document.documentElement.classList.add('heart-bounce-active')
  } else {
    document.documentElement.classList.remove('heart-bounce-active')
  }
}

function flushMove() {
  rafId = null
  const e = pendingEvent
  if (!e) return
  pendingEvent = null

  const el = cursorEl.value
  if (el) {
    el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
  }

  const target = e.target
  if (!target || isTextInputLike(target)) {
    setVisible(false)
    return
  }

  setVisible(!!target.closest?.(CLICKABLE_SELECTOR))
}

function onMouseMove(e) {
  pendingEvent = e
  if (rafId === null) {
    rafId = requestAnimationFrame(flushMove)
  }
}

function onMouseLeave() {
  pendingEvent = null
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  setVisible(false)
}

onMounted(() => {
  if (cursorEl.value) {
    cursorEl.value.style.display = 'none'
    cursorEl.value.style.transform = 'translate3d(-9999px, -9999px, 0)'
  }
  window.addEventListener('pointermove', onMouseMove, { passive: true })
  window.addEventListener('mouseleave', onMouseLeave, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  if (rafId !== null) cancelAnimationFrame(rafId)
  document.documentElement.classList.remove('heart-bounce-active')
})
</script>

<style scoped>
.heart-bounce-cursor {
  position: fixed;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 2147483647 !important;
  will-change: transform;
  contain: layout style;
}

.heart-bounce-cursor__inner {
  width: 24px;
  height: 24px;
  transform: translate(-12px, -20px);
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='%23ff69b4'/%3E%3C/svg%3E");
  animation: heartBounce 560ms ease-in-out infinite;
  will-change: transform;
}

.heart-bounce-cursor__inner .ripple {
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

/* Keep native cursor on float controls to avoid visible pointer lag on tiny buttons. */
</style>
