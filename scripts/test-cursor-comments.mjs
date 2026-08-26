import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const cursor = fs.readFileSync(path.join(root, 'src/components/system/BounceCursor.vue'), 'utf8')

const checks = [
  [
    'foreign browsing surfaces restore the platform cursor',
    /closest\?\.\(['"]iframe, embed, object['"]\)/.test(cursor)
      && /html\.heart-bounce-active iframe/.test(cursor),
  ],
  [
    'iframe boundary changes are observed without waiting for mousemove',
    /addEventListener\(['"]mouseover['"], onMouseOver/.test(cursor)
      && /removeEventListener\(['"]mouseover['"], onMouseOver/.test(cursor),
  ],
  [
    'window blur clears the custom cursor before a preview takes focus',
    /function onWindowBlur\(\)[\s\S]*?onMouseLeave\(\)/.test(cursor)
      && /addEventListener\(['"]blur['"], onWindowBlur/.test(cursor)
      && /removeEventListener\(['"]blur['"], onWindowBlur/.test(cursor),
  ],
  [
    'giscus frame always keeps a native cursor fallback',
    /:global\(iframe\.giscus-frame\)\s*\{[\s\S]*?cursor:\s*auto\s*!important/.test(cursor),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label] of checks) {
  console.log(`${failures.some(([name]) => name === label) ? 'FAIL' : 'PASS'} ${label}`)
}
if (failures.length) process.exitCode = 1
