import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

import { isSupportedImage, isWithin } from './organize-doc-images.mjs'

const rootDir = process.cwd()

function argumentValue(name) {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))
  return value ? value.slice(prefix.length) : ''
}

function resolvePath(value, fallback) {
  return path.resolve(rootDir, value || fallback)
}

function fail(message) {
  throw new Error(message)
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim()
    fail(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
  return String(result.stdout || '').trim()
}

function relativeDocumentAsset(markdownPath, sourcePath) {
  const documentFolder = path.join(
    path.dirname(markdownPath),
    path.basename(markdownPath, path.extname(markdownPath)),
  )
  const relative = path.relative(documentFolder, sourcePath)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? relative
    : path.basename(sourcePath)
}

function legacyAssetPath(docsRoot, markdownPath, relativeAsset) {
  const category = path.relative(
    docsRoot,
    path.dirname(markdownPath),
  )
  const documentName = path.basename(markdownPath, path.extname(markdownPath))
  return path.join('docs', category, documentName, relativeAsset)
}

function main() {
  const docsRoot = resolvePath(argumentValue('docs-root'), path.join('src', 'data', 'docs'))
  const assetsDir = resolvePath(
    argumentValue('assets-dir') || process.env.DIESW_ASSETS_DIR?.trim(),
    path.join('..', 'diesw-assets'),
  )
  const sourcePath = resolvePath(argumentValue('source'), '')
  const markdownPath = resolvePath(argumentValue('markdown'), '')
  const noPush = process.argv.includes('--no-push')

  if (!sourcePath || !fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    fail(`Image source not found: ${sourcePath}`)
  }
  if (!isSupportedImage(sourcePath) || !isWithin(docsRoot, sourcePath)) {
    fail(`Image source must be a supported file inside docs: ${sourcePath}`)
  }
  if (!markdownPath || !fs.existsSync(markdownPath) || !markdownPath.toLowerCase().endsWith('.md')) {
    fail(`Markdown source not found: ${markdownPath}`)
  }
  if (!isWithin(docsRoot, markdownPath)) {
    fail(`Markdown source must be inside docs: ${markdownPath}`)
  }
  if (!fs.existsSync(path.join(assetsDir, '.git'))) {
    fail(`Assets directory is not a git repository: ${assetsDir}`)
  }

  const documentName = path.basename(markdownPath, path.extname(markdownPath))
  const relativeAsset = relativeDocumentAsset(markdownPath, sourcePath)
  const targetRelative = path.join('docs', documentName, relativeAsset)
  const targetPath = path.join(assetsDir, targetRelative)
  const legacyPath = path.join(assetsDir, legacyAssetPath(docsRoot, markdownPath, relativeAsset))
  const legacyRelative = path.relative(assetsDir, legacyPath)
  const legacyTracked = Boolean(runGit(['ls-files', '--', legacyRelative], assetsDir))

  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.copyFileSync(sourcePath, targetPath)
  if (path.resolve(legacyPath) !== path.resolve(targetPath) && fs.existsSync(legacyPath)) {
    fs.rmSync(legacyPath, { force: true })
  }

  const statusPaths = [targetRelative]
  if (fs.existsSync(legacyPath) || legacyTracked) statusPaths.push(legacyRelative)
  const changed = runGit(['status', '--porcelain', '--', ...statusPaths], assetsDir)
  if (!changed) {
    console.log(`Asset already synchronized: ${targetRelative}`)
    return
  }

  // Include the legacy path only when it existed or was tracked before the
  // move; Git then records its deletion without staging unrelated documents.
  runGit(['add', '--all', '--', ...statusPaths], assetsDir)
  if (noPush) {
    console.log(`Synchronized locally: ${targetRelative}`)
    return
  }

  const stamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
  runGit(['commit', '-m', `chore: sync ${documentName} image (${stamp})`], assetsDir)
  runGit(['push'], assetsDir)
  console.log(`Pushed ${targetRelative} to ${assetsDir}`)
}

try {
  main()
} catch (error) {
  console.error(`[doc-images] remote sync failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
