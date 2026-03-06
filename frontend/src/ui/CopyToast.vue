<template>
  <div
    class="copy-toast fixed left-1/2 top-1/2 pl-[18px] py-3 pr-3.5 rounded-[10px] z-[2147483647] text-white bg-black/90 border border-white/[0.06] pointer-events-none max-w-[84%] inline-flex items-center gap-2.5"
    :class="typeClass"
    role="status"
    aria-live="polite"
    :style="{ opacity: visible ? 1 : 0, transform: visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -48%) scale(0.98)' }"
  >
    <div class="text-[15px] leading-none font-bold tracking-[0.2px]">{{ text }}</div>
    <!-- small white SVG icon on the right: check for success, x for error -->
    <span class="inline-flex items-center justify-center text-white" aria-hidden="true">
      <svg v-if="props.type !== 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-[18px] h-[18px] block" focusable="false">
        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-[18px] h-[18px] block" focusable="false">
        <path fill="currentColor" d="M12 10.586L16.95 5.636l1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 6.95 7.05 5.536 12 10.586z" />
      </svg>
    </span>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
// no direct i18n inside component; text is passed already translated (or raw)

const props = defineProps({
  text: { type: String, required: true },
  type: { type: String, default: 'success' },
  duration: { type: Number, default: 2500 },
  onClose: { type: Function }
})


const visible = ref(false)
const typeClass = computed(() => `copy-toast--${props.type}`)

onMounted(() => {
  // show then hide
  visible.value = true
  setTimeout(() => {
    visible.value = false
    setTimeout(() => {
      try {
        props.onClose && props.onClose()
      } catch (e) {}
    }, 220)
  }, props.duration)
})
</script>

<style scoped>
/* transition controlled separately (cubic-bezier can't be expressed inline) */
.copy-toast {
  transition: opacity 180ms cubic-bezier(.2,.9,.2,1), transform 180ms cubic-bezier(.2,.9,.2,1);
  box-shadow: 0 18px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.28);
}
.copy-toast--error { background: rgba(220,53,69,0.98); }
/* Slight pop effect when visible */
.copy-toast[style*="scale(1)"] {
  box-shadow: 0 22px 56px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.32);
}
</style>
