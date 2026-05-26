import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export function useMotionPreferences() {
  const prefersReducedMotion = ref(false)
  const hasFinePointer = ref(true)
  const isPageVisible = ref(true)

  let reducedMotionMq: MediaQueryList | null = null
  let finePointerMq: MediaQueryList | null = null

  function syncReducedMotion() {
    prefersReducedMotion.value = !!reducedMotionMq?.matches
  }

  function syncFinePointer() {
    hasFinePointer.value = !!finePointerMq?.matches
  }

  function syncVisibility() {
    isPageVisible.value = typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  }

  function bindMediaQuery(mq: MediaQueryList | null, onChange: () => void) {
    if (!mq) return
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
  }

  function unbindMediaQuery(mq: MediaQueryList | null, onChange: () => void) {
    if (!mq) return
    if (mq.removeEventListener) mq.removeEventListener('change', onChange)
    else mq.removeListener(onChange)
  }

  onMounted(() => {
    if (typeof window === 'undefined') return

    reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    finePointerMq = window.matchMedia('(hover: hover) and (pointer: fine)')

    syncReducedMotion()
    syncFinePointer()
    syncVisibility()

    bindMediaQuery(reducedMotionMq, syncReducedMotion)
    bindMediaQuery(finePointerMq, syncFinePointer)
    document.addEventListener('visibilitychange', syncVisibility)
  })

  onBeforeUnmount(() => {
    unbindMediaQuery(reducedMotionMq, syncReducedMotion)
    unbindMediaQuery(finePointerMq, syncFinePointer)
    document.removeEventListener('visibilitychange', syncVisibility)
  })

  const canAnimate = computed(() => isPageVisible.value && !prefersReducedMotion.value)
  const canUsePointerEffects = computed(() => canAnimate.value && hasFinePointer.value)

  return {
    prefersReducedMotion,
    hasFinePointer,
    isPageVisible,
    canAnimate,
    canUsePointerEffects,
  }
}
