import { ref } from 'vue'

const viewMode = ref(true)
let initialized = false

function applyViewMode(enabled: boolean) {
  viewMode.value = enabled
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('view-mode', enabled)

    // When entering Focus mode, auto-collapse sidebar first
    if (enabled) {
      document.documentElement.classList.add('sidebar-collapsed')
      try { localStorage.setItem('sidebarCollapsed', '1') } catch (e) {}
    }
  }
  try {
    localStorage.setItem('viewMode', enabled ? '1' : '0')
  } catch (e) {}
}

function initViewMode() {
  if (initialized) return
  initialized = true
  try {
    const stored = localStorage.getItem('viewMode')
    // Default to Focus mode; only disable if user explicitly chose classic mode
    if (stored === '0') viewMode.value = false
  } catch (e) {}
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('view-mode', viewMode.value)
    if (viewMode.value) {
      document.documentElement.classList.add('sidebar-collapsed')
    }
  }
}

export function useViewMode() {
  initViewMode()
  return {
    viewMode,
    setViewMode: applyViewMode,
    toggleViewMode: () => applyViewMode(!viewMode.value),
  }
}
