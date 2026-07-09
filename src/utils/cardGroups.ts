export const CARD_GROUP_LIMIT = 9

export function limitCardGroup<T>(items: readonly T[], limit = CARD_GROUP_LIMIT): T[] {
  return items.slice(0, limit)
}
