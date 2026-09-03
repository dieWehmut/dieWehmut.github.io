export const MARKDOWN_SCROLL_STORAGE_KEY: string
export function isMarkdownDocumentPath(pathname: string, basePath?: string): boolean
export function markdownLocationKey(location: {
  pathname?: string
  search?: string
  hash?: string
}): string
export function createMarkdownScrollSnapshot(
  location: { pathname?: string; search?: string; hash?: string },
  view: { scrollX?: number; scrollY?: number },
  savedAt?: number,
): { key: string; x: number; y: number; savedAt: number }
export function shouldRestoreMarkdownScroll(
  snapshot: { key?: string; x?: number; y?: number; savedAt?: number } | null | undefined,
  location: { pathname?: string; search?: string; hash?: string },
  navigationType: string,
  now?: number,
  maxAgeMs?: number,
  basePath?: string,
): boolean
export function installMarkdownReloadScrollRestore(basePath?: string): () => void
