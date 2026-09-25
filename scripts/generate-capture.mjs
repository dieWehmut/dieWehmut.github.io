import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {
  documentAssetSourceCandidates,
  documentAssetUrl,
} from './organize-doc-images.mjs'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'src', 'data', 'docs')
const manifestPath = path.join(rootDir, 'src', 'data', 'capture', 'manifest.json')
const generatedPath = path.join(rootDir, 'src', 'data', 'capture', 'generated.ts')
const publicCaptureDir = path.join(rootDir, 'public', 'capture-assets')
const publicDocsDir = path.join(publicCaptureDir, 'docs')
const publicStandaloneDir = path.join(publicCaptureDir, 'standalone')
const publicLocalDir = path.join(publicCaptureDir, 'local')
const captureUrlPrefix = '/capture-assets/'
// Folders in the private assets repository that ship verbatim under
// /capture-assets/. Images cannot be tracked here (sync-assets-repo.mjs refuses
// to run if any are), so anything the site names by a literal runtime path is
// copied in at build time instead of being resolved by the bundler — which is
// what makes it survive a CI checkout, where none of the local images exist.
const publicAssetFolders = ['infra', 'site']
const preservedAssetPrefixes = [`${captureUrlPrefix}standalone/`, `${captureUrlPrefix}local/`]

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
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

function normalizeDocAssetUrl(docFilePath, assetPath) {
  return documentAssetUrl(docsDir, docFilePath, assetPath)
}

function captureAssetRelativePath(src) {
  return src.slice(captureUrlPrefix.length)
}

function parseImages(docFilePath, content) {
  const images = []
  const markdownPattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  const htmlPattern = /<img\b[^>]*src=['"]([^'"]+)['"][^>]*alt=['"]([^'"]*)['"][^>]*>|<img\b[^>]*alt=['"]([^'"]*)['"][^>]*src=['"]([^'"]+)['"][^>]*>/gi

  let match
  while ((match = markdownPattern.exec(content)) !== null) {
    const src = normalizeDocAssetUrl(docFilePath, match[2].trim())
    images.push({
      src,
      alt: match[1].trim(),
    })
  }

  while ((match = htmlPattern.exec(content)) !== null) {
    const rawSrc = (match[1] || match[4] || '').trim()
    const alt = (match[2] || match[3] || '').trim()
    if (!rawSrc) continue
    images.push({
      src: normalizeDocAssetUrl(docFilePath, rawSrc),
      alt,
    })
  }

  return images
}

function isCaptureAssetUrl(src) {
  return src.startsWith(captureUrlPrefix)
}

function sortByDateDesc(items) {
  return items.slice().sort((a, b) => {
    const aTime = getSortTimestamp(a.date)
    const bTime = getSortTimestamp(b.date)
    return bTime - aTime || (a.title || '').localeCompare(b.title || '')
  })
}

