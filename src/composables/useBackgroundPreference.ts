import { ref } from 'vue'

const dynamicBackgroundEnabled = ref(false)
let initialized = false

function applyClass(enabled: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dynamic-background-enabled', enabled)
}

function initBackgroundPreference() {
  if (initialized) return
  initialized = true

  try {
    dynamicBackgroundEnabled.value = localStorage.getItem('dynamicBackgroundEnabled') === '1'
  } catch {
    dynamicBackgroundEnabled.value = false
  }

  applyClass(dynamicBackgroundEnabled.value)
}

function setDynamicBackgroundEnabled(enabled: boolean) {
  dynamicBackgroundEnabled.value = enabled
  applyClass(enabled)

  try {
    localStorage.setItem('dynamicBackgroundEnabled', enabled ? '1' : '0')
  } catch {
    // Local storage may be blocked; keep the in-memory preference.
  }
}

export function useBackgroundPreference() {
  initBackgroundPreference()

  return {
    dynamicBackgroundEnabled,
    setDynamicBackgroundEnabled,
    toggleDynamicBackground: () => setDynamicBackgroundEnabled(!dynamicBackgroundEnabled.value),
  }
}
