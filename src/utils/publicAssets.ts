const PUBLIC_ASSET_PREFIXES = ['/capture-assets/']

function isExternalOrEmbeddedUrl(value: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value)
}

export function resolvePublicAssetUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || isExternalOrEmbeddedUrl(trimmed)) return value

  const matchingPrefix = PUBLIC_ASSET_PREFIXES.find((prefix) => trimmed.startsWith(prefix))
  if (!matchingPrefix) return value

  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return trimmed

  return `${base.replace(/\/+$/, '')}${trimmed}`
}
