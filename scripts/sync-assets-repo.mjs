import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const defaultAssetsDir = path.resolve(rootDir, '..', 'diesw-assets')
const assetsDir = path.resolve(rootDir, process.env.DIESW_ASSETS_DIR?.trim() || defaultAssetsDir)
const docsDir = path.join(rootDir, 'src', 'data', 'docs')
const publicCaptureDir = path.join(rootDir, 'public', 'capture-assets')

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
      continue
    }
    if (entry.isFile()) files.push(fullPath)
  }
  return files
}

function isMarkdown(filePath) {
  return filePath.toLowerCase().endsWith('.md')
}

function isMediaAsset(filePath) {
  return /\.(?:png|jpe?g|gif|webp|svg|avif)$/i.test(filePath)
}

function copyFilesToDir(files, sourceDir, targetDir) {
  for (const filePath of files) {
    const relativePath = path.relative(sourceDir, filePath)
    const destinationPath = path.join(targetDir, relativePath)
    ensureDir(path.dirname(destinationPath))
    fs.copyFileSync(filePath, destinationPath)
  }
}

function mirrorDocsImagesToAssetsRepo() {
  const targetDocsDir = path.join(assetsDir, 'docs')
  const publicDocsDir = path.join(publicCaptureDir, 'docs')
  const publicDocImages = walkFiles(publicDocsDir).filter(isMediaAsset)
  const localDocImages = walkFiles(docsDir)
    .filter((filePath) => !isMarkdown(filePath) && isMediaAsset(filePath))

  if (publicDocImages.length === 0 && localDocImages.length === 0) {
    console.log('No local docs image cache found; preserving existing assets docs.')
    return
  }

  fs.rmSync(targetDocsDir, { recursive: true, force: true })
  copyFilesToDir(publicDocImages, publicDocsDir, targetDocsDir)
  copyFilesToDir(localDocImages, docsDir, targetDocsDir)
}

function copyDirContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return
  fs.rmSync(targetDir, { recursive: true, force: true })
  copyFilesToDir(walkFiles(sourceDir), sourceDir, targetDir)
}

function mirrorPublicCaptureAssetsToAssetsRepo() {
  copyDirContents(path.join(publicCaptureDir, 'standalone'), path.join(assetsDir, 'standalone'))
  copyDirContents(path.join(publicCaptureDir, 'local'), path.join(assetsDir, 'local'))
  copyDirContents(path.join(publicCaptureDir, 'infra'), path.join(assetsDir, 'infra'))
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: options.cwd || rootDir,
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    if (options.capture && result.stderr) console.error(result.stderr.trim())
    fail(`git ${args.join(' ')} failed in ${options.cwd || rootDir}`)
  }

  return options.capture ? (result.stdout || '').trim() : ''
}

function assertNoTrackedSiteImages() {
  const tracked = runGit(['ls-files'], { capture: true })
    .split('\n')
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .filter(isMediaAsset)

  if (tracked.length === 0) return

  fail(`Main repository still tracks image files. Move them to diesw-assets and untrack them first:\n${tracked.join('\n')}`)
}

if (!fs.existsSync(assetsDir)) {
  console.log(`Assets directory not found, skipping sync: ${assetsDir}`)
  process.exit(0)
}

if (!fs.existsSync(path.join(assetsDir, '.git'))) {
  fail(`Assets directory is not a git repository: ${assetsDir}`)
}

assertNoTrackedSiteImages()
mirrorDocsImagesToAssetsRepo()
mirrorPublicCaptureAssetsToAssetsRepo()

const porcelain = runGit(['status', '--porcelain'], { cwd: assetsDir, capture: true })
if (!porcelain) {
  console.log('No local asset changes to sync.')
  process.exit(0)
}

const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
const commitMessage = `chore: sync capture assets (${timestamp})`

runGit(['add', '--all'], { cwd: assetsDir })
runGit(['commit', '-m', commitMessage], { cwd: assetsDir })
runGit(['push'], { cwd: assetsDir })

console.log(`Synced asset repository: ${assetsDir}`)
