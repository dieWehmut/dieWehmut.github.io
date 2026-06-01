import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const defaultAssetsDir = path.resolve(rootDir, '..', 'diesw-assets')
const assetsDir = path.resolve(rootDir, process.env.DIESW_ASSETS_DIR?.trim() || defaultAssetsDir)

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

if (!fs.existsSync(assetsDir)) {
  console.log(`Assets directory not found, skipping sync: ${assetsDir}`)
  process.exit(0)
}

if (!fs.existsSync(path.join(assetsDir, '.git'))) {
  fail(`Assets directory is not a git repository: ${assetsDir}`)
}

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
