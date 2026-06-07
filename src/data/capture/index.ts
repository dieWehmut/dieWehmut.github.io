import type { CaptureAsset, SearchDocument } from '../../types/content'
import { getDateSortTimestamp } from '../../utils/date'
import { resolvePublicAssetUrl } from '../../utils/publicAssets'
import { generatedCaptureAssets } from './generated'

const captureTitleDatePartPattern = String.raw`(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?`
const captureTitleDatePattern = new RegExp(`^${captureTitleDatePartPattern}$`)
const captureTitleDateRangePattern = new RegExp(`^${captureTitleDatePartPattern}\\s*->\\s*${captureTitleDatePartPattern}$`)

function resolveCaptureDateFromTitle(title: string, date: string): string {
  const titleDate = title.match(captureTitleDatePattern)
  if (titleDate && (!date || date === titleDate[1])) {
    return `${titleDate[1]} ${titleDate[2]}`
  }

  const titleRange = title.match(captureTitleDateRangePattern)
  if (!titleRange) return date

  const [, startDate, startTime, endDate, endTime] = titleRange
  const dateRange = `${startDate} - ${endDate}`
  if (!date || date === dateRange) {
    return `${startDate} ${startTime} - ${endDate} ${endTime}`
  }

  return date
}

export function normalizeCaptureAsset(asset: CaptureAsset): CaptureAsset {
  const title = String(asset.title || '').trim()
  const date = String(asset.date || '').trim()

  return {
    ...asset,
    image: resolvePublicAssetUrl(asset.image),
    title,
    date: resolveCaptureDateFromTitle(title, date),
  }
}

export function normalizeCaptureAssets(assets: CaptureAsset[]): CaptureAsset[] {
  return assets.map(normalizeCaptureAsset)
}

export function getCaptureAssets(): CaptureAsset[] {
  return normalizeCaptureAssets(generatedCaptureAssets)
    .slice()
    .sort((a, b) => getDateSortTimestamp(b.date) - getDateSortTimestamp(a.date))
}

export function getCaptureAssetById(id: string): CaptureAsset | null {
  const normalizedId = decodeURIComponent(id).trim()
  if (!normalizedId) return null
  return getCaptureAssets().find((asset) => asset.id === normalizedId) || null
}

export function getCaptureSearchDocuments(): SearchDocument[] {
  return getCaptureAssets().map((asset) => ({
    id: `capture:${asset.id}`,
    type: 'capture',
    title: asset.title || asset.id,
    description: asset.summary || asset.sourceRefs.map((item) => item.title).join(' · ') || 'Capture asset',
    url: '/capture',
    date: asset.date,
    tags: asset.tags,
  }))
}

export function getCaptureAssetsByTag(tag: string): CaptureAsset[] {
  const normalizedTag = tag.trim().toLowerCase()
  if (!normalizedTag) return []
  return getCaptureAssets().filter((asset) => asset.tags.some((assetTag) => assetTag.toLowerCase() === normalizedTag))
}

export function getCaptureTagCounts(): Map<string, number> {
  const counts = new Map<string, number>()
  for (const asset of getCaptureAssets()) {
    for (const tag of asset.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }
  return counts
}

export function getCaptureTagPreviews(limit = 5): Map<string, CaptureAsset[]> {
  const previews = new Map<string, CaptureAsset[]>()
  for (const asset of getCaptureAssets()) {
    for (const tag of asset.tags || []) {
      const items = previews.get(tag) || []
      if (items.length < limit) items.push(asset)
      previews.set(tag, items)
    }
  }
  return previews
}
