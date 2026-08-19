import { readonly, ref } from 'vue'
import type { ConsoleIconForm } from '../types/content'
import { siteConfig } from '../data/site/config'

export const CONSOLE_ICON_FORM_STORAGE_KEY = 'consoleIconForm'

/**
 * The four ways the console portrait can be drawn, in the order clicking it
 * cycles them. Order is the contract: the picker lists them this way and the
 * click walks the same ring, so the two never disagree. How each one is worded
 * is not settled here — that text is translated, and lives with the rest of the
 * console's messages under `console.option.icon`.
 */
export const consoleIconForms: readonly ConsoleIconForm[] = [
  'grayscale',
  'whiten',
  'original',
  'pixelated',
]

function parseIconForm(value: unknown): ConsoleIconForm | null {
  const candidate = String(value ?? '').trim().toLowerCase() as ConsoleIconForm
  return consoleIconForms.includes(candidate) ? candidate : null
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
  const index = consoleIconForms.indexOf(iconForm.value)
  return setConsoleIconForm(consoleIconForms[(index + 1) % consoleIconForms.length])
}

export function useConsoleIconPreference() {
  initConsoleIconPreference()

  return {
    iconForm: readonly(iconForm),
    setIconForm: setConsoleIconForm,
    cycleIconForm: cycleConsoleIconForm,
  }
}
