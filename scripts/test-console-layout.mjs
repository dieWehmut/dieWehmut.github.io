import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const desktopLayout = read('src/layouts/DesktopSidebarLayout.vue')
const mobileLayout = read('src/layouts/MobileDrawerLayout.vue')
const siteShell = read('src/layouts/SiteShell.vue')
const floatButton = read('src/components/system/FloatButton.vue')
const captureView = read('src/views/CaptureView.vue')
const consoleShell = read('src/components/console/ConsoleShell.vue')
const consolePanel = read('src/components/console/ConsolePanelView.vue')
const routeBreadcrumb = read('src/components/system/RouteBreadcrumb.vue')
const postView = read('src/views/PostView.vue')
const noteView = read('src/views/NoteView.vue')
const displayPreference = read('src/composables/useDisplayModePreference.ts')
const consoleStyles = read('src/styles/console.scss')

const checks = []
function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

check('desktop layout mounts one shared RouterView', (desktopLayout.match(/<RouterView\b/g) || []).length === 1)
check('desktop layout branches the console shell only', desktopLayout.includes('<ConsoleShell v-if="isConsole" />'))
check('mobile layout does not mount the console shell', !mobileLayout.includes('ConsoleShell'))
check('desktop/mobile breakpoint remains 900px', siteShell.includes('(max-width: 900px)'))
check('settings button exposes expanded state', floatButton.includes(':aria-expanded="settingsOpen"'))
check('language selector exposes expanded state', floatButton.includes(':aria-expanded="languageOpen"'))
check('colour selector exposes expanded state', floatButton.includes(':aria-expanded="colorSchemeOpen"'))
check('console capture preserves authorized editor controls', captureView.includes('console-capture-editor'))
check('capture confirmation remains available in console mode', captureView.includes('<Teleport to="body">'))
check('console overrides dynamic mesh with matching specificity', desktopLayout.includes(':root.dynamic-background-enabled .desktop-layout--console .desktop-layout__content'))
check('console route changes reset the result viewport', desktopLayout.includes('resetConsoleScroll'))
check('back to top targets the active scroll viewport', floatButton.includes('activeScrollContainer'))
check('nested panels expose keyboard selection', consolePanel.includes('activateSelection'))
check('console typography does not scale with viewport width', !/font-size:\s*clamp\(/.test(consoleShell))
check(
  'console typography uses neutral letter spacing',
  [...consoleShell.matchAll(/letter-spacing:\s*([^;]+);/g)].every((match) => match[1].trim() === '0'),
)
check('shared article PDF export remains in standard mode', routeBreadcrumb.includes('ArticleExportButton'))
check('shared article PDF export remains in console posts', postView.includes('ArticleExportButton'))
check('shared article PDF export remains in console notes', noteView.includes('ArticleExportButton'))
check('console mode marks the document for native cursor overrides', displayPreference.includes('console-mode-active'))
check('console uses the terminal text cursor everywhere', consoleStyles.includes('cursor: text !important'))
check('console suggestions keep the selected row visible', consoleShell.includes('suggestionsRef') && consoleShell.includes('scrollIntoView'))
check('nested panels close with Escape', consolePanel.includes("event.key === 'Escape'"))
check('console result viewport keeps the upper shell fixed', desktopLayout.includes('desktop-layout__result') && desktopLayout.includes('height: 100vh'))

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
