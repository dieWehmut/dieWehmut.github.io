import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')

async function loadTypeScriptModule(relativePath) {
  const filePath = path.join(root, relativePath)
  if (!fs.existsSync(filePath)) throw new Error(`Missing module: ${relativePath}`)
  const { outputText } = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    fileName: filePath,
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const suggestions = await loadTypeScriptModule('src/console/suggestions.ts')
const registry = await loadTypeScriptModule('src/console/commandRegistry.ts')

const rootOptions = registry.listConsoleCommands()
const inputs = (prefix, dynamic = []) =>
  suggestions.filterConsoleSuggestions(prefix, rootOptions, dynamic).map((option) => option.input)

const checks = []
function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

check('plain text offers nothing', inputs('note').length === 0)
check('a bare slash lists the root commands', inputs('/').includes('/mode') && inputs('/').includes('/help'))
check('a bare slash hides sub-entries', !inputs('/').includes('/mode/classic') && !inputs('/').includes('/mode/console'))
check('a partial parent still hides sub-entries', inputs('/mo').includes('/mode') && !inputs('/mo').includes('/mode/classic'))
check(
  'the trailing slash reveals the sub-entries',
  inputs('/mode/').includes('/mode/classic')
    && inputs('/mode/').includes('/mode/console')
    && !inputs('/mode/').includes('/mode'),
)
check('a partial sub-entry keeps matching', inputs('/mode/cl').join() === '/mode/classic')
check(
  'dynamic entries lead the list once their parent is open',
  inputs('/note/', [{ input: '/note/alpha', description: 'Alpha' }])[0] === '/note/alpha',
)
check(
  'dynamic entries stay hidden while the parent is still being typed',
  inputs('/note', [{ input: '/note/alpha', description: 'Alpha' }]).join() === '/note',
)
check('unmatched prefixes offer nothing', inputs('/zzz').length === 0)
check('matching is case-insensitive', inputs('/MODE/').includes('/mode/classic'))
check('the root depth is one', suggestions.typedConsoleDepth('/') === 1 && suggestions.typedConsoleDepth('/mo') === 1)
check('an open level counts as one deeper', suggestions.typedConsoleDepth('/mode/') === 2 && suggestions.typedConsoleDepth('/mode/cl') === 2)

const { CONSOLE_OPTION_WINDOW: windowSize, consoleOptionWindowStart: windowStart } = suggestions

check('the window is five rows', windowSize === 5)
check('a short list is never windowed', windowStart(0, 3) === 0 && windowStart(2, 3) === 0 && windowStart(0, 5) === 0)
check('an unselected list starts at the top', windowStart(-1, 20) === 0)
check('the first rows keep the window parked at the top', windowStart(0, 20) === 0 && windowStart(2, 20) === 0)
check('the cursor stays centred once there is room on both sides', windowStart(3, 20) === 1 && windowStart(10, 20) === 8)
check('the window parks against the end instead of running past it', windowStart(18, 20) === 15 && windowStart(19, 20) === 15)
check(
  'every window is exactly as wide as the row count allows',
  [0, 1, 7, 13, 19].every((cursor) => {
    const start = windowStart(cursor, 20)
    return start >= 0 && start + windowSize <= 20
  }),
)
check(
  'the selected row is always inside the window it produced',
  [-1, 0, 1, 4, 9, 14, 19].every((cursor) => {
    const start = windowStart(cursor, 20)
    const index = cursor < 0 ? 0 : cursor
    return index >= start && index < start + windowSize
  }),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
