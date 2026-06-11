import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import fileURLToPath from 'node:url'
import { execSync } from 'node:child_process'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'src', 'data', 'docs')
const generatedPath = path.join(docsDir, 'generated.ts')

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function getMarkdownFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '')
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data = {}

  for (const line of match[1].split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const index = trimmed.indexOf(':')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = stripQuotes(trimmed.slice(index + 1).trim())
    if (key) data[key] = value
  }

  return { data, content: match[2] || '' }
}

function parseTags(raw) {
  if (!raw) return []
  const value = raw.trim()
  if (!value) return []
  const normalized = value.startsWith('[') && value.endsWith(']')
    ? value.slice(1, -1)
    : value
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function docIdFromPath(filePath) {
  return path.basename(filePath, path.extname(filePath))
}

function normalizeMarkdownPreviewSource(source) {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<summary[^>]*>[\s\S]*?<\/summary>/gi, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?(?:details|summary|big|b|br|hr|img)[^>]*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s*[>|]\s?/gm, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\\\[([\s\S]+?)\\\]/g, '\\($1\\)')
    .replace(/\$\$([\s\S]+?)\$\$/g, '\\($1\\)')
    .replace(/\s+/g, ' ')
    .trim()
}

function findClosingDollar(value, start) {
  for (let index = start; index < value.length; index += 1) {
    if (value[index] !== '$') continue
    if (value[index - 1] === '\\') continue
    if (value[index + 1] === '$') continue
    return index
  }
  return -1
}

function readMathSpan(value, start) {
  if (value.startsWith('$$', start)) {
    const close = value.indexOf('$$', start + 2)
    return close === -1 ? null : { start, end: close + 2 }
  }

  if (value.startsWith('\\[', start)) {
    const close = value.indexOf('\\]', start + 2)
    return close === -1 ? null : { start, end: close + 2 }
  }

  if (value.startsWith('\\(', start)) {
    const close = value.indexOf('\\)', start + 2)
    return close === -1 ? null : { start, end: close + 2 }
  }

  if (value[start] === '$' && value[start - 1] !== '\\' && value[start + 1] !== '$') {
    const close = findClosingDollar(value, start + 1)
    return close === -1 ? null : { start, end: close + 1 }
  }

  return null
}

function adjustExcerptCutForMath(value, cut, maxExtension) {
  let index = 0

  while (index < cut) {
    const span = readMathSpan(value, index)
    if (!span) {
      index += 1
      continue
    }

    if (span.end > cut) {
      return span.end <= maxExtension ? span.end : span.start
    }

    index = span.end
  }

  return cut
}

function trimExcerptEnd(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[\s,.;:\uFF0C\u3002\uFF1B\uFF1A\u3001-]+$/g, '')
    .trim()
}

function excerptFromMarkdown(source, maxLength = 120) {
  if (!source) return ''
  const plain = normalizeMarkdownPreviewSource(source)
  if (plain.length <= maxLength) return plain

  const targetCut = Math.max(1, maxLength - 3)
  const maxMathExtension = Math.min(plain.length, maxLength + 240)
  const adjustedCut = adjustExcerptCutForMath(plain, targetCut, maxMathExtension)
  const excerpt = trimExcerptEnd(plain.slice(0, adjustedCut))

  if (!excerpt) return `${trimExcerptEnd(plain.slice(0, targetCut)).replace(/[$]+$/g, '')}...`
  return `${excerpt}...`
}

const READABLE_UNIT_PATTERN = /[A-Za-z0-9]+(?:[-_'][A-Za-z0-9]+)*/g
const CJK_UNIT_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]/g
const READABLE_UNITS_PER_MINUTE = 400

function normalizeMarkdownForWordCount(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/[`*_~>#|[\](){}\\]/g, ' ')
    .replace(/^\s{0,3}(?:[-+]|\d+[.)])\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countReadableUnits(source) {
  if (!source) return 0
  const plain = normalizeMarkdownForWordCount(source)
  const cjkCount = (plain.match(CJK_UNIT_PATTERN) || []).length
  const latinCount = (plain.replace(CJK_UNIT_PATTERN, ' ').match(READABLE_UNIT_PATTERN) || []).length
  return cjkCount + latinCount
}

function readingMinutesFor(wordCount) {
  if (!wordCount) return 0
  return Math.max(1, Math.ceil(wordCount / READABLE_UNITS_PER_MINUTE))
}

function getSortTimestamp(date) {
  if (!date) return 0
  const normalized = String(date).replace(/\//g, '-')
  const rangeMatch = normalized.match(/^\s*(\d{4}-\d{2}-\d{2})(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/)
  if (rangeMatch) return Date.parse(rangeMatch[1]) || 0
  return Date.parse(date) || 0
}

function getGitLastUpdated(filePath) {
  try {
    const output = execSync(`git log -1 --format="%ad" --date=format:"%Y/%m/%d %H:%M" -- "${filePath}"`, { stdio: 'pipe' }).toString().trim()
    return output || null
  } catch (e) {
    return null
  }
}

function toGeneratedModule(docs) {
  const serialized = JSON.stringify(docs, null, 2)
  return `export type GeneratedDocMeta = {
  id: string
  type: 'post' | 'note'
  title: string
  date: string
  tags: string[]
  summary: string
  wordCount: number
  readingMinutes: number
  updated: string
  path: string
}

export const generatedDocMeta: GeneratedDocMeta[] = ${serialized} as GeneratedDocMeta[]

export default generatedDocMeta
`
}

function main() {
  const docs = getMarkdownFiles(docsDir)
    .filter((filePath) => path.resolve(filePath) !== path.resolve(generatedPath))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8')
      const { data, content } = parseFrontmatter(raw)
      const relativePath = `./${toPosix(path.relative(docsDir, filePath))}`
      const type = data.type === 'note' || relativePath.includes('/notes/') ? 'note' : 'post'
      const id = data.id || docIdFromPath(filePath)
      const title = data.title || id
      const date = data.date || ''
      const tags = parseTags(data.tags)
      const trimmedContent = content.trim()
      const wordCount = countReadableUnits(trimmedContent)
      const updated = getGitLastUpdated(filePath) || ''

      return {
        id,
        type,
        title,
        date,
        tags,
        summary: data.summary || excerptFromMarkdown(trimmedContent),
        wordCount,
        readingMinutes: readingMinutesFor(wordCount),
        updated,
        path: relativePath,
        timestamp: getSortTimestamp(date),
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp || a.title.localeCompare(b.title))
    .map(({ timestamp, ...doc }) => doc)

  fs.writeFileSync(generatedPath, toGeneratedModule(docs), 'utf8')
  console.log(`Generated metadata for ${docs.length} markdown docs.`)
}

main()
