import { onBeforeUnmount, onMounted } from 'vue'
import {
  CONSOLE_RESULT_NAVIGATION_EVENT,
  type ConsoleResultNavigationAction,
} from '../console/selection'

/**
 * The vertical twin of `useConsoleRowNavigation`: Up/Down/Enter on an empty
 * prompt walk whatever list the current page prints below its top row.
 *
 * `handle` returns whether it consumed the key. Reporting that back matters
 * because the shell dispatches this event cancelably and reads the cancelled
 * flag as "handled" — an unclaimed key falls through to the prompt itself, so
 * Up still recalls history on a page whose list is already at its top edge.
 */
export function useConsoleResultNavigation(
  handle: (action: ConsoleResultNavigationAction) => boolean,
): void {
  function handleResultNavigation(event: Event) {
    const action = (event as CustomEvent<ConsoleResultNavigationAction>).detail
    if (action !== 'previous' && action !== 'next' && action !== 'activate') return
    if (handle(action)) event.preventDefault()
  }

  onMounted(() => window.addEventListener(CONSOLE_RESULT_NAVIGATION_EVENT, handleResultNavigation))
  onBeforeUnmount(() => window.removeEventListener(CONSOLE_RESULT_NAVIGATION_EVENT, handleResultNavigation))
}
