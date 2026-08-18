<template>
  <section
    class="console-month-navigator"
    aria-label="Monthly results"
    @keydown.left.prevent="move(-1, true)"
    @keydown.right.prevent="move(1, true)"
  >
    <template v-if="months.length">
      <header class="console-month-navigator__header console-top-row" role="tablist" aria-label="Dates">
        <span class="console-month-navigator__label" aria-hidden="true">{{ percent }}%</span>
        <button
          v-for="(month, index) in months"
          :id="tabId(index)"
          :key="month.id || month.key || index"
          ref="tabRefs"
          type="button"
          role="tab"
          :tabindex="currentIndex === index ? 0 : -1"
          :aria-selected="currentIndex === index"
          aria-controls="console-month-panel"
          :class="{ 'is-selected': currentIndex === index }"
          @click="selectMonth(index)"
        >
          <span v-if="month.yearLabel">{{ month.yearLabel }}</span>
          <strong>{{ month.label }}</strong>
        </button>
      </header>

      <div
        v-if="current"
        id="console-month-panel"
        ref="itemsRef"
        class="console-month-navigator__items"
        role="tabpanel"
        :aria-labelledby="tabId(currentIndex)"
      >
        <slot v-for="(item, index) in current.items" :key="itemKey(item, index)" :item="item" :index="index" />
      </div>
    </template>
    <p v-else class="console-month-navigator__empty">No entries.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { moveConsoleMonth } from '../../console/timeline'
import { useConsoleRowNavigation } from '../../composables/useConsoleRowNavigation'
import { useConsoleResultNavigation } from '../../composables/useConsoleResultNavigation'
import { useConsoleRowAccent } from '../../composables/useConsoleRowAccent'
import type { ConsoleResultNavigationAction } from '../../console/selection'

/**
 * The boxes under the row are slot content, so they wear the host view's style
 * scope rather than this component's — a scoped selector could never reach them.
 * The cursor marker is therefore a global class, defined in `console.scss`.
 */
const CONSOLE_BOX_SELECTED_CLASS = 'console-box-selected'

export interface ConsoleMonthGroup {
  id?: string
  key?: string
  label: string
  yearLabel?: string
  timestamp?: number
  items: readonly unknown[]
}

const props = defineProps<{
  months: readonly ConsoleMonthGroup[]
  stateKey?: string
}>()
const currentIndex = ref(0)
const tabRefs = ref<HTMLButtonElement[]>([])
const itemsRef = ref<HTMLElement | null>(null)
/** -1 keeps the cursor on the row itself; 0 and up address the boxes under it. */
const itemCursor = ref(-1)
const { rowAccent } = useConsoleRowAccent()

const current = computed(() => props.months[currentIndex.value])
const stateStorageKey = computed(() => props.stateKey ? `nexus:console-month:${props.stateKey}` : '')

/** Which box of the row is selected, in the same form the section bar reports. */
const percent = computed(() => props.months.length
  ? Math.round((currentIndex.value + 1) / props.months.length * 100)
  : 0)

watch(
  [
    () => props.months.map((month, index) => monthKey(month, index)).join('\u0000'),
    () => props.stateKey,
  ],
  () => {
    const restoredIndex = restoredMonthIndex()
    currentIndex.value = restoredIndex >= 0
      ? restoredIndex
      : moveConsoleMonth(currentIndex.value, 0, props.months.length)
  },
  { immediate: true },
)

function selectMonth(index: number, focus = false) {
  currentIndex.value = moveConsoleMonth(index, 0, props.months.length)
  persistCurrentMonth()
  void nextTick(() => {
    const tab = tabRefs.value[currentIndex.value]
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    if (focus) tab?.focus()
  })
}

function move(delta: number, focus = false) {
  currentIndex.value = moveConsoleMonth(currentIndex.value, delta, props.months.length)
  selectMonth(currentIndex.value, focus)
}

function tabId(index: number) {
  return `console-month-tab-${index}`
}

function monthKey(month: ConsoleMonthGroup, index: number) {
  return String(month.id || month.key || index)
}

