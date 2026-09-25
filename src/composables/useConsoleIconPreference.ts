import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue'
import type { ConsoleIconForm, ConsolePortrait } from '../types/content'
import { siteConfig } from '../data/site/config'

export const CONSOLE_ICON_FORM_STORAGE_KEY = 'consoleIconForm'

/**
 * The portraits the console can wear, straight out of the site config. Only the
 * ones that name a file count: an entry without a `src` would render as a broken
 * image, which is worse than not offering it.
 */
export const consolePortraits: readonly ConsolePortrait[] = (siteConfig.console?.portraits || [])
  .map((portrait) => ({
    id: String(portrait?.id || '').trim().toLowerCase() as ConsolePortrait['id'],
    src: String(portrait?.src || '').trim(),
  }))
  .filter((portrait) => portrait.id && portrait.src)

/**
 * The finishes. They draw one of the portraits above rather than artwork of their
 * own, so they always sit after the gallery in the ring — the reader sees the
 * colourways first and the treatments of them last.
 */
export const consoleIconFinishes = ['grayscale', 'whiten'] as const

/**
 * The cutout the `whiten` finish draws. The colourways are opaque illustrations,
 * so flattening one to a single ink would flood its background instead of its
 * figure: that finish needs an artwork that is transparent where the others are
 * painted. Nothing else about it is special — it is still a portrait the reader
 * sees the colour of, which is why it is read from the config rather than
 * hard-coded.
 */
export const consoleSilhouetteSrc = String(siteConfig.console?.silhouette || '').trim()

/**
 * Every form `/icon` accepts, the plate cycles and the picker lists, in the order
 * all three walk them. Order is the contract: declared once here, so the click
 * ring and the panel can never disagree about what comes next. How each form is
 * worded is not settled here — that text is translated, and lives with the rest
 * of the console's messages under `console.option.icon`.
 */
export const consoleIconForms: readonly ConsoleIconForm[] = [
  ...consolePortraits.map((portrait) => portrait.id),
  ...consoleIconFinishes,
]

/**
 * The portrait a finish draws. Kept beside the form rather than derived from the
 * ring position, because a finish wears whichever colourway the reader looked at
 * last: draining the pink portrait and then picking yellow has to drain yellow.
 * Persisted too, so a reload does not repaint a finish with a different portrait
 * than the one it was chosen over.
 */
export const CONSOLE_ICON_BASE_STORAGE_KEY = 'consoleIconBase'

function isFinish(form: ConsoleIconForm | null): boolean {
  return Boolean(form && (consoleIconFinishes as readonly string[]).includes(form))
}

function isPortrait(id: unknown): boolean {
  const candidate = String(id ?? '').trim().toLowerCase()
  return consolePortraits.some((portrait) => portrait.id === candidate)
}

function parseIconForm(value: unknown): ConsoleIconForm | null {
  const candidate = String(value ?? '').trim().toLowerCase() as ConsoleIconForm
  return consoleIconForms.includes(candidate) ? candidate : null
}

/** The id a finish starts life with: the site's own pick, else the first colourway. */
function defaultPortraitId(): ConsoleIconForm | null {
  const configured = String(siteConfig.console?.iconForm || '').trim().toLowerCase()
  if (isPortrait(configured)) return configured as ConsoleIconForm
  return consolePortraits[0]?.id ?? null
}

function parseBasePortrait(value: unknown): ConsoleIconForm | null {
  const candidate = String(value ?? '').trim().toLowerCase()
  return isPortrait(candidate) ? (candidate as ConsoleIconForm) : null
}

const iconForm = ref<ConsoleIconForm>(parseIconForm(siteConfig.console?.iconForm) || 'grayscale')
const basePortrait = ref<ConsoleIconForm>(defaultPortraitId() || 'grayscale')
let initialized = false

function initConsoleIconPreference() {
  if (initialized) return
  initialized = true

  try {
    const saved = parseIconForm(localStorage.getItem(CONSOLE_ICON_FORM_STORAGE_KEY))
    if (saved) iconForm.value = saved
    const savedBase = parseBasePortrait(localStorage.getItem(CONSOLE_ICON_BASE_STORAGE_KEY))
    if (savedBase) basePortrait.value = savedBase
  } catch {
    // Local storage may be blocked; the configured default stays in force.
  }
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Local storage may be blocked; keep the in-memory preference.
  }
}

function setConsoleIconForm(next: ConsoleIconForm) {
  const parsed = parseIconForm(next)
  if (!parsed) return iconForm.value
  iconForm.value = parsed
  persist(CONSOLE_ICON_FORM_STORAGE_KEY, parsed)

  // Choosing a colourway moves the finishes' subject with it, so a reader who
  // picks yellow and then asks for gray gets a gray yellow portrait.
  if (isPortrait(parsed)) {
    basePortrait.value = parsed
    persist(CONSOLE_ICON_BASE_STORAGE_KEY, parsed)
  }
  return parsed
}

/**
 * The artwork the current form draws: the colourway itself, or — for a finish —
 * whatever that finish paints. `whiten` draws the cutout when one is configured,
 * since no colourway can stand in for it; `grayscale` has no such need, because
 * draining a full-colour portrait is exactly what it means.
 */
function portraitFor(form: ConsoleIconForm | null = iconForm.value): ConsolePortrait | null {
  if (form === 'whiten' && consoleSilhouetteSrc) {
    return { id: 'whiten', src: consoleSilhouetteSrc }
  }
  const wanted = isFinish(form) ? basePortrait.value : form
  return consolePortraits.find((portrait) => portrait.id === wanted) || null
}

function cycleConsoleIconForm() {
  const index = consoleIconForms.indexOf(iconForm.value)
  // An empty ring would make the modulo below a division by zero.
  if (index === -1) return iconForm.value
  return setConsoleIconForm(consoleIconForms[(index + 1) % consoleIconForms.length])
}

export function useConsoleIconPreference(): {
  iconForm: Readonly<Ref<ConsoleIconForm>>
  portrait: ComputedRef<ConsolePortrait | null>
  setIconForm: (next: ConsoleIconForm) => ConsoleIconForm
  cycleIconForm: () => ConsoleIconForm
} {
  initConsoleIconPreference()

  return {
    iconForm: readonly(iconForm),
    portrait: computed(() => portraitFor()),
    setIconForm: setConsoleIconForm,
    cycleIconForm: cycleConsoleIconForm,
  }
}
