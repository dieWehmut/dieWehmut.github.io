<template>
  <section
    class="console-month-navigator"
    aria-label="Monthly results"
    @keydown.left.prevent="move(-1, true)"
    @keydown.right.prevent="move(1, true)"
  >
    <template v-if="months.length">
      <header class="console-month-navigator__header" role="tablist" aria-label="Dates">
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

useConsoleRowNavigation(move)
</script>

<style scoped>
.console-month-navigator {
  outline: none;
}

.console-month-navigator__header {
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 54px;
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
