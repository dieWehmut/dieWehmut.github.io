import { onBeforeUnmount, onMounted } from 'vue'
import { CONSOLE_ROW_NAVIGATION_EVENT } from '../console/selection'

/**
 * Subscribes a component to the console prompt's Left/Right keys for as long as
 * it is mounted. `step` receives -1 or 1. Any component that draws the page's
 * top row can join by calling this — the shell needs no list of them.
 */
export function useConsoleRowNavigation(step: (delta: number) => void): void {
  function handleRowNavigation(event: Event) {
    const delta = (event as CustomEvent<number>).detail
    if (delta === -1 || delta === 1) step(delta)
  }

  onMounted(() => window.addEventListener(CONSOLE_ROW_NAVIGATION_EVENT, handleRowNavigation))
  onBeforeUnmount(() => window.removeEventListener(CONSOLE_ROW_NAVIGATION_EVENT, handleRowNavigation))
}
