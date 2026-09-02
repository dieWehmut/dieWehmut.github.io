import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const SUPPORTED_IMAGE_EXTENSIONS = Object.freeze([
  '.avif',
  '.bmp',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
])

const SUPPORTED_IMAGE_EXTENSION_SET = new Set(SUPPORTED_IMAGE_EXTENSIONS)
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(\s*(<[^>\r\n]+>|"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^\s)\r\n]+)([\s\S]*?)\)/g
const HTML_IMAGE_PATTERN = /<img\b[^>]*?(?:^|\s)src\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi

function pathKey(filePath) {
  const resolved = path.resolve(filePath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

export function samePath(firstPath, secondPath) {
  return pathKey(firstPath) === pathKey(secondPath)
}

export function isWithin(rootPath, filePath) {
  const root = pathKey(rootPath)
  const target = pathKey(filePath)
  return target === root || target.startsWith(`${root}${path.sep}`)
}

export function isSupportedImage(filePath) {
  return SUPPORTED_IMAGE_EXTENSION_SET.has(path.extname(filePath).toLowerCase())
}

/**
 * Migrate generated capture metadata after a referenced document image moves.
 * If the destination is already represented, remove the stale source entry;
 * otherwise preserve the existing metadata and replace only its image URL.
 */
export function migrateCaptureAssetImage(assets, sourceImage, destinationImage) {
  if (!Array.isArray(assets)) return assets

  const source = String(sourceImage || '').trim()
  const destination = String(destinationImage || '').trim()
  if (!source || !destination || source === destination) return assets

  const destinationExists = assets.some(
    (asset) => String(asset?.image || '').trim() === destination,
  )
  let changed = false
  let replacementKept = false
  const migrated = []

  for (const asset of assets) {
    if (String(asset?.image || '').trim() !== source) {
      migrated.push(asset)
      continue
    }

    changed = true
    if (destinationExists || replacementKept) continue
    migrated.push({ ...asset, image: destination })
    replacementKept = true
  }

  return changed ? migrated : assets
}

function isMarkdown(filePath) {
  return filePath.toLowerCase().endsWith('.md')
}

function walkFiles(dirPath, predicate) {
  if (!fs.existsSync(dirPath)) return []
  const files = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, predicate))
    } else if (entry.isFile() && (!predicate || predicate(fullPath))) {
      files.push(fullPath)
    }
  }
  return files
}

