import { ref } from 'vue'

/**
 * Whether the classic desktop shell hides its left sidebar and runs the content
 * as a single column. Only the desktop shell honours this: on mobile the same
 * width token drives the slide-in drawer, so collapsing it there would leave the
 * drawer with no width to open into.
 */
const sidebarCollapsed = ref(false)
let initialized = false

function applyClass(collapsed: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('sidebar-collapsed', collapsed)
}

function initSidebarPreference() {
  if (initialized) return
  initialized = true

  try {
    sidebarCollapsed.value = localStorage.getItem('sidebarCollapsed') === '1'
  } catch {
    sidebarCollapsed.value = false
  }

  applyClass(sidebarCollapsed.value)
}

function setSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsed.value = collapsed
  applyClass(collapsed)

  try {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0')
  } catch {
    // Local storage may be blocked; keep the in-memory preference.
  }
}

export function useSidebarPreference() {
  initSidebarPreference()

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebarCollapsed: () => setSidebarCollapsed(!sidebarCollapsed.value),
  }
}
