const DEFAULT_HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6'

const HEADING_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  colon: ':',
  gt: '>',
  lt: '<',
  newline: '\n',
  nbsp: '\u00a0',
  quot: '"',
  tab: '\t',
}

export type WaitForHeadingOptions = {
  getRoot: () => ParentNode | null
  hash: string
  selector?: string
  timeoutMs?: number
  signal?: AbortSignal
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|colon|gt|lt|newline|nbsp|quot|tab);/giu,
    (match, entity: string) => {
      const normalized = entity.toLowerCase()
      if (!normalized.startsWith('#')) return HEADING_ENTITIES[normalized] || match

      const radix = normalized.startsWith('#x') ? 16 : 10
      const digits = normalized.slice(radix === 16 ? 2 : 1)
      const codePoint = Number.parseInt(digits, radix)
      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match
      return String.fromCodePoint(codePoint)
    },
  )
}

export function plainHeadingText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, ''))
}

export function normalizeHeadingText(value: string): string {
  return plainHeadingText(value)
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase()
}

export function slugifyHeadingText(value: string): string {
  const plain = plainHeadingText(value)
  const slug = plain
    .replace(/\s+/gu, '-')
    .replace(/[^\w\u4e00-\u9fff-]/gu, '')
    .toLowerCase()
  return slug || 'section'
}

export function decodeHeadingHash(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function getUniqueHeadingId(base: string, registry: Map<string, number>): string {
  const normalizedBase = base || 'section'
  const next = (registry.get(normalizedBase) || 0) + 1
  registry.set(normalizedBase, next)
  return next === 1 ? normalizedBase : `${normalizedBase}-${next}`
}

function ownerDocumentFor(root: ParentNode | null): Document | null {
  if (typeof document === 'undefined') return null
  if (typeof Document !== 'undefined' && root instanceof Document) return root
  return (root as Element | null)?.ownerDocument || document
}

function containsTarget(root: ParentNode, target: Element): boolean {
  if (typeof Document !== 'undefined' && root instanceof Document) return true
  return Boolean((root as Element).contains?.(target))
}

export function resolveHeading(
  root: ParentNode,
  hash: string,
  selector = DEFAULT_HEADING_SELECTOR,
): HTMLElement | null {
  const decoded = decodeHeadingHash(hash)
  if (!decoded) return null

  let headings: HTMLElement[] = []
  try {
    headings = Array.from(root.querySelectorAll<HTMLElement>(selector))
  } catch {
    return null
  }

  const exactHeading = headings.find((heading) => heading.id === decoded)
  if (exactHeading) return exactHeading

  const documentRoot = ownerDocumentFor(root)
  const exactElement = documentRoot?.getElementById(decoded)
  if (exactElement && containsTarget(root, exactElement)) {
    return exactElement as HTMLElement
  }

  const slug = slugifyHeadingText(decoded)
  const slugHeading = headings.find((heading) => heading.id === slug)
  if (slugHeading) return slugHeading

  const normalized = normalizeHeadingText(decoded)
  return headings.find((heading) => {
    const title = heading.dataset.mdHeadingTitle
      || heading.getAttribute('data-scroll-title')
      || heading.textContent
      || ''
    return normalizeHeadingText(title) === normalized
  }) || null
}

export function canonicalHeadingHash(id: string): string {
  return id ? `#${id}` : ''
}

export function scrollHeadingIntoView(
  element: HTMLElement,
  offset: number,
  behavior: ScrollBehavior = 'smooth',
): void {
  const view = element.ownerDocument?.defaultView
  if (!view) return
  const top = element.getBoundingClientRect().top + view.scrollY - offset
  view.scrollTo({ top, behavior })
}

export function waitForHeading({
  getRoot,
  hash,
  selector = DEFAULT_HEADING_SELECTOR,
  timeoutMs = 8000,
  signal,
}: WaitForHeadingOptions): Promise<HTMLElement | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const startedAt = performance.now()
    let observer: MutationObserver | null = null
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    let frameHandle = 0
    let frameIsTimeout = false
    let settled = false

    const clearFrame = () => {
      if (!frameHandle) return
      if (frameIsTimeout) window.clearTimeout(frameHandle)
      else window.cancelAnimationFrame(frameHandle)
      frameHandle = 0
    }

    const finish = (target: HTMLElement | null) => {
      if (settled) return
      settled = true
      observer?.disconnect()
      observer = null
      clearFrame()
      if (timeoutHandle) clearTimeout(timeoutHandle)
      timeoutHandle = null
      signal?.removeEventListener('abort', onAbort)
      resolve(target)
    }

    const onAbort = () => finish(null)

    const schedule = (callback: () => void) => {
      if (window.requestAnimationFrame) {
        frameIsTimeout = false
        frameHandle = window.requestAnimationFrame(callback)
      } else {
        frameIsTimeout = true
        frameHandle = window.setTimeout(callback, 16)
      }
    }

    const observeRoot = () => {
      if (observer) return
      const root = getRoot() || document.body
      if (!root || !window.MutationObserver) return
      observer = new window.MutationObserver(() => attempt())
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['id', 'data-md-heading-title', 'data-scroll-title'],
      })
    }

    const attempt = () => {
      if (settled) return
      if (signal?.aborted) {
        finish(null)
        return
      }
      const root = getRoot()
      const target = root ? resolveHeading(root, hash, selector) : null
      if (target) {
        finish(target)
        return
      }
      if (performance.now() - startedAt >= timeoutMs) {
        finish(null)
        return
      }
      observeRoot()
      schedule(attempt)
    }

    timeoutHandle = setTimeout(() => finish(null), timeoutMs)
    signal?.addEventListener('abort', onAbort, { once: true })
    attempt()
  })
}
