import type { ArchivePost, NoteEntry } from '../../types/content'
import { generatedDocMeta, type GeneratedDocMeta } from './generated'

type DocMeta = {
  id?: string
  title?: string
  date?: string
  tags?: string
  summary?: string
  category?: string
  type?: string
}

type LoadedDoc = GeneratedDocMeta & {
  body: string
}

const rawDocLoaders = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const loadedDocCache = new Map<string, Promise<LoadedDoc | null>>()

function stripQuotes(value: string) {
  return value.replace(/^['"]|['"]$/g, '')
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data: DocMeta = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const index = trimmed.indexOf(':')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = stripQuotes(trimmed.slice(index + 1).trim())
    if (key) data[key as keyof DocMeta] = value
  }
  return { data, content: match[2] || '' }
}

function normalizeDocAssetPath(docPath: string, assetPath: string) {
  if (!assetPath || /^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) return assetPath
  if (assetPath.startsWith('/capture-assets/')) return assetPath
  if (assetPath.startsWith('/')) return assetPath

  const normalizedDocPath = docPath.replace(/\\/g, '/').replace(/^\.\//, '')
  const docParts = normalizedDocPath.split('/').filter(Boolean)
  const docDir = docParts.slice(0, -1)
  const relativeParts = assetPath.replace(/\\/g, '/').split('/')
  const resolved = [...docDir]

  for (const part of relativeParts) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (resolved.length > 0) resolved.pop()
      continue
    }
    resolved.push(part)
  }

  if (!resolved.length) return assetPath
  return `/capture-assets/docs/${resolved.join('/')}`
}

function rewriteDocAssetPaths(docPath: string, body: string) {
  return body
    .replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (_full, alt: string, rawPath: string, suffix: string) => {
      const normalized = normalizeDocAssetPath(docPath, rawPath.trim())
      return `![${alt}](${normalized}${suffix || ''})`
    })
    .replace(/(<img\b[^>]*src=['"])([^'"]+)(['"][^>]*>)/gi, (_full, prefix: string, rawPath: string, suffix: string) => {
      const normalized = normalizeDocAssetPath(docPath, rawPath.trim())
      return `${prefix}${normalized}${suffix}`
    })
}

function entryFromMeta(meta: GeneratedDocMeta): ArchivePost | NoteEntry {
  return {
    id: meta.id,
    title: meta.title,
    date: meta.date,
    tags: meta.tags,
    summary: meta.summary,
    wordCount: meta.wordCount,
    readingMinutes: meta.readingMinutes,
    updated: meta.updated,
  }
}

export function getDocPosts(): ArchivePost[] {
  return generatedDocMeta
    .filter((doc) => doc.type === 'post')
    .map(entryFromMeta)
}

export function getDocNotes(): NoteEntry[] {
  return generatedDocMeta
    .filter((doc) => doc.type === 'note')
    .map(entryFromMeta)
}

export function getDocMeta(type: 'post' | 'note', id: string): GeneratedDocMeta | null {
  return generatedDocMeta.find((doc) => doc.type === type && doc.id === id) || null
}

export function loadDoc(type: 'post' | 'note', id: string): Promise<LoadedDoc | null> {
  const key = `${type}:${id}`
  const existing = loadedDocCache.get(key)
  if (existing) return existing

  const loadPromise = (async () => {
    const meta = getDocMeta(type, id)
    if (!meta) return null

    const loader = rawDocLoaders[meta.path]
    if (!loader) return null

    const raw = await loader()
    const { content } = parseFrontmatter(raw)
    return {
      ...meta,
      body: rewriteDocAssetPaths(meta.path, content.trim()),
    }
  })()

  loadedDocCache.set(key, loadPromise)
  return loadPromise
}

export function preloadDoc(type: 'post' | 'note', id: string): void {
  void loadDoc(type, id)
}
