// Max preview images shown inside a single capture card group.
export const CARD_GROUP_LIMIT = 9

// Page-level card lists (Archive, Home, Tags, Project, capture groups, ...)
// render every item by default. Callers can still pass an explicit limit.
export function limitCardGroup<T>(items: readonly T[], limit = Infinity): T[] {
  return items.slice(0, limit)
}

export function hiddenCardCount(items: readonly unknown[], limit = Infinity): number {
  return Math.max(0, items.length - limit)
}

export function overflowCountForItem<T>(
  item: T,
  visibleItems: readonly T[],
  hiddenCount: number
): number {
  if (hiddenCount <= 0 || !visibleItems.length) return 0
  return visibleItems[visibleItems.length - 1] === item ? hiddenCount : 0
}
