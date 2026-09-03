import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8')

let scrollRestore
try {
  scrollRestore = await import(pathToFileURL(path.join(root, 'src/utils/markdownScrollRestore.mjs')).href)
} catch (error) {
  console.error(`FAIL markdown scroll restore module loads: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
  process.exit()
}

const checks = []
const check = (label, condition) => checks.push([label, Boolean(condition)])

check(
  'main installs markdown scroll restoration during development',
  /installMarkdownReloadScrollRestore\(\)/.test(mainSource),
)

const location = {
  pathname: '/note/DigitalSignalProcessing',
  search: '?mode=reading',
  hash: '',
}

const snapshot = scrollRestore.createMarkdownScrollSnapshot(location, { scrollX: 12, scrollY: 840 }, 1000)
check(
  'snapshots bind both coordinates to the current document URL',
  snapshot.key === '/note/DigitalSignalProcessing?mode=reading'
    && snapshot.x === 12
    && snapshot.y === 840
    && snapshot.savedAt === 1000,
)

check(
  'reload restores a fresh snapshot for the same URL',
  scrollRestore.shouldRestoreMarkdownScroll(snapshot, location, 'reload', 2000),
)

check(
  'normal navigation does not consume a reload snapshot',
  !scrollRestore.shouldRestoreMarkdownScroll(snapshot, location, 'navigate', 2000),
)

check(
  'a snapshot from another route is rejected',
  !scrollRestore.shouldRestoreMarkdownScroll(
    snapshot,
    { ...location, pathname: '/notes' },
    'reload',
    2000,
  ),
)

check(
  'stale snapshots are rejected',
  !scrollRestore.shouldRestoreMarkdownScroll(snapshot, location, 'reload', 40_001),
)

check(
  'hash navigation wins over reload restoration',
  !scrollRestore.shouldRestoreMarkdownScroll(
    snapshot,
    { ...location, hash: '#sampling' },
    'reload',
    2000,
  ),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
