export type AnnotationPoint = { x: number; y: number }
export type ImageAnnotation = {
  id: string
  color: string
} & (
  | { kind: 'pen' | 'highlighter'; width: number; points: AnnotationPoint[] }
  | { kind: 'text'; x: number; y: number; size: number; text: string }
)

const DATABASE = 'nexus-image-annotations'
const STORE = 'images'
export const MAX_IMAGE_ANNOTATIONS = 500
export const MAX_STROKE_POINTS = 4000
const memory = new Map<string, ImageAnnotation[]>()
const unsaved = new Set<string>()
const listeners = new Set<(key: string, items: ImageAnnotation[]) => void>()
let database: Promise<IDBDatabase> | null = null

export function annotationImageKey(src: string, base = document.baseURI): string {
  const url = new URL(src, base)
  url.hash = ''
  return url.href
}

const unit = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1

export function normalizeImageAnnotations(value: unknown): ImageAnnotation[] {
  if (!Array.isArray(value)) return []
  const result: ImageAnnotation[] = []
  for (const item of value.slice(0, MAX_IMAGE_ANNOTATIONS)) {
    if (!item || typeof item.id !== 'string' || item.id.length > 100 || !/^#[\da-f]{6}$/i.test(item.color)) continue
    const base = { id: item.id, color: item.color }
    if (item.kind === 'text' && unit(item.x) && unit(item.y) && unit(item.size) && item.size > 0 && typeof item.text === 'string') {
      const text = item.text.slice(0, 2000).trim()
      if (text) result.push({ ...base, kind: 'text', x: item.x, y: item.y, size: item.size, text })
    } else if ((item.kind === 'pen' || item.kind === 'highlighter') && unit(item.width) && item.width > 0 && Array.isArray(item.points)) {
      const points = item.points.slice(0, MAX_STROKE_POINTS).filter((p: AnnotationPoint) => p && unit(p.x) && unit(p.y))
        .map((p: AnnotationPoint) => ({ x: p.x, y: p.y }))
      if (points.length) result.push({ ...base, kind: item.kind, width: item.width, points })
    }
  }
  return result
}

function openDatabase(): Promise<IDBDatabase> {
  if (database) return database
  database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'image' })
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = null }
      resolve(request.result)
    }
    request.onerror = () => reject(request.error || new Error('Local annotation storage unavailable'))
    request.onblocked = () => reject(new Error('Local annotation storage is blocked'))
  }).catch((error) => { database = null; throw error })
  return database
}

export function cachedImageAnnotations(key: string): ImageAnnotation[] {
  return memory.get(key) || []
}

export function imageAnnotationsAreTemporary(key: string): boolean {
  return unsaved.has(key)
}

export function subscribeImageAnnotations(listener: (key: string, items: ImageAnnotation[]) => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export async function readImageAnnotations(key: string): Promise<ImageAnnotation[]> {
  if (memory.has(key)) return cachedImageAnnotations(key)
  const db = await openDatabase()
  if (memory.has(key)) return cachedImageAnnotations(key)
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      // A drawing made while the initial read was pending must win over old disk data.
      if (memory.has(key)) { resolve(cachedImageAnnotations(key)); return }
      const items = normalizeImageAnnotations(request.result?.items)
      memory.set(key, items)
      resolve(items)
    }
  })
}

export async function writeImageAnnotations(key: string, annotations: ImageAnnotation[]): Promise<void> {
  const items = normalizeImageAnnotations(annotations)
  memory.set(key, items)
  unsaved.add(key)
  for (const listener of listeners) listener(key, items)
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    const store = transaction.objectStore(STORE)
    if (items.length) store.put({ image: key, version: 1, items, updatedAt: Date.now() })
    else store.delete(key)
    transaction.oncomplete = () => {
      if (memory.get(key) === items) unsaved.delete(key)
      resolve()
    }
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error || new Error('Local annotation save cancelled'))
  })
}
