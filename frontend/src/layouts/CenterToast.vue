<template>
  <Teleport to="body">
    <div
      v-if="toast.visible"
      class="pointer-events-none fixed left-1/2 top-1/2 z-[2147483647] inline-flex max-w-[84vw] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-xl border px-4 py-3 text-white shadow-[0_22px_56px_rgba(0,0,0,0.5),0_6px_18px_rgba(0,0,0,0.32)] backdrop-blur-md transition duration-200"
      :class="toastClasses"
      role="status"
      aria-live="polite"
    >
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
  </Teleport>
</template>

<script>
const CENTER_TOAST_EVENT = 'nexus:center-toast'

export function showCenteredToast(messageOrKey, options = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(CENTER_TOAST_EVENT, {
      detail: {
        messageOrKey,
        type: options.type || 'success',
        duration: options.duration || 2500,
      },
    }),
  )
}
</script>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

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

  return 'border-white/10 bg-black/85'
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