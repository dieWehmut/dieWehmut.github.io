import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/commentState.ts')

if (!fs.existsSync(modulePath)) {
  console.error('FAIL Console comment state module exists (expected src/console/commentState.ts)')
  process.exit(1)
}

const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const comments = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const captureGroups = [
  {
    id: 'capture-2026-06-16',
    assetIds: ['docs-cm-cm1', 'docs-cm-cm2'],
  },
]

const route = (name, fullPath, captureRouteId) => ({ name, fullPath, captureRouteId })
const checks = []

function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

check(
  'comment route key ignores hash while preserving query',
  comments.getConsoleCommentRouteKey('/home?lang=zh#recent') === '/home?lang=zh',
)

const homeTarget = comments.resolveConsoleCommentTarget(route('home', '/home?lang=zh#recent'), captureGroups)
check(
  'ordinary commentable pages resolve site comments',
  homeTarget?.source === 'site' && homeTarget.routeKey === '/home?lang=zh',
)

let state = comments.toggleConsoleCommentState({ openRouteKey: null, target: null }, homeTarget)
check(
  'first toggle opens comments for the current page',
  state.openRouteKey === '/home?lang=zh' && state.target === homeTarget,
)

state = comments.toggleConsoleCommentState(state, homeTarget)
check(
  'second toggle on the same page closes comments',
  state.openRouteKey === null && state.target === null,
)

state = comments.toggleConsoleCommentState({ openRouteKey: null, target: null }, homeTarget)
const sameKeyAfterHashChange = comments.closeConsoleCommentStateForRoute(state, '/home?lang=zh#another-heading')
check(
  'hash-only navigation keeps current-page comments open',
  sameKeyAfterHashChange.openRouteKey === '/home?lang=zh',
)

const afterPathChange = comments.closeConsoleCommentStateForRoute(state, '/archive')
check(
  'path changes close current-page comments',
  afterPathChange.openRouteKey === null && afterPathChange.target === null,
)

const afterQueryChange = comments.closeConsoleCommentStateForRoute(state, '/home?lang=en')
check(
  'query changes close current-page comments',
  afterQueryChange.openRouteKey === null && afterQueryChange.target === null,
)

check(
  'blank console root rejects comments',
  comments.resolveConsoleCommentTarget(route('console-root', '/'), captureGroups) === null,
)
check(
  'search rejects comments',
  comments.resolveConsoleCommentTarget(route('search', '/search?q=console'), captureGroups) === null,
)
check(
  'not-found routes reject comments',
  comments.resolveConsoleCommentTarget(route('not-found', '/missing'), captureGroups) === null,
)
check(
  'unknown capture details reject comments',
  comments.resolveConsoleCommentTarget(
    route('capture-detail', '/capture/does-not-exist', 'does-not-exist'),
    captureGroups,
  ) === null,
)

const captureGroupTarget = comments.resolveConsoleCommentTarget(
  route('capture-detail', '/capture/capture-2026-06-16', 'capture-2026-06-16'),
  captureGroups,
)
const captureAssetTarget = comments.resolveConsoleCommentTarget(
  route('capture-detail', '/capture/docs-cm-cm1', 'docs-cm-cm1'),
  captureGroups,
)
check(
  'capture group routes resolve capture comments',
  captureGroupTarget?.source === 'capture'
    && captureGroupTarget.term === 'capture-group:capture-2026-06-16',
)
check(
  'capture asset and group routes share the canonical group term',
  captureAssetTarget?.source === 'capture'
    && captureAssetTarget.term === captureGroupTarget?.term,
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
