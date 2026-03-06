<template>
  <Teleport to="body">
    <div v-if="toast.visible" class="toast-shell pointer-events-none fixed inset-0 z-[2147483647] flex items-center justify-center px-4" role="status" aria-live="polite">
      <div class="center-toast relative inline-flex max-w-[84vw] items-center gap-2.5 rounded-xl border px-4 py-3 text-white shadow-[0_22px_56px_rgba(0,0,0,0.5),0_6px_18px_rgba(0,0,0,0.32)] backdrop-blur-md transition duration-200" :class="toastClasses">
        <div class="text-[15px] font-bold leading-none tracking-[0.2px] max-[640px]:text-sm">
          {{ toast.text }}
        </div>
        <span class="inline-flex items-center justify-center text-white" aria-hidden="true">
          <svg v-if="toast.type !== 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-[18px] w-[18px] block" focusable="false">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-[18px] w-[18px] block" focusable="false">
            <path fill="currentColor" d="M12 10.586L16.95 5.636l1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 6.95 7.05 5.536 12 10.586z" />
          </svg>
        </span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { CENTER_TOAST_EVENT } from '../utils/centerToast'

const { t, te } = useI18n()

const toast = reactive({
  text: '',
  type: 'success',
  visible: false,
})

let hideTimer = 0

const toastClasses = computed(() => {
  if (toast.type === 'error') {
    return 'border-rose-300/30 bg-rose-500/90'
  }

  if (toast.type === 'info') {
    return 'border-sky-200/20 bg-slate-900/90'
  }

  return 'border-emerald-200/35 bg-emerald-500/90'
})

function resolveToastText(messageOrKey) {
  if (typeof messageOrKey === 'string' && te(messageOrKey)) {
    return t(messageOrKey)
  }

  return typeof messageOrKey === 'string' ? messageOrKey : ''
}

function clearHideTimer() {
  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = 0
  }
}

function handleToastEvent(event) {
  const detail = event?.detail || {}
  toast.text = resolveToastText(detail.messageOrKey)
  toast.type = detail.type || 'success'
  toast.visible = true

  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    toast.visible = false
    hideTimer = 0
  }, detail.duration || 2500)
}

onMounted(() => {
  window.addEventListener(CENTER_TOAST_EVENT, handleToastEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener(CENTER_TOAST_EVENT, handleToastEvent)
  clearHideTimer()
})
</script>

<style scoped>
.toast-shell {
  animation: toast-fade 180ms ease-out;
}

.center-toast {
  overflow: hidden;
  animation: toast-pop 260ms cubic-bezier(.18,.88,.24,1), toast-glimmer 1.2s ease-in-out 2;
}

.center-toast::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.28) 50%, transparent 70%);
  opacity: 0;
  animation: toast-sheen 1.2s ease-in-out 2;
}

@keyframes toast-pop {
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.94);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-fade {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes toast-glimmer {
  0%, 100% {
    filter: brightness(1) saturate(1);
  }
  25% {
    filter: brightness(1.08) saturate(1.05);
  }
  50% {
    filter: brightness(0.96) saturate(0.98);
  }
  75% {
    filter: brightness(1.12) saturate(1.08);
  }
}

@keyframes toast-sheen {
  0% {
    opacity: 0;
    transform: translateX(-26%);
  }
  20% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.45;
  }
  100% {
    opacity: 0;
    transform: translateX(26%);
  }
}
</style>