function getSortTimestamp(date) {
  if (!date) return 0
  const normalized = String(date).replace(/\//g, '-')
  const rangeMatch = normalized.match(/^\s*(\d{4}-\d{2}-\d{2})(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/)
  if (rangeMatch) return Date.parse(rangeMatch[1]) || 0
  return Date.parse(date) || 0
}

function loadManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : []
}

function loadExistingCaptureAssets() {
  if (!fs.existsSync(generatedPath)) return []
  const raw = fs.readFileSync(generatedPath, 'utf8')
  const match = raw.match(/export const generatedCaptureAssets: CaptureAsset\[\] = ([\s\S]*?) as CaptureAsset\[\]/)
  if (!match) return []
  const data = JSON.parse(match[1])
  return Array.isArray(data) ? data : []
}

function isPreservedCaptureAsset(asset) {
  const image = String(asset?.image || '')
  return preservedAssetPrefixes.some((prefix) => image.startsWith(prefix))
}

function preservedCaptureAssetSourcePath(assetsDir, asset) {
  const image = String(asset?.image || '')
  if (!image.startsWith(captureUrlPrefix)) return true
  const relativePath = captureAssetRelativePath(image)
  const publicPath = path.join(publicCaptureDir, relativePath)
  if (fs.existsSync(publicPath)) return publicPath

  const assetsPath = path.join(assetsDir, relativePath)
  if (fs.existsSync(assetsPath)) return assetsPath

  return ''
}

function normalizeExistingCaptureAsset(asset) {
  return {
    id: String(asset.id || asset.image || '').trim(),
    image: String(asset.image || '').trim(),
    title: String(asset.title || '').trim(),
    date: String(asset.date || '').trim(),
    tags: Array.isArray(asset.tags) ? asset.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    summary: String(asset.summary || '').trim(),
    sourceRefs: Array.isArray(asset.sourceRefs) ? asset.sourceRefs : [],
    standalone: asset.standalone !== false,
  }
}

function syncPreservedCaptureAsset(asset, sourcePath) {
  const image = String(asset?.image || '')
  if (!image.startsWith(captureUrlPrefix) || typeof sourcePath !== 'string') return
  const relativePath = captureAssetRelativePath(image)
  const destinationPath = path.join(publicCaptureDir, relativePath)
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) return
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`)
  }
}

function syncDocAsset(assetsDir, docFilePath, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  const destinationPath = path.join(publicCaptureDir, relativeAssetPath)
  const candidates = documentAssetSourceCandidates(docsDir, assetsDir, docFilePath, imageUrl)
  candidates.push(destinationPath)
  return candidates.find((candidate) => fs.existsSync(candidate)) || ''
}

function legacyDocumentAssetUrl(docFilePath, imageUrl) {
  const relative = captureAssetRelativePath(imageUrl)
  if (!relative.startsWith('docs/')) return ''
  const documentName = docIdFromPath(docFilePath)
  const publishedParts = relative.slice('docs/'.length).split('/')
  if (!documentName || publishedParts[0] !== documentName) return ''
  const category = toPosix(path.relative(docsDir, path.dirname(docFilePath)))
  if (!category || category === '.') return ''
  return `${captureUrlPrefix}docs/${category}/${publishedParts.join('/')}`
}

function migrateLegacyDocumentAsset(byImage, docFilePath, imageUrl) {
  const legacyUrl = legacyDocumentAssetUrl(docFilePath, imageUrl)
  if (!legacyUrl || legacyUrl === imageUrl) return

  const legacy = byImage.get(legacyUrl)
  if (legacy) {
    if (!byImage.has(imageUrl)) byImage.set(imageUrl, { ...legacy, image: imageUrl })
    byImage.delete(legacyUrl)
  }

  const legacyRelative = captureAssetRelativePath(legacyUrl)
  const legacyPublicPath = path.join(publicCaptureDir, legacyRelative)
  if (fs.existsSync(legacyPublicPath)) fs.rmSync(legacyPublicPath, { force: true })
}

function removeLegacyDocumentAssets(byImage, docFilePath) {
  const documentName = docIdFromPath(docFilePath)
  const category = toPosix(path.relative(docsDir, path.dirname(docFilePath)))
  if (!documentName || !category || category === '.') return
  const prefix = `${captureUrlPrefix}docs/${category}/${documentName}/`
  for (const image of byImage.keys()) {
    if (image.startsWith(prefix)) byImage.delete(image)
  }
  const legacyPublicDir = path.join(publicCaptureDir, 'docs', category, documentName)
  if (fs.existsSync(legacyPublicDir)) fs.rmSync(legacyPublicDir, { recursive: true, force: true })
}

function copyDocAsset(sourcePath, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  const destinationPath = path.join(publicCaptureDir, relativeAssetPath)
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) return
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

/**
 * The source a docs entry still has somewhere, whether or not a Markdown file
 * still points at it. Entries outlive the reference that created them: a note
 * that swapped one page for another, or a screenshot inserted and then
 * rewritten, leaves the entry behind while its file stays in the assets
 * repository. Without this the gallery keeps advertising the entry and serving
 * nothing, since the copy above only runs for references found in Markdown.
 */
function existingDocAssetSource(assetsDir, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  if (!relativeAssetPath.startsWith('docs/')) return ''
  const assetsPath = path.join(assetsDir, relativeAssetPath)
  if (fs.existsSync(assetsPath)) return assetsPath
  const publicPath = path.join(publicCaptureDir, relativeAssetPath)
  if (fs.existsSync(publicPath)) return publicPath
  return ''
}

/**
 * Whether the private assets repository holds this entry's image, which is the
 * only source a deployed build can reach: public/ is a local cache and is never
 * committed. An entry no document references and the repository cannot serve
 * would render as a broken tile wherever it is deployed, so it is dropped
 * rather than advertised.
 */
function assetsRepoDocAssetExists(assetsDir, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  if (!relativeAssetPath.startsWith('docs/')) return false
  return fs.existsSync(path.join(assetsDir, relativeAssetPath))
}

function copyStandaloneAsset(assetsDir, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  const standaloneRelative = relativeAssetPath.replace(/^standalone\//, '')
  const sourcePath = path.join(assetsDir, 'standalone', standaloneRelative)
  const destinationPath = path.join(publicCaptureDir, relativeAssetPath)
  assertFileExists(sourcePath, 'Standalone asset')
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function syncPublicAssetFolder(assetsDir, folder) {
  const sourceDir = path.join(assetsDir, folder)
  const targetDir = path.join(publicCaptureDir, folder)
  fs.rmSync(targetDir, { recursive: true, force: true })
  ensureDir(targetDir)

  if (!fs.existsSync(sourceDir)) {
    console.warn(`Assets folder not found, skipping optional ${folder} assets: ${sourceDir}`)
    return
  }

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    fs.copyFileSync(path.join(sourceDir, entry.name), path.join(targetDir, entry.name))
  }
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

  ensureDir(publicCaptureDir)
  ensureDir(publicDocsDir)
  ensureDir(publicStandaloneDir)
  ensureDir(publicLocalDir)
  for (const folder of publicAssetFolders) syncPublicAssetFolder(assetsDir, folder)

  const existingCaptureAssets = loadExistingCaptureAssets()
  const byImage = new Map()
  const markdownFiles = getMarkdownFiles(docsDir)
  const missingAssetPaths = new Set()
  const referencedImages = new Set()

  for (const asset of existingCaptureAssets) {
    const normalized = normalizeExistingCaptureAsset(asset)
    if (normalized.image) byImage.set(normalized.image, normalized)
  }

  for (const asset of existingCaptureAssets) {
    if (!isPreservedCaptureAsset(asset)) continue
    const sourcePath = preservedCaptureAssetSourcePath(assetsDir, asset)
    if (!sourcePath) continue
    const normalized = normalizeExistingCaptureAsset(asset)
    if (normalized.image) byImage.set(normalized.image, normalized)
    syncPreservedCaptureAsset(normalized, sourcePath)
  }

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

    for (const image of parseImages(filePath, content)) {
      if (!isCaptureAssetUrl(image.src)) continue
      if (seenInDoc.has(image.src)) continue
      seenInDoc.add(image.src)
      referencedImages.add(image.src)

      // A document that used to publish under docs/<category>/<name>/ is
      // canonicalized to docs/<name>/ while retaining its existing metadata.
      migrateLegacyDocumentAsset(byImage, filePath, image.src)

      const relativePath = captureAssetRelativePath(image.src)
      if (!relativePath.startsWith('docs/')) continue

      const manifestEntry = manifestByUrl.get(image.src)
      if (manifestEntry?.hidden) continue

      const sourcePath = syncDocAsset(assetsDir, filePath, image.src)
      const existing = byImage.get(image.src)
      if (!sourcePath && !existing) {
        missingAssetPaths.add(image.src)
        continue
      }

      const captureAsset = existing || {
        id: manifestEntry?.id || relativePath.replace(/[\\/]/g, '-').replace(/\.[^.]+$/i, ''),
        image: image.src,
        title: manifestEntry?.title || image.alt || '',
        date: manifestEntry?.date || date,
        tags: manifestEntry?.tags?.length ? [...manifestEntry.tags] : [...tags],
        summary: manifestEntry?.summary || '',
        sourceRefs: [],
        standalone: false,
      }

      captureAsset.title = manifestEntry?.title || captureAsset.title || image.alt || ''
      captureAsset.date = manifestEntry?.date || captureAsset.date || date
      captureAsset.tags = manifestEntry?.tags?.length ? [...manifestEntry.tags] : captureAsset.tags
      captureAsset.summary = manifestEntry?.summary || captureAsset.summary
      captureAsset.standalone = false

      if (!captureAsset.sourceRefs.some((item) => item.type === type && item.id === id)) {
        captureAsset.sourceRefs.push({ type, id, title, url })
      }

      byImage.set(image.src, captureAsset)
      if (sourcePath) {
        copyDocAsset(sourcePath, image.src)
      } else {
        missingAssetPaths.add(image.src)
      }
    }

    removeLegacyDocumentAssets(byImage, filePath)
  }

  // Every docs entry ships its image, not only the ones a Markdown file still
  // names. A document that swapped one page for another leaves the old entry
  // behind in the data while its file stays in the assets repository, and a
  // tile whose file never reaches public/ is a card that renders as nothing.
  //
  // An entry no document references any more, and the assets repository cannot
  // serve either, is dropped: every deployed build reads that repository and
  // nothing else, so the entry could only ever render as a broken tile. An
  // entry a document does still reference keeps its place either way, since
  // the asset push mirrors referenced local images into that repository before
  // the deployed build ever runs.
  for (const asset of Array.from(byImage.values())) {
    const image = String(asset?.image || '')
    const relativePath = captureAssetRelativePath(image)
    if (!relativePath.startsWith('docs/')) continue
    if (!referencedImages.has(image) && !assetsRepoDocAssetExists(assetsDir, image)) {
      byImage.delete(image)
      continue
    }
    const sourcePath = existingDocAssetSource(assetsDir, image)
    if (!sourcePath) continue
    const destinationPath = path.join(publicCaptureDir, relativePath)
    if (path.resolve(sourcePath) === path.resolve(destinationPath)) continue
    ensureDir(path.dirname(destinationPath))
    fs.copyFileSync(sourcePath, destinationPath)
  }

  const needsStandaloneAssets = manifestEntries.some((entry) => !entry.hidden && String(entry.image || '').trim())
  if (needsStandaloneAssets) {
    assertFileExists(assetsDir, 'Assets directory')
  }

  for (const entry of manifestEntries) {
    if (entry.hidden) continue
    const image = String(entry.image || '').trim()
    if (!image) continue
    const relativePath = captureAssetRelativePath(image)
    const existing = byImage.get(image)

    if (relativePath.startsWith('standalone/')) {
      copyStandaloneAsset(assetsDir, image)
    }

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

  fs.writeFileSync(generatedPath, toTsModule(captureAssets), 'utf8')
  console.log(`Generated ${captureAssets.length} capture assets from ${markdownFiles.length} markdown files.`)
  if (missingAssetPaths.size) {
    console.warn(`Skipped ${missingAssetPaths.size} missing private capture asset source file(s).`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
