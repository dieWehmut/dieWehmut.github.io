import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const pdf = fs.readFileSync(path.join(root, 'src/utils/exportPdf.ts'), 'utf8')
const checks = [
  ['dedicated vocabulary converter exists', /vocabularyListItemToContent/.test(pdf)],
  ['PDF vocabulary output uses a stack', /vocabularyListItemToContent[\s\S]*?stack/.test(pdf)],
  ['PDF preserves British and American rows', /md-vocabulary-entry__row/.test(pdf) && /british|en-GB/.test(pdf) && /american|en-US/.test(pdf)],
  ['PDF vocabulary output uses theme palette', /vocabularyListItemToContent[\s\S]*?palette\.secondary/.test(pdf) && /vocabularyListItemToContent[\s\S]*?palette\.tertiary/.test(pdf)],
  ['PDF keeps underline mapping', /tag\s*===\s*["']u["'][\s\S]*?decoration\s*=\s*["']underline["']/.test(pdf)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label] of checks) {
  console.log(`${failures.some(([name]) => name === label) ? 'FAIL' : 'PASS'} ${label}`)
}
if (failures.length) process.exitCode = 1
