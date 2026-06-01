import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'src', 'data', 'docs')
const manifestPath = path.join(rootDir, 'src', 'data', 'capture', 'manifest.json')
const generatedPath = path.join(rootDir, 'src', 'data', 'capture', 'generated.ts')
const publicCaptureDir = path.join(rootDir, 'public', 'capture-assets')
const captureUrlPrefix = '/capture-assets/'

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function emptyDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true })
  ensureDir(dirPath)
}

function resolveAssetsDir() {
  const envPath = process.env.DIESW_ASSETS_DIR?.trim()
  if (envPath) return path.resolve(rootDir, envPath)
  return path.resolve(rootDir, '..', 'diesw-assets')
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

function parseImages(content) {
  const images = []
  const markdownPattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  const htmlPattern = /<img\b[^>]*src=['"]([^'"]+)['"][^>]*alt=['"]([^'"]*)['"][^>]*>|<img\b[^>]*alt=['"]([^'"]*)['"][^>]*src=['"]([^'"]+)['"][^>]*>/gi

  let match
  while ((match = markdownPattern.exec(content)) !== null) {
    images.push({
      src: match[2].trim(),
      alt: match[1].trim(),
    })
  }

  while ((match = htmlPattern.exec(content)) !== null) {
    const src = (match[1] || match[4] || '').trim()
    const alt = (match[2] || match[3] || '').trim()
    if (!src) continue
    images.push({ src, alt })
  }

  return images
}

function isCaptureAssetUrl(src) {
  return src.startsWith(captureUrlPrefix)
}

function relativeAssetPathFromUrl(src) {
  return src.slice(captureUrlPrefix.length)
}

function defaultTitleFromAsset(assetPath, fallbackPrefix) {
  const base = path.basename(assetPath, path.extname(assetPath)).replace(/[-_]+/g, ' ').trim()
  if (!base) return fallbackPrefix
  return base.replace(/\b\w/g, (char) => char.toUpperCase())
}

function sortByDateDesc(items) {
  return items.slice().sort((a, b) => {
    const aTime = Date.parse(a.date || '') || 0
    const bTime = Date.parse(b.date || '') || 0
    return bTime - aTime || a.title.localeCompare(b.title)
  })
}

function loadManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : []
}

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`)
  }
}

function copyAsset(assetsDir, relativePath) {
  const sourcePath = path.join(assetsDir, relativePath)
  const destinationPath = path.join(publicCaptureDir, relativePath)
  assertFileExists(sourcePath, 'Capture asset')
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function toTsModule(data) {
  const serialized = JSON.stringify(data, null, 2)
  return `import type { CaptureAsset } from '../../types/content'\n\nexport const generatedCaptureAssets: CaptureAsset[] = ${serialized} as CaptureAsset[]\n\nexport default generatedCaptureAssets\n`
}

async function main() {
  const assetsDir = resolveAssetsDir()
  const manifestEntries = loadManifest()
  const manifestByUrl = new Map()
  for (const entry of manifestEntries) {
    const image = String(entry.image || '').trim()
    if (!image) continue
    if (!isCaptureAssetUrl(image)) {
      throw new Error(`Manifest image must use ${captureUrlPrefix}: ${image}`)
    }
    manifestByUrl.set(image, entry)
  }

  emptyDir(publicCaptureDir)

  const byImage = new Map()
  const markdownFiles = getMarkdownFiles(docsDir)
  for (const filePath of markdownFiles) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = parseFrontmatter(raw)
    const type = data.type === 'note' || toPosix(filePath).includes('/notes/') ? 'note' : 'post'
    const id = data.id || docIdFromPath(filePath)
    const title = data.title || id
    const date = data.date || ''
    const tags = parseTags(data.tags)
    const url = `/${type}/${id}`

    const seenInDoc = new Set()
    for (const image of parseImages(content)) {
      if (!isCaptureAssetUrl(image.src)) continue
      if (seenInDoc.has(image.src)) continue
      seenInDoc.add(image.src)

      const manifestEntry = manifestByUrl.get(image.src)
      if (manifestEntry?.hidden) continue

      const assetPath = relativeAssetPathFromUrl(image.src)
      const existing = byImage.get(image.src) || {
        id: manifestEntry?.id || assetPath.replace(/[\\/]/g, '-').replace(/\.[^.]+$/i, ''),
        image: image.src,
        title: manifestEntry?.title || image.alt || defaultTitleFromAsset(assetPath, title),
        date: manifestEntry?.date || date,
        tags: manifestEntry?.tags?.length ? [...manifestEntry.tags] : [...tags],
        summary: manifestEntry?.summary || '',
        sourceRefs: [],
        standalone: false,
      }

      existing.title = manifestEntry?.title || existing.title
      existing.date = manifestEntry?.date || existing.date || date
      existing.tags = manifestEntry?.tags?.length ? [...manifestEntry.tags] : existing.tags
      existing.summary = manifestEntry?.summary || existing.summary
      existing.standalone = false

      if (!existing.sourceRefs.some((item) => item.type === type && item.id === id)) {
        existing.sourceRefs.push({ type, id, title, url })
      }

      byImage.set(image.src, existing)
    }
  }

  const needsAssetsDir = byImage.size > 0 || manifestEntries.some((entry) => !entry.hidden)
  if (needsAssetsDir) {
    assertFileExists(assetsDir, 'Assets directory')
  } else if (!fs.existsSync(assetsDir)) {
    fs.writeFileSync(generatedPath, toTsModule([]), 'utf8')
    console.log('No capture assets referenced. Skipped asset sync.')
    return
  }

  for (const entry of manifestEntries) {
    if (entry.hidden) continue
    const image = String(entry.image || '').trim()
    if (!image) continue
    const assetPath = relativeAssetPathFromUrl(image)
    const existing = byImage.get(image)
    if (existing) {
      existing.id = entry.id || existing.id
      existing.title = entry.title || existing.title
      existing.date = entry.date || existing.date
      existing.tags = entry.tags?.length ? [...entry.tags] : existing.tags
      existing.summary = entry.summary || existing.summary
      existing.standalone = Boolean(entry.standalone) && existing.sourceRefs.length === 0
      byImage.set(image, existing)
      continue
    }

    byImage.set(image, {
      id: entry.id,
      image,
      title: entry.title,
      date: entry.date,
      tags: entry.tags || [],
      summary: entry.summary || '',
      sourceRefs: [],
      standalone: entry.standalone !== false,
    })
  }

  const captureAssets = sortByDateDesc(Array.from(byImage.values())).map((asset) => ({
    ...asset,
    tags: Array.from(new Set(asset.tags || [])),
    sourceRefs: asset.sourceRefs.slice().sort((a, b) => a.title.localeCompare(b.title)),
    standalone: asset.sourceRefs.length === 0 ? asset.standalone !== false : false,
  }))

  for (const asset of captureAssets) {
    copyAsset(assetsDir, relativeAssetPathFromUrl(asset.image))
  }

  fs.writeFileSync(generatedPath, toTsModule(captureAssets), 'utf8')
  console.log(`Generated ${captureAssets.length} capture assets from ${markdownFiles.length} markdown files.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
