<template>
  <section
    v-if="months.length"
    class="console-month-navigator"
    tabindex="0"
    aria-label="Monthly results"
    @keydown.left.prevent="move(-1)"
    @keydown.right.prevent="move(1)"
  >
    <header class="console-month-navigator__header">
      <button type="button" aria-label="Previous month" title="Previous month" :disabled="!canMovePrevious" @click="move(-1)">&lt;</button>
      <div>
        <span>{{ current?.yearLabel || '' }} / {{ current?.label || '' }}</span>
        <strong>{{ currentIndex + 1 }} / {{ months.length }}</strong>
      </div>
      <button type="button" aria-label="Next month" title="Next month" :disabled="!canMoveNext" @click="move(1)">&gt;</button>
    </header>

    <div v-if="current" class="console-month-navigator__items">
      <slot v-for="(item, index) in current.items" :item="item" :index="index" />
    </div>
    <p v-else class="console-month-navigator__empty">No entries.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { moveConsoleMonth } from '../../console/timeline'

export interface ConsoleMonthGroup {
  id?: string
  key?: string
  label: string
  yearLabel?: string
  timestamp?: number
  items: readonly unknown[]
}

const props = defineProps<{ months: readonly ConsoleMonthGroup[] }>()
const currentIndex = ref(0)

const current = computed(() => props.months[currentIndex.value])
const canMovePrevious = computed(() => currentIndex.value > 0)
const canMoveNext = computed(() => currentIndex.value < props.months.length - 1)

watch(
  () => props.months.length,
  (count) => {
    currentIndex.value = moveConsoleMonth(currentIndex.value, 0, count)
  },
  { immediate: true },
)

function move(delta: number) {
  currentIndex.value = moveConsoleMonth(currentIndex.value, delta, props.months.length)
}
</script>

<style scoped>
.console-month-navigator {
  outline: none;
}

.console-month-navigator:focus-visible {
  box-shadow: 0 0 0 1px var(--console-border-strong);
}

.console-month-navigator__header {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  margin-bottom: 12px;
  border-top: 1px solid var(--console-border);
  border-bottom: 1px solid var(--console-border);
}

.console-month-navigator__header button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--console-border-strong);
  color: var(--console-accent);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 1.1rem;
}

.console-month-navigator__header button:last-child {
  justify-self: end;
}

.console-month-navigator__header button:hover:not(:disabled),
.console-month-navigator__header button:focus-visible:not(:disabled) {
  color: var(--console-text);
  background: var(--console-selection);
  outline: none;
}

.console-month-navigator__header button:disabled {
  border-color: var(--console-border);
  color: var(--console-dim);
  cursor: default;
}

.console-month-navigator__header div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.console-month-navigator__header span {
  overflow: hidden;
  color: var(--console-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-month-navigator__header strong {
  flex: 0 0 auto;
  color: var(--console-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.console-month-navigator__items {
  display: grid;
  gap: 9px;
}

.console-month-navigator__empty {
  color: var(--console-muted);
}
</style>
