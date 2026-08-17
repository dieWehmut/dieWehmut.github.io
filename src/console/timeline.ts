import type { ConsoleTimelineMonth } from './types'

export const CONSOLE_MONTH_NAVIGATION_EVENT = 'nexus:console-month-navigate'

function monthKey(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
  }

  const text = String(value ?? '').trim()
  const match = /^(\d{4})-(\d{1,2})/.exec(text)
  if (!match) return null
  return `${match[1]}-${match[2].padStart(2, '0')}`
}

export function groupConsoleTimelineMonths<T>(
  items: readonly T[],
  getDate: (item: T) => unknown,
): ConsoleTimelineMonth<T>[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = monthKey(getDate(item))
    if (!key) continue
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, groupedItems]) => ({ key, items: groupedItems }))
}

export function moveConsoleMonth(index: number, delta: number, count: number): number {
  if (count <= 0) return 0
  const normalizedIndex = ((index % count) + count) % count
  return (normalizedIndex + delta + count) % count
}

export function consoleMonthHash(key: string): string {
  return `#month-${key}`
}
