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

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const session = read('src/composables/useConsoleCommentSession.ts')
const consoleSession = read('src/composables/useConsoleSession.ts')
const desktopLayout = read('src/layouts/DesktopSidebarLayout.vue')
const commandRegistry = read('src/console/commandRegistry.ts')

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

check(
  'hash-only navigation stays on the same thread',
  comments.resolveConsoleCommentTarget(route('home', '/home?lang=zh#another'), captureGroups)?.routeKey
    === homeTarget?.routeKey,
)
check(
  'a different query is a different thread',
  comments.resolveConsoleCommentTarget(route('home', '/home?lang=en'), captureGroups)?.routeKey
    !== homeTarget?.routeKey,
)
check(
  'the comment module carries no open/closed state at all',
  !('toggleConsoleCommentState' in comments)
    && !('closeConsoleCommentStateForRoute' in comments)
    && !source.includes('openRouteKey'),
)
check(
  'the session derives one comment target from the current route',
  /const target = ref<ConsoleCommentTarget \| null>\(null\)/.test(session)
    && /watch\(\(\) => route\.fullPath, \(\) => void syncTarget\(route\), \{ immediate: true \}\)/.test(session)
    && !session.includes('isOpen')
    && !session.includes('toggleCurrentPage'),
)
check(
  'a slow capture resolution cannot publish a stale thread',
  /requestedRoute !== requested/.test(session),
)
check(
  'console mounts the thread for every commentable route',
  desktopLayout.includes('v-if="isConsole && commentTarget"')
    && !desktopLayout.includes('commentsOpen'),
)
check(
  '/comment only takes the user to the thread and focuses it',
  /resolution\.kind === 'comment' && !\(await comments\.ensureTarget\(\)\)/.test(consoleSession)
    && /resolution\.kind === 'comment'\)[\s\S]*?requestConsoleOutputReveal\('comment'\)/.test(consoleSession)
    && !consoleSession.includes('Comments opened.')
    && /request\.kind === 'comment'[\s\S]*?focusCommentFrame\(route\.fullPath\)/.test(desktopLayout)
    && desktopLayout.includes("querySelector<HTMLIFrameElement>('iframe.giscus-frame')"),
)
check(
  '/comment no longer advertises itself as a toggle',
  // The registry only names its wording now, so the claim is read where the
  // wording lives. Every locale's row has to describe a jump, not a toggle.
  /input: '\/comment', descriptionKey: 'console\.command\.comment'/.test(commandRegistry)
    && JSON.parse(read('src/locales/en.json')).console.command.comment
      === 'Jump to the comment box for this page',
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
