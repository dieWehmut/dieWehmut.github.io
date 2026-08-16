import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/history.ts')

if (!fs.existsSync(modulePath)) throw new Error('Missing module: src/console/history.ts')
const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const history = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

let entries = []
for (const command of ['/', '/archive', '/notes', '/infra', '/about', '/friends']) {
  entries = history.addConsoleHistoryEntry(entries, command)
}

const checks = [
  ['history keeps at most five entries', entries.length === 5],
  ['history removes the oldest entry', !entries.includes('/')],
  ['history retains execution order', entries.at(-1) === '/friends'],
]

entries = history.addConsoleHistoryEntry(entries, '/friends')
checks.push(['consecutive duplicates collapse', entries.filter((entry) => entry === '/friends').length === 1])
checks.push(['history constants are exported', history.CONSOLE_HISTORY_LIMIT === 5])

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
