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

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
