import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/selection.ts')

if (!fs.existsSync(modulePath)) throw new Error('Missing module: src/console/selection.ts')
const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const selection = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const checks = [
  ['empty selection stays empty', selection.moveConsoleSelection(-1, 1, 0) === -1],
  ['first selection moves to the last item on ArrowUp', selection.moveConsoleSelection(0, -1, 4) === 3],
  ['last selection wraps to the first item on ArrowDown', selection.moveConsoleSelection(3, 1, 4) === 0],
  ['unselected ArrowDown starts at the first item', selection.moveConsoleSelection(-1, 1, 4) === 0],
  ['unselected ArrowUp starts at the last item', selection.moveConsoleSelection(-1, -1, 4) === 3],
  ['Escape from a panel restores the root command menu', selection.consoleEscapeTarget({ input: '', hasPanel: true }) === '/'],
  ['Escape from slash suggestions clears the command menu', selection.consoleEscapeTarget({ input: '/theme', hasPanel: false }) === ''],
  ['Escape from an idle prompt does nothing', selection.consoleEscapeTarget({ input: '', hasPanel: false }) === null],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