function maskFencedCode(content) {
  // Keep offsets stable while avoiding image-looking examples inside fences.
  return content
    .replace(/^\s*(```|~~~)[\s\S]*?^\s*\1\s*$/gm, (block) =>
      block.replace(/[^\r\n]/g, ' '),
    )
    .replace(/<!--[\s\S]*?-->/g, (block) => block.replace(/[^\r\n]/g, ' '))
}

function unwrapReferenceToken(token) {
  let value = token.trim()
  if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  const queryOrHash = value.search(/[?#]/)
  return {
    rawPath: queryOrHash === -1 ? value : value.slice(0, queryOrHash),
    suffix: queryOrHash === -1 ? '' : value.slice(queryOrHash),
  }
}

function decodeReferencePath(token) {
  const { rawPath } = unwrapReferenceToken(token)
  try {
    return decodeURIComponent(rawPath)
  } catch {
    // Keep the original path when a pasted filename contains malformed escapes.
    return rawPath
  }
}

function isExternalReference(value) {
  if (!value || value.startsWith('#') || value.startsWith('/')) return true
  if (/^data:/i.test(value) || /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value)) return true
  // Treat URL schemes as external, but allow a Windows drive path such as C:\\tmp\\a.png.
  if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) return true
  return false
}

function resolveReference(markdownPath, token) {
  const value = decodeReferencePath(token)
  if (isExternalReference(value)) return null
  const nativePath = value.replace(/[\\/]+/g, path.sep)
  return path.resolve(path.dirname(markdownPath), nativePath)
}

function referenceReplacementToken(token, relativePath, suffix = '') {
  const trimmed = token.trim()
  const pathValue =
    trimmed.startsWith('<') || trimmed.startsWith('"') || trimmed.startsWith("'")
      ? relativePath
      : relativePath.split('/').map((part) => encodeURIComponent(part)).join('/')
  const replacement = `${pathValue}${suffix}`
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return `<${replacement}>`
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return `${trimmed[0]}${replacement}${trimmed[0]}`
  }
  return replacement
}

function collectReferencesFromMarkdown(markdownPath, content) {
  const references = []
  const maskedContent = maskFencedCode(content)

  MARKDOWN_IMAGE_PATTERN.lastIndex = 0
  let match
  while ((match = MARKDOWN_IMAGE_PATTERN.exec(maskedContent)) !== null) {
    const token = match[1]
    const { suffix } = unwrapReferenceToken(token)
    const openParenOffset = match[0].indexOf('(')
    const tokenOffset = match.index + match[0].indexOf(token, openParenOffset + 1)
    references.push({
      kind: 'markdown',
      markdownPath,
      token,
      start: tokenOffset,
      end: tokenOffset + token.length,
      suffix,
      resolvedPath: resolveReference(markdownPath, token),
    })
  }

  HTML_IMAGE_PATTERN.lastIndex = 0
  while ((match = HTML_IMAGE_PATTERN.exec(maskedContent)) !== null) {
    const token = match[1] || match[2] || match[3]
    const { suffix } = unwrapReferenceToken(token)
    const srcAttribute = match[0].match(/(?:^|\s)src\s*=\s*(?:"|')?/i)
    if (!srcAttribute || srcAttribute.index === undefined) continue
    const tokenOffset = match.index + srcAttribute.index + srcAttribute[0].length
    references.push({
      kind: 'html',
      markdownPath,
      token,
      start: tokenOffset,
      end: tokenOffset + token.length,
      suffix,
      resolvedPath: resolveReference(markdownPath, token),
    })
  }

  return references
}

export function collectMarkdownImageReferences(markdownPath, content) {
  return collectReferencesFromMarkdown(path.resolve(markdownPath), content)
}

function findReferences(imagePath, docsRoot) {
  const references = []
  for (const markdownPath of walkFiles(docsRoot, isMarkdown)) {
    let content
    try {
      content = fs.readFileSync(markdownPath, 'utf8')
    } catch {
      continue
    }
    for (const reference of collectReferencesFromMarkdown(markdownPath, content)) {
      if (reference.resolvedPath && samePath(reference.resolvedPath, imagePath)) {
        references.push({ ...reference, content })
      }
    }
  }
  return references
}

function nextAvailableDestination(directoryPath, fileName) {
  const extension = path.extname(fileName)
  const stem = path.basename(fileName, extension)
  let candidate = path.join(directoryPath, fileName)
  if (!fs.existsSync(candidate)) return candidate

  for (let index = 2; index < 10000; index += 1) {
    candidate = path.join(directoryPath, `${stem}-${index}${extension}`)
    if (!fs.existsSync(candidate)) return candidate
  }
  throw new Error(`Unable to choose a free destination name for ${fileName}`)
}

function statusResult(status, details = {}) {
  return { status, references: [], ...details }
}

/**
 * Move one copied image into the folder named after its sole referencing note.
 * Ambiguous and unreferenced images are intentionally left untouched.
 */
export function organizeDocImage(imagePath, options = {}) {
  const docsRoot = path.resolve(
    options.docsRoot || path.resolve(process.cwd(), 'src', 'data', 'docs'),
  )
  const sourcePath = path.resolve(imagePath)
  const base = { sourcePath, references: [] }

  if (!isSupportedImage(sourcePath)) return statusResult('unsupported', base)
  if (!isWithin(docsRoot, sourcePath)) return statusResult('outside-docs', base)
  if (!fs.existsSync(sourcePath)) return statusResult('missing', base)
  const sourceEntry = fs.lstatSync(sourcePath)
  if (!sourceEntry.isFile() || sourceEntry.isSymbolicLink()) return statusResult('not-file', base)
  const sourceSnapshot = fs.statSync(sourcePath)

  const references = findReferences(sourcePath, docsRoot)
  if (references.length === 0) return statusResult('unreferenced', { ...base, references })
  if (references.length !== 1) return statusResult('ambiguous', { ...base, references })

  const reference = references[0]
  const markdownPath = reference.markdownPath
  const documentFolder = path.join(
    path.dirname(markdownPath),
    path.basename(markdownPath, path.extname(markdownPath)),
  )

  if (isWithin(documentFolder, sourcePath)) {
    return statusResult('already-organized', {
      ...base,
      references,
      markdownPath,
      destinationPath: sourcePath,
    })
  }

  const destinationPath = nextAvailableDestination(documentFolder, path.basename(sourcePath))
  const relativePath = path.relative(path.dirname(markdownPath), destinationPath).replace(/\\/g, '/')
  const replacement = referenceReplacementToken(reference.token, relativePath, reference.suffix)
  const replacementContent =
    reference.content.slice(0, reference.start) +
    replacement +
    reference.content.slice(reference.end)

  // Do not overwrite an edit that arrived while the references were scanned.
  const currentContent = fs.readFileSync(markdownPath, 'utf8')
  if (currentContent !== reference.content) {
    return statusResult('changed-during-scan', {
      ...base,
      references,
      markdownPath,
    })
  }

  const latestSourceSnapshot = fs.statSync(sourcePath)
  if (
    latestSourceSnapshot.size !== sourceSnapshot.size ||
    latestSourceSnapshot.mtimeMs !== sourceSnapshot.mtimeMs
  ) {
    return statusResult('changed-during-scan', {
      ...base,
      references,
      markdownPath,
    })
  }

  let moved = false
  try {
    fs.mkdirSync(documentFolder, { recursive: true })
    fs.renameSync(sourcePath, destinationPath)
    moved = true
    if (fs.readFileSync(markdownPath, 'utf8') !== reference.content) {
      throw new Error(`Markdown changed while organizing ${sourcePath}; transaction rolled back.`)
    }
    fs.writeFileSync(markdownPath, replacementContent, 'utf8')
  } catch (error) {
    if (moved && fs.existsSync(destinationPath) && !fs.existsSync(sourcePath)) {
      try {
        fs.renameSync(destinationPath, sourcePath)
      } catch {
        // Preserve the original error; the caller will report the failed transaction.
      }
    }
    throw error
  }

  return {
    status: 'moved',
    sourcePath,
    destinationPath,
    markdownPath,
    oldReference: `${decodeReferencePath(reference.token)}${reference.suffix || ''}`,
    newReference: relativePath,
    references,
  }
}

function formatResult(result) {
  switch (result.status) {
    case 'moved':
      return `[doc-images] moved ${result.sourcePath} -> ${result.destinationPath}; updated ${result.markdownPath}`
    case 'ambiguous':
      return `[doc-images] skipped ambiguous image (${result.references.length} references): ${result.sourcePath}`
    case 'unreferenced':
      return `[doc-images] skipped unreferenced image: ${result.sourcePath}`
    case 'already-organized':
      return `[doc-images] already organized: ${result.sourcePath}`
    default:
      return `[doc-images] ${result.status}: ${result.sourcePath}`
  }
}

function isInvokedDirectly() {
  if (!process.argv[1]) return false
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])
}

function main() {
  const args = process.argv.slice(2)
  const docsRootArgument = args.find((arg) => arg.startsWith('--docs-root='))
  const docsRoot = path.resolve(
    docsRootArgument ? docsRootArgument.slice('--docs-root='.length) : process.env.NEXUS_DOCS_ROOT || path.join(process.cwd(), 'src', 'data', 'docs'),
  )
  const imageArguments = args.filter((arg) => !arg.startsWith('--docs-root='))
  const imagePaths = imageArguments.length
    ? imageArguments.map((filePath) => path.resolve(filePath))
    : walkFiles(docsRoot, isSupportedImage)

  let failures = 0
  for (const imagePath of imagePaths) {
    try {
      console.log(formatResult(organizeDocImage(imagePath, { docsRoot })))
    } catch (error) {
      failures += 1
      console.error(`[doc-images] failed for ${imagePath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (failures) process.exitCode = 1
}

if (isInvokedDirectly()) main()
