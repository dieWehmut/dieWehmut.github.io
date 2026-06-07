const PUBLIC_ASSET_PREFIXES = ['capture-assets/']
const ROUTE_SEGMENTS = new Set([
  'about',
  'archive',
  'capture',
  'friends',
  'infra',
  'note',
  'notes',
  'post',
  'project',
  'search',
  'tags',
])

function isExternalOrEmbeddedUrl(value: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value)
}

function stripLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '')
}

function normalizeBasePath(value: string): string {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

function getBuildBasePath(): string {
  return normalizeBasePath(import.meta.env.BASE_URL || '/')
}

function isPublicAssetPath(value: string): boolean {
  const normalized = stripLeadingSlash(value)
  return PUBLIC_ASSET_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function joinBaseAndAsset(base: string, assetPath: string): string {
  const normalizedBase = normalizeBasePath(base)
  const normalizedAsset = stripLeadingSlash(assetPath)
  return `${normalizedBase}${normalizedAsset}`.replace(/\/{2,}/g, '/')
}

function runtimeBasePath(): string {
  if (typeof window === 'undefined') return '/'

  const parts = window.location.pathname.split('/').filter(Boolean)
  if (!parts.length) return '/'

  const routeIndex = parts.findIndex((part) => ROUTE_SEGMENTS.has(decodeURIComponent(part)))
  if (routeIndex === -1) return normalizeBasePath(parts.join('/'))
  if (routeIndex === 0) return '/'
  return normalizeBasePath(parts.slice(0, routeIndex).join('/'))
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }

  return result
}

export function resolvePublicAssetUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || isExternalOrEmbeddedUrl(trimmed)) return value

  if (!isPublicAssetPath(trimmed)) return value

  const base = getBuildBasePath()
  if (base !== '/' && trimmed.startsWith(base)) return trimmed

  return joinBaseAndAsset(base, trimmed)
}

export function getPublicAssetUrlCandidates(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed || isExternalOrEmbeddedUrl(trimmed) || !isPublicAssetPath(trimmed)) return [value]

  const assetPath = stripLeadingSlash(trimmed)
  return unique([
    resolvePublicAssetUrl(trimmed),
    joinBaseAndAsset(runtimeBasePath(), assetPath),
    joinBaseAndAsset('/', assetPath),
  ])
}

function sameUrl(left: string, right: string): boolean {
  if (typeof window === 'undefined') return left === right
  try {
    return new URL(left, window.location.href).href === new URL(right, window.location.href).href
  } catch {
    return left === right
  }
}

export function retryPublicAssetImage(target: Event | HTMLImageElement, originalSrc?: string): boolean {
  const image = target instanceof HTMLImageElement ? target : target.target
  if (!(image instanceof HTMLImageElement)) return false

  const source = originalSrc || image.dataset.originalSrc || image.getAttribute('src') || ''
  const candidates = getPublicAssetUrlCandidates(source)
  const tried = new Set((image.dataset.publicAssetTried || '').split('\n').filter(Boolean))
  const current = image.getAttribute('src') || ''

  if (current) tried.add(current)
  if (image.currentSrc) tried.add(image.currentSrc)

  const next = candidates.find((candidate) => (
    !tried.has(candidate) && !sameUrl(candidate, current) && !sameUrl(candidate, image.currentSrc || current)
  ))

  image.dataset.publicAssetTried = Array.from(tried).join('\n')

  if (!next) {
    image.classList.add('is-image-failed')
    return false
  }

  image.classList.remove('is-image-failed')
  image.dataset.originalSrc = source
  image.dataset.publicAssetTried = [...tried, next].join('\n')
  image.src = next
  return true
}