function restoredMonthIndex() {
  if (!stateStorageKey.value || typeof window === 'undefined') return -1
  const savedKey = window.sessionStorage.getItem(stateStorageKey.value)
  if (!savedKey) return -1
  return props.months.findIndex((month, index) => monthKey(month, index) === savedKey)
}

function persistCurrentMonth() {
  if (!stateStorageKey.value || typeof window === 'undefined') return
  const month = props.months[currentIndex.value]
  if (!month) return
  window.sessionStorage.setItem(stateStorageKey.value, monthKey(month, currentIndex.value))
}

function itemKey(item: unknown, index: number) {
  if (item && typeof item === 'object' && 'id' in item) return String(item.id)
  return index
}

/** The boxes are slot content, so the rendered children are the only list of them. */
function itemBoxes(): HTMLElement[] {
  return itemsRef.value ? Array.from(itemsRef.value.children) as HTMLElement[] : []
}

function setItemCursor(index: number) {
  itemCursor.value = Math.max(index, -1)
  void nextTick(applyItemCursor)
}

function applyItemCursor() {
  itemBoxes().forEach((box, index) => {
    const selected = index === itemCursor.value
    box.classList.toggle(CONSOLE_BOX_SELECTED_CLASS, selected)
    if (!selected) {
      box.style.removeProperty('--console-row-accent')
      return
    }
    // The cursor changes colour as it travels, exactly as it does in the prompt's
    // own menu, so the box under it is handed the same accent cycle.
    box.style.setProperty('--console-row-accent', rowAccent(index))
    box.scrollIntoView({ block: 'nearest' })
  })
}

function moveItemCursor(delta: number) {
  const boxes = itemBoxes()
  if (!boxes.length) return false
  // Up walks back out the way it came in: off the first box onto the row, then
  // off the row entirely, where Up means "recall history" again. Down never
  // leaves, so the end of a long list is a wall rather than a trapdoor.
  if (delta < 0 && itemCursor.value < 0) return false
  setItemCursor(Math.min(itemCursor.value + delta, boxes.length - 1))
  return true
}

/**
 * Only the host view knows where a box leads, so the link inside the box is the
 * answer: following it routes through the very RouterLink the mouse would have
 * used. Cards that carry the destination on their own root answer a click there.
 */
function activateItemCursor() {
  const box = itemBoxes()[itemCursor.value]
  if (!box) return false
  const link = box.matches('a[href]') ? box : box.querySelector<HTMLElement>('a[href]')
  ;(link || box).click()
  return true
}

function handleResultNavigation(action: ConsoleResultNavigationAction) {
  if (!props.months.length) return false
  if (action === 'activate') return activateItemCursor()
  return moveItemCursor(action === 'previous' ? -1 : 1)
}

// Any change of month replaces every box under the row, so the cursor goes back
// to the row it was launched from instead of pointing at a stranger.
watch(current, () => setItemCursor(-1))

useConsoleRowNavigation(move)
useConsoleResultNavigation(handleResultNavigation)
</script>

<style scoped>
.console-month-navigator {
  outline: none;
}

.console-month-navigator__header {
  display: flex;
  align-items: center;
  gap: 0;
  min-height: var(--console-top-row-height);
  margin-bottom: 12px;
  overflow-x: auto;
  border-top: 1px solid var(--console-border);
  border-bottom: 1px solid var(--console-border);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.console-month-navigator__header::-webkit-scrollbar {
  display: none;
}

.console-month-navigator__header button {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 5px 12px;
  border: 0;
  color: var(--console-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}

.console-month-navigator__header button span {
  margin-right: 5px;
  color: var(--console-dim);
}

.console-month-navigator__header button:hover,
.console-month-navigator__header button:focus-visible,
.console-month-navigator__header button.is-selected {
  color: var(--console-text);
  background: var(--console-selection);
  outline: none;
}

.console-month-navigator__header button.is-selected strong {
  color: var(--console-accent);
  font-weight: 500;
}

.console-month-navigator__label {
  position: sticky;
  left: 0;
  z-index: 1;
  align-self: stretch;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 12px;
  color: var(--console-accent);
  background: var(--console-bg);
  font-weight: 700;
}

.console-month-navigator__items {
  display: grid;
  gap: 9px;
}

.console-month-navigator__empty {
  color: var(--console-muted);
}
</style>
