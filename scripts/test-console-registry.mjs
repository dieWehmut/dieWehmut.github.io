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

const rootResolution = registry.resolveConsoleCommand(command([]))
check(
  'root resolves the blank console landing route',
  rootResolution.kind === 'route' && rootResolution.path === '/' && rootResolution.routeName === 'root',
)
const homeResolution = registry.resolveConsoleCommand(command(['home']))
check(
  'home resolves its canonical route',
  homeResolution.kind === 'route' && homeResolution.path === '/home' && homeResolution.routeName === 'home',
)
check('comment resolves a current-page action', registry.resolveConsoleCommand(command(['comment'])).kind === 'comment')
check('archive resolves internal route', registry.resolveConsoleCommand(command(['archive'])).path === '/archive')
check('post id is encoded exactly once', registry.resolveConsoleCommand(command(['post', 'A Study'])).path === '/post/A%20Study')
check('tag matching is case-insensitive at command level', registry.resolveConsoleCommand(command(['tags', 'Vue'])).path === '/tags/Vue')
check('theme opens a panel', registry.resolveConsoleCommand(command(['theme'])).kind === 'panel' && registry.resolveConsoleCommand(command(['theme'])).panel === 'theme')
check('classic mode switches to standard', registry.resolveConsoleCommand(command(['mode', 'classic'])).kind === 'mode' && registry.resolveConsoleCommand(command(['mode', 'classic'])).mode === 'standard')
check('console mode switches to console', registry.resolveConsoleCommand(command(['mode', 'console'])).mode === 'console')
check('bare mode opens a nested selector', registry.resolveConsoleCommand(command(['mode'])).kind === 'panel' && registry.resolveConsoleCommand(command(['mode'])).panel === 'mode')
check('unknown command stays silent', registry.resolveConsoleCommand(command(['does-not-exist'])).kind === 'silent')
check('home rejects extra segments', registry.resolveConsoleCommand(command(['home', 'extra'])).kind === 'silent')
check('comment rejects extra segments', registry.resolveConsoleCommand(command(['comment', 'extra'])).kind === 'silent')
check(
  'comment rejects query and hash suffixes',
  registry.resolveConsoleCommand(command(['comment'], { query: 'thread=other' })).kind === 'silent'
    && registry.resolveConsoleCommand(command(['comment'], { hash: '#other' })).kind === 'silent',
)
check('theme rejects unknown values', registry.resolveConsoleCommand(command(['theme', 'nope'])).kind === 'silent')
check('theme rejects extra segments', registry.resolveConsoleCommand(command(['theme', 'dark', 'extra'])).kind === 'silent')
check('language accepts a supported value', registry.resolveConsoleCommand(command(['language', 'zh_tw'])).kind === 'panel')
check('command reference includes About', registry.listConsoleCommands().some((item) => item.input === '/about'))
check('command reference includes Friends', registry.listConsoleCommands().some((item) => item.input === '/friends'))
check('command reference includes the canonical Home route', registry.listConsoleCommands().some((item) => item.input === '/home'))
check('command reference includes current-page comments', registry.listConsoleCommands().some((item) => item.input === '/comment'))
const removedCommands = ['agent', 'list', 'status', 'permissions', 'docker', 'workspace', 'model']
for (const removedCommand of removedCommands) {
  check(
    `removed /${removedCommand} command resolves silently`,
    registry.resolveConsoleCommand(command([removedCommand])).kind === 'silent',
  )
  check(
    `removed /${removedCommand} command is absent from command reference`,
    !registry.listConsoleCommands().some((item) => item.input === `/${removedCommand}`),
  )
}
const disabledFeatureCommands = registry.listConsoleCommands({ infra: false, project: false })
check('disabled infra is omitted from the command reference', !disabledFeatureCommands.some((item) => item.input === '/infra'))
check('disabled project is omitted from the command reference', !disabledFeatureCommands.some((item) => item.input === '/project'))
check(
  'disabled infra command stays silent',
  registry.resolveConsoleCommand(command(['infra']), { infra: false, project: true }).kind === 'silent',
)
check(
  'disabled project command stays silent',
  registry.resolveConsoleCommand(command(['project']), { infra: true, project: false }).kind === 'silent',
)
check(
  'enabled feature commands still resolve normally',
  registry.resolveConsoleCommand(command(['infra']), { infra: true, project: true }).path === '/infra'
    && registry.resolveConsoleCommand(command(['project']), { infra: true, project: true }).path === '/project',
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
