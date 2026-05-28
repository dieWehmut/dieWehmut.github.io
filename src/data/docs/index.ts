import type { ArchivePost, NoteEntry } from '../../types/content'

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
  summary?: string
  body: string
  category?: string
}

const rawDocs = import.meta.glob('./**/*.md', { eager: true, as: 'raw' }) as Record<string, string>

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

function toPlainText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerpt(text: string, maxLength = 140) {
  const clean = toPlainText(text)
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1)}…`
}

function docIdFromPath(path: string) {
  const filename = path.split('/').pop() || ''
  return filename.replace(/\.md$/i, '')
}

const parsedDocs: ParsedDoc[] = Object.entries(rawDocs).map(([path, raw]) => {
  const { data, content } = parseFrontmatter(raw)
  const type = data.type === 'note' || path.includes('/notes/') ? 'note' : 'post'
  const id = data.id || docIdFromPath(path)
  const title = data.title || (type === 'post' ? id : '')
  const date = data.date || ''
  const tags = parseTags(data.tags)
  const body = content.trim()
  const summary = data.summary || excerpt(body)

  return {
    id,
    type,
    title,
    date,
    tags,
    summary,
    body,
    category: data.category,
  }
})

export function getDocPosts(): ArchivePost[] {
  return parsedDocs
    .filter((doc) => doc.type === 'post')
    .map((doc) => ({
      id: doc.id,
      title: doc.title || doc.id,
      date: doc.date,
      summary: doc.summary || '',
      tags: doc.tags,
      category: doc.category,
      body: doc.body,
    }))
}

export function getDocNotes(): NoteEntry[] {
  return parsedDocs
    .filter((doc) => doc.type === 'note')
    .map((doc) => ({
      id: doc.id,
      date: doc.date,
      title: doc.title || undefined,
      body: toPlainText(doc.body),
      tags: doc.tags.length ? doc.tags : undefined,
    }))
}
