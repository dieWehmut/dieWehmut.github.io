export function clampScrollRatio(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function scrollRatioFromPointer(
  clientY: number,
  trackTop: number,
  trackHeight: number,
): number {
  if (!Number.isFinite(trackHeight) || trackHeight <= 0) return 0
  return clampScrollRatio((clientY - trackTop) / trackHeight)
}

export function scrollTopForRatio(ratio: number, maxScrollY: number): number {
  if (!Number.isFinite(maxScrollY) || maxScrollY <= 0) return 0
  return clampScrollRatio(ratio) * maxScrollY
}

export function scrollRatioForKey(key: string, currentRatio: number): number | null {
  const current = clampScrollRatio(currentRatio)
  if (key === 'Home') return 0
  if (key === 'End') return 1
  if (key === 'ArrowUp' || key === 'ArrowLeft') return clampScrollRatio(current - 0.02)
  if (key === 'ArrowDown' || key === 'ArrowRight') return clampScrollRatio(current + 0.02)
  if (key === 'PageUp') return clampScrollRatio(current - 0.1)
  if (key === 'PageDown') return clampScrollRatio(current + 0.1)
  return null
}
