import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/timeline.ts')

if (!fs.existsSync(modulePath)) throw new Error('Missing module: src/console/timeline.ts')
const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const timeline = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const items = [
  { id: 'new', date: '2026-08-17' },
  { id: 'old', date: '2025-12-02' },
  { id: 'same-month', date: '2026-08-01' },
  { id: 'middle', date: '2026-01-15' },
]
const months = timeline.groupConsoleTimelineMonths(items, (item) => item.date)
const checks = [
  ['months sort newest first', months.map((month) => month.key).join(',') === '2026-08,2026-01,2025-12'],
  ['same-month entries stay grouped', months[0]?.items.length === 2],
  ['next month clamps at the end', timeline.moveConsoleMonth(2, 1, 3) === 2],
  ['previous month clamps at the start', timeline.moveConsoleMonth(0, -1, 3) === 0],
  ['middle month moves both directions', timeline.moveConsoleMonth(1, -1, 3) === 0 && timeline.moveConsoleMonth(1, 1, 3) === 2],
  ['month hash is stable', timeline.consoleMonthHash('2026-08') === '#month-2026-08'],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
