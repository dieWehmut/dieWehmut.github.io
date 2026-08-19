import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const router = read('src/router.ts')
const sidebar = read('src/components/system/ScrollSpySidebar.vue')
const desktop = read('src/layouts/DesktopSidebarLayout.vue')
const mobile = read('src/layouts/MobileDrawerLayout.vue')

const checks = [
  ['router delegates hash scrolling', /if\s*\(to\.hash\)\s*return false/.test(router) && !/el:\s*to\.hash/.test(router)],
  ['sidebar uses shared heading resolver', /waitForHeading/.test(sidebar) && /resolveHeading/.test(sidebar)],
  // Both the scroll target and the reading of which heading was reached are the
  // same offset line, so they belong to one helper: an inline exact comparison
  // here loses to the sub-pixel rounding of the scroll it is reading the result
  // of, and the row then freezes. The helper also carries the selection through
  // the last screenful, where the scroll position has no room left to say which
  // heading is meant. Both rules are tested in test-heading-navigation.mjs; this
  // only pins that the component defers to them.
  [
    'sidebar reads the active heading through the shared helper',
    /selectedHeadingIndex\(/.test(sidebar) && !/const threshold\s*=/.test(sidebar),
  ],
  [
    'the reader takes the selection back from the pin',
    /addEventListener\('wheel', releasePinnedHeading/.test(sidebar)
    && /removeEventListener\('wheel', releasePinnedHeading/.test(sidebar),
  ],
  ['sidebar watches route hash', /watch\(\s*\(\)\s*=>\s*route\.hash/.test(sidebar)],
  ['sidebar writes canonical hash', /router\.replace/.test(sidebar) && /canonicalHeadingHash/.test(sidebar)],
  ['content mutations retry pending hash', /onContentMutation[\s\S]*scheduleHashScroll/.test(sidebar)],
  ['content mutations keep one waiter per hash', /pendingRequestHash\s*===\s*hash/.test(sidebar)],
  ['desktop view key ignores hash', /routeViewKey/.test(desktop) && !/:key="route\.fullPath"/.test(desktop)],
  ['mobile view and toc keys ignore hash', /routeViewKey/.test(mobile) && !/:key="route\.fullPath"/.test(mobile)],
  ['desktop and mobile offsets remain distinct', /default:\s*120/.test(sidebar) && /:offset="72"/.test(mobile)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label] of checks) {
  console.log(`${failures.some(([name]) => name === label) ? 'FAIL' : 'PASS'} ${label}`)
}
if (failures.length) process.exitCode = 1
