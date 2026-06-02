import type { CaptureAsset, SearchDocument } from '../../types/content'
import { getDateSortTimestamp } from '../../utils/date'
import { generatedCaptureAssets } from './generated'

export function getCaptureAssets(): CaptureAsset[] {
  return generatedCaptureAssets.slice().sort((a, b) => getDateSortTimestamp(b.date) - getDateSortTimestamp(a.date))
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
