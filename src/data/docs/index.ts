import type { ArchivePost, NoteEntry } from '../../types/content'
import { excerptFromMarkdown } from '../../utils/markdown'

type DocMeta = {
  id?: string
  title?: string
  date?: string
  tags?: string
  summary?: string
  category?: string
  type?: string
}

type ParsedDoc = {
  id: string
  type: 'post' | 'note'
  title: string
  date: string
  tags: string[]
  body: string
  assetPaths: string[]
  summary?: string
}

const rawDocs = import.meta.glob('./**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

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

function parseTags(raw?: string) {
  if (!raw) return []
  const value = raw.trim()
  if (!value) return []
  const normalized = value.startsWith('[') && value.endsWith(']')
    ? value.slice(1, -1)
    : value
  return normalized
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function docIdFromPath(path: string) {
  const filename = path.split('/').pop() || ''
  return filename.replace(/\.md$/i, '')
}

function normalizeDocAssetPath(docPath: string, assetPath: string) {
  if (!assetPath || /^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) return assetPath
  if (assetPath.startsWith('/capture-assets/')) return assetPath
  if (assetPath.startsWith('/')) return assetPath

  const normalizedDocPath = docPath.replace(/\\/g, '/').replace(/^\.\//, '')
  const docParts = normalizedDocPath.split('/').filter(Boolean)
  const docsIndex = docParts.indexOf('docs')
  const relativeDocParts = docsIndex === -1 ? docParts : docParts.slice(docsIndex + 1)
  const docDir = relativeDocParts.slice(0, -1)
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

function collectDocAssetPaths(docPath: string, body: string) {
  const found = new Set<string>()
  const markdownPattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  const htmlPattern = /<img\b[^>]*src=['"]([^'"]+)['"][^>]*>/gi

  let match: RegExpExecArray | null

  while ((match = markdownPattern.exec(body)) !== null) {
    const normalized = normalizeDocAssetPath(docPath, match[1].trim())
    if (normalized.startsWith('/capture-assets/')) found.add(normalized)
  }

  while ((match = htmlPattern.exec(body)) !== null) {
    const normalized = normalizeDocAssetPath(docPath, match[1].trim())
    if (normalized.startsWith('/capture-assets/')) found.add(normalized)
  }

  return Array.from(found)
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

const parsedDocs: ParsedDoc[] = Object.entries(rawDocs).map(([path, raw]) => {
  const { data, content } = parseFrontmatter(raw)
  const type = data.type === 'note' || path.includes('/notes/') ? 'note' : 'post'
  const id = data.id || docIdFromPath(path)
  const title = data.title || id
  const date = data.date || ''
  const tags = parseTags(data.tags)
  const body = rewriteDocAssetPaths(path, content.trim())
  const assetPaths = collectDocAssetPaths(path, content.trim())

  return { id, type, title, date, tags, body, assetPaths }
})

function docSummary(doc: ParsedDoc): string {
  if (doc.summary === undefined) {
    doc.summary = excerptFromMarkdown(doc.body)
  }
  return doc.summary
}

export function getDocPosts(): ArchivePost[] {
  return parsedDocs
    .filter((doc) => doc.type === 'post')
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      date: doc.date,
      tags: doc.tags,
      get summary() {
        return docSummary(doc)
      },
      body: doc.body,
      assetPaths: doc.assetPaths,
    }))
}

export function getDocNotes(): NoteEntry[] {
  return parsedDocs
    .filter((doc) => doc.type === 'note')
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      date: doc.date,
      tags: doc.tags,
      get summary() {
        return docSummary(doc)
      },
      body: doc.body,
      assetPaths: doc.assetPaths,
    }))
}
