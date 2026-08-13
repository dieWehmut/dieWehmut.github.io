import { shallowRef } from 'vue'

export type ReadingPathEntry = {
  activeId: string
  title: string
  progress: number
}

// Shared between ScrollSpySidebar (which tracks the section under the reader's
// scroll position) and RouteBreadcrumb (which shows that section as the last
// crumb on post/note detail pages).
const readingPath = shallowRef<ReadingPathEntry | null>(null)
const scrollRequest = shallowRef<{ id: string; nonce: number } | null>(null)

export function setReadingPath(entry: ReadingPathEntry | null) {
  readingPath.value = entry
}

export function requestScrollToSection(id: string) {
  scrollRequest.value = { id, nonce: Date.now() }
}

export function useReadingPath() {
  return readingPath
}

export function useScrollRequests() {
  return scrollRequest
}
