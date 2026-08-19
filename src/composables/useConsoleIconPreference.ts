import { computed, readonly, ref } from 'vue'
import type { ConsoleIconForm } from '../types/content'
import { siteConfig } from '../data/site/config'

export const CONSOLE_ICON_FORM_STORAGE_KEY = 'consoleIconForm'

/**
 * The four ways the console portrait can be drawn, in the order clicking it
 * cycles them. Order is the contract: the picker lists them this way and the
 * click walks the same ring, so the two never disagree.
 */
export const consoleIconFormOptions: readonly { id: ConsoleIconForm; label: string }[] = [
  { id: 'grayscale', label: 'Drain the icon to gray' },
  { id: 'whiten', label: 'Flatten the icon to a silhouette' },
  { id: 'original', label: 'Leave the icon as authored' },
  { id: 'pixelated', label: 'Resample the icon into coarse pixels' },
]

const consoleIconFormIds = consoleIconFormOptions.map((option) => option.id)

function parseIconForm(value: unknown): ConsoleIconForm | null {
  const candidate = String(value ?? '').trim().toLowerCase() as ConsoleIconForm
  return consoleIconFormIds.includes(candidate) ? candidate : null
}

/** The site config is the template's default; a reader's own choice outranks it. */
const iconForm = ref<ConsoleIconForm>(parseIconForm(siteConfig.console?.iconForm) || 'grayscale')
let initialized = false

function initConsoleIconPreference() {
  if (initialized) return
  initialized = true

  try {
    const saved = parseIconForm(localStorage.getItem(CONSOLE_ICON_FORM_STORAGE_KEY))
    if (saved) iconForm.value = saved
  } catch {
    // Local storage may be blocked; the configured default stays in force.
  }
}

function setConsoleIconForm(next: ConsoleIconForm) {
  const parsed = parseIconForm(next)
  if (!parsed) return iconForm.value
  iconForm.value = parsed

  try {
    localStorage.setItem(CONSOLE_ICON_FORM_STORAGE_KEY, parsed)
  } catch {
    // Local storage may be blocked; keep the in-memory preference.
  }
  return parsed
}

function cycleConsoleIconForm() {
  const index = consoleIconFormIds.indexOf(iconForm.value)
  return setConsoleIconForm(consoleIconFormIds[(index + 1) % consoleIconFormIds.length])
}

export function useConsoleIconPreference() {
  initConsoleIconPreference()

  return {
    iconForm: readonly(iconForm),
    iconFormOptions: computed(() => consoleIconFormOptions),
    setIconForm: setConsoleIconForm,
    cycleIconForm: cycleConsoleIconForm,
  }
}
