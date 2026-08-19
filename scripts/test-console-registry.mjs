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
check('capture resolves internal route', registry.resolveConsoleCommand(command(['capture'])).path === '/capture')
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
// `night` is deliberate: with an unknown value the rejection would happen for the
// wrong reason and the check would pass without ever testing a third segment.
check('theme rejects extra segments', registry.resolveConsoleCommand(command(['theme', 'night', 'extra'])).kind === 'silent')
check('language accepts a supported value', registry.resolveConsoleCommand(command(['language', 'zh_tw'])).kind === 'panel')
const bareIcon = registry.resolveConsoleCommand(command(['icon']))
check('bare icon opens its picker', bareIcon.kind === 'panel' && bareIcon.panel === 'icon' && bareIcon.value === undefined)
check(
  'every icon form the plate cycles is also reachable by name',
  ['grayscale', 'whiten', 'original', 'pixelated'].every((form) => {
    const resolution = registry.resolveConsoleCommand(command(['icon', form]))
    return resolution.kind === 'panel' && resolution.panel === 'icon' && resolution.value === form
  }),
)
check('icon rejects unknown forms', registry.resolveConsoleCommand(command(['icon', 'sepia'])).kind === 'silent')
check('icon rejects extra segments', registry.resolveConsoleCommand(command(['icon', 'original', 'extra'])).kind === 'silent')
check('command reference includes the icon form picker', registry.listConsoleCommands().some((item) => item.input === '/icon'))
check('command reference includes About', registry.listConsoleCommands().some((item) => item.input === '/about'))
check('command reference includes Friends', registry.listConsoleCommands().some((item) => item.input === '/friends'))
check('command reference includes the canonical Home route', registry.listConsoleCommands().some((item) => item.input === '/home'))
check('command reference includes current-page comments', registry.listConsoleCommands().some((item) => item.input === '/comment'))
check('command reference omits the standalone root slash', !registry.listConsoleCommands().some((item) => item.input === '/'))

const postsResolution = registry.resolveConsoleCommand(command(['posts']))
check(
  'posts is the command name for the archive route',
  postsResolution.kind === 'route' && postsResolution.path === '/archive' && postsResolution.routeName === 'archive',
)
const notesResolution = registry.resolveConsoleCommand(command(['notes']))
check(
  'notes resolves the note index route',
  notesResolution.kind === 'route' && notesResolution.path === '/notes' && notesResolution.routeName === 'notes',
)
check(
  'the list routes stay distinct from the pickers',
  registry.resolveConsoleCommand(command(['post'])).panel === 'post-picker'
    && registry.resolveConsoleCommand(command(['note'])).panel === 'note-picker',
)
check(
  'posts and notes both reject extra segments',
  registry.resolveConsoleCommand(command(['posts', 'extra'])).kind === 'silent'
    && registry.resolveConsoleCommand(command(['notes', 'extra'])).kind === 'silent',
)
check('export resolves a current-page action', registry.resolveConsoleCommand(command(['export'])).kind === 'export')
check(
  'export rejects segments, query and hash suffixes',
  registry.resolveConsoleCommand(command(['export', 'pdf'])).kind === 'silent'
    && registry.resolveConsoleCommand(command(['export'], { query: 'format=pdf' })).kind === 'silent'
    && registry.resolveConsoleCommand(command(['export'], { hash: '#top' })).kind === 'silent',
)
check(
  'command reference lists the list routes and the article export',
  ['/posts', '/notes', '/export'].every((input) => registry.listConsoleCommands().some((item) => item.input === input)),
)

const bareSearch = registry.resolveConsoleCommand(command(['search']))
check(
  'a bare search opens the plain result page',
  bareSearch.kind === 'route' && bareSearch.path === '/search' && bareSearch.routeName === 'search',
)
const termSearch = registry.resolveConsoleCommand(command(['search', 'vue router']))
check(
  'a search term travels as the q query parameter',
  termSearch.kind === 'route' && termSearch.path === '/search?q=vue%20router' && termSearch.routeName === 'search',
)
check(
  'a slash-separated search term rejoins into one query',
  registry.resolveConsoleCommand(command(['search', 'vue', 'router'])).path === '/search?q=vue%20router',
)
check(
  'a search term rejects query and hash suffixes of its own',
  registry.resolveConsoleCommand(command(['search', 'vue'], { query: 'q=other' })).kind === 'silent'
    && registry.resolveConsoleCommand(command(['search', 'vue'], { hash: '#top' })).kind === 'silent',
)
// What the `/search` row actually says is a wording claim, so it is checked where
// the wording lives: scripts/test-console-i18n.mjs. All the registry owes is a key.
check(
  'every command names its description instead of holding it',
  registry.listConsoleCommands().every((item) => /^console\.command\.[a-z_]+$/.test(item.descriptionKey)),
)
check(
  'no two commands answer to the same description key',
  new Set(registry.listConsoleCommands().map((item) => item.descriptionKey)).size
    === registry.listConsoleCommands().length,
)
const helpResolution = registry.resolveConsoleCommand(command(['help']))
check(
  'help resolves a page rather than a dock panel',
  helpResolution.kind === 'route' && helpResolution.path === '/help' && helpResolution.routeName === 'help',
)
check('help rejects extra segments', registry.resolveConsoleCommand(command(['help', 'commands'])).kind === 'silent')
const groupIds = new Set(registry.consoleCommandGroups.map((group) => group.id))
check(
  'every group names its heading instead of holding it',
  registry.consoleCommandGroups.every((group) => /^console\.group\.[a-z]+$/.test(group.titleKey)),
)
check(
  'every command is filed under a declared group',
  registry.listConsoleCommands().every((item) => groupIds.has(item.group)),
)
check(
  'every declared group has at least one command to show',
  registry.consoleCommandGroups.every(
    (group) => registry.listConsoleCommands().some((item) => item.group === group.id),
  ),
)

const removedCommands = [
  'agent',
  'list',
  'status',
  'permissions',
  'docker',
  'workspace',
  'model',
  // The archive page answers to /posts instead, so its own path is not a command.
  'archive',
  'config',
  'doctor',
]
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
