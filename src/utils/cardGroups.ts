export const CARD_GROUP_LIMIT = Infinity

export function limitCardGroup<T>(items: readonly T[], limit = CARD_GROUP_LIMIT): T[] {
  return items.slice(0, limit)
}

export function hiddenCardCount(items: readonly unknown[], limit = CARD_GROUP_LIMIT): number {
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
