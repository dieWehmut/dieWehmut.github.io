import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/commandRegistry.ts')
if (!fs.existsSync(modulePath)) throw new Error('Missing module: src/console/commandRegistry.ts')

const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const registry = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const command = (segments, extra = {}) => ({
  kind: 'command',
  rawInput: `/${segments.join('/')}`,
  segments,
  canonicalInput: `/${segments.join('/')}`,
  query: '',
  hash: '',
  ...extra,
})

const checks = []
function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

check('root resolves home route', registry.resolveConsoleCommand(command([])).kind === 'route' && registry.resolveConsoleCommand(command([])).path === '/')
check('archive resolves internal route', registry.resolveConsoleCommand(command(['archive'])).path === '/archive')
check('post id is encoded exactly once', registry.resolveConsoleCommand(command(['post', 'A Study'])).path === '/post/A%20Study')
check('tag matching is case-insensitive at command level', registry.resolveConsoleCommand(command(['tags', 'Vue'])).path === '/tags/Vue')
check('theme opens a panel', registry.resolveConsoleCommand(command(['theme'])).kind === 'panel' && registry.resolveConsoleCommand(command(['theme'])).panel === 'theme')
check('classic mode switches to standard', registry.resolveConsoleCommand(command(['mode', 'classic'])).kind === 'mode' && registry.resolveConsoleCommand(command(['mode', 'classic'])).mode === 'standard')
check('console mode switches to console', registry.resolveConsoleCommand(command(['mode', 'console'])).mode === 'console')
check('bare mode opens a nested selector', registry.resolveConsoleCommand(command(['mode'])).kind === 'panel' && registry.resolveConsoleCommand(command(['mode'])).panel === 'mode')
check('unknown command stays silent', registry.resolveConsoleCommand(command(['does-not-exist'])).kind === 'silent')
check('home rejects extra segments', registry.resolveConsoleCommand(command(['home', 'extra'])).kind === 'silent')
check('informational panels reject values', registry.resolveConsoleCommand(command(['status', 'extra'])).kind === 'silent')
check('theme rejects unknown values', registry.resolveConsoleCommand(command(['theme', 'nope'])).kind === 'silent')
check('theme rejects extra segments', registry.resolveConsoleCommand(command(['theme', 'dark', 'extra'])).kind === 'silent')
check('language accepts a supported value', registry.resolveConsoleCommand(command(['language', 'zh_tw'])).kind === 'panel')
check('command reference includes About', registry.listConsoleCommands().some((item) => item.input === '/about'))
check('command reference includes Friends', registry.listConsoleCommands().some((item) => item.input === '/friends'))
check('command reference includes List', registry.listConsoleCommands().some((item) => item.input === '/list'))

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
