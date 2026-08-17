import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readOptional(relativePath) {
  const filePath = path.join(root, relativePath)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function componentTags(source, componentName) {
  return [...source.matchAll(new RegExp(`<${componentName}\\b[^>]*\\/?>`, 'g'))].map((match) => match[0])
}

const desktopLayout = read('src/layouts/DesktopSidebarLayout.vue')
const mobileLayout = read('src/layouts/MobileDrawerLayout.vue')
const siteShell = read('src/layouts/SiteShell.vue')
const floatButton = read('src/components/system/FloatButton.vue')
const captureView = read('src/views/CaptureView.vue')
const consoleShell = read('src/components/console/ConsoleShell.vue')
const consoleSession = read('src/composables/useConsoleSession.ts')
const consoleOverview = readOptional('src/components/console/ConsoleOverviewHeader.vue')
const consolePanel = read('src/components/console/ConsolePanelView.vue')
const commandRegistry = read('src/console/commandRegistry.ts')
const routeBreadcrumb = read('src/components/system/RouteBreadcrumb.vue')
const postView = read('src/views/PostView.vue')
const noteView = read('src/views/NoteView.vue')
const homeView = read('src/views/HomeView.vue')
const displayPreference = read('src/composables/useDisplayModePreference.ts')
const consoleStyles = read('src/styles/console.scss')
const desktopTemplate = desktopLayout.split('<script setup')[0]
const consoleShellTemplate = consoleShell.split('<script setup')[0]
const footerTags = componentTags(desktopTemplate, 'Footer')
const desktopCommentTags = componentTags(desktopTemplate, 'GiscusComments')
const homeStatsTags = [
  ...componentTags(homeView, 'HomeStatsGrid'),
  ...(homeView.match(/<div\b[^>]*home-view__grid[^>]*>/g) || []),
]

const checks = []
function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

check('desktop layout mounts one shared RouterView', (desktopLayout.match(/<RouterView\b/g) || []).length === 1)
check('desktop Console mounts its dedicated overview header', componentTags(desktopTemplate, 'ConsoleOverviewHeader').some((tag) => tag.includes('v-if="isConsole"')))
check('desktop Console mounts a named command dock', componentTags(desktopTemplate, 'ConsoleShell').some((tag) => tag.includes('desktop-layout__command-dock')))
check(
  'Console overview precedes route output and the command dock follows it',
  desktopTemplate.indexOf('<ConsoleOverviewHeader') > -1
    && desktopTemplate.indexOf('<ConsoleOverviewHeader') < desktopTemplate.indexOf('<main')
    && desktopTemplate.indexOf('desktop-layout__result') < desktopTemplate.indexOf('desktop-layout__command-dock'),
)
check(
  'Console overview remains outside the scrolling route result',
  desktopTemplate.indexOf('<ConsoleOverviewHeader') < desktopTemplate.indexOf('ref="resultRef"')
    && /grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto\s*;/.test(desktopLayout),
)
check('mobile layout does not mount the console shell', !mobileLayout.includes('ConsoleShell'))
check('mobile layout does not mount the Console overview', !mobileLayout.includes('ConsoleOverviewHeader'))
check('desktop/mobile breakpoint remains 900px', siteShell.includes('(max-width: 900px)'))
check('settings button exposes expanded state', floatButton.includes(':aria-expanded="settingsOpen"'))
check('language selector exposes expanded state', floatButton.includes(':aria-expanded="languageOpen"'))
check('colour selector exposes expanded state', floatButton.includes(':aria-expanded="colorSchemeOpen"'))
check('console capture preserves authorized editor controls', captureView.includes('console-capture-editor'))
check('capture confirmation remains available in console mode', captureView.includes('<Teleport to="body">'))
check('console overrides dynamic mesh with matching specificity', desktopLayout.includes(':root.dynamic-background-enabled .desktop-layout--console .desktop-layout__content'))
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
check(
  'nested panels return to the previous menu with Escape',
  consolePanel.includes("event.key === 'Escape'")
    && consoleShell.includes('returnToPreviousMenu()')
    && consoleSession.includes('panelStack.value.pop()'),
)
check(
  'root slash suggestions expose every registered command',
  /if \(prefix === ['"]\/['"]\) return options\s/.test(consoleSession)
    && !consoleSession.includes('options.slice(0, 12)'),
)
const removedPanelCommands = ['agent', 'list', 'status', 'permissions', 'docker', 'workspace', 'model']
for (const removedCommand of removedPanelCommands) {
  check(
    `removed /${removedCommand} command has no dedicated panel entry`,
    !new RegExp(`(?:case\\s+['\"]${removedCommand}['\"]|\\b${removedCommand}\\s*:\\s*['\"])`).test(consolePanel)
      && !new RegExp(`\\|\\s*['\"]${removedCommand}['\"]`).test(commandRegistry),
  )
}
check(
  'Console viewport reserves its final row for the command dock',
  /grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto\s*;/.test(desktopLayout),
)
check(
  'Console command choices open below the prompt',
  consoleShellTemplate.indexOf('class="console-shell__transient"') > -1
    && consoleShellTemplate.indexOf('class="console-shell__prompt"') < consoleShellTemplate.indexOf('class="console-shell__transient"'),
)
check(
  'short desktop viewports constrain transient console content',
  consoleShell.includes('console-shell__transient')
    && consoleShell.includes('max-height: calc(100vh')
    && consoleShell.includes('overflow-y: auto'),
)
check(
  'console input exposes its active listbox to assistive technology',
  consoleShell.includes('role="combobox"')
    && consoleShell.includes(':aria-expanded="Boolean(activeListboxId)"')
    && consoleShell.includes(':aria-controls="activeListboxId || undefined"')
    && consoleShell.includes(':aria-activedescendant="activeOptionId || undefined"'),
)
check(
  'suggestion and panel options expose stable active-descendant ids',
  consoleShell.includes(':id="suggestionOptionId(index)"')
    && consolePanel.includes(':id="optionId(index)"')
    && consolePanel.includes('selection-change'),
)
check(
  'panel-free console feedback remains visible and announced',
  consoleShell.includes('feedback && !activePanel')
    && consoleShell.includes('role="status"')
    && consoleShell.includes('aria-live="polite"'),
)
check('Console overview component exists', Boolean(consoleOverview))
check('Console avatar occupies the left third', /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*2fr\)\s*;/.test(consoleOverview))
check('Console overview is flush with both viewport edges', /width:\s*100%\s*;/.test(consoleOverview) && /margin:\s*0\s*;/.test(consoleOverview))
check('Console overview avatar is grayscale only', /filter:\s*grayscale\(1\)\s*;/.test(consoleOverview))
check('Console overview avatar stays fully visible', /object-fit:\s*contain\s*;/.test(consoleOverview))
check(
  'Console overview avatar keeps normal bitmap rendering',
  /image-rendering:\s*auto\s*;/.test(consoleOverview) && !/image-rendering:\s*(?:pixelated|crisp-edges)/.test(consoleOverview),
)
check(
  'Console overview keeps only compact content and runtime sections',
  ['CONTENT', 'RUNTIME'].every((label) => consoleOverview.includes(label))
    && !['WORKSPACE', 'CONTACT', 'Hi!This is dieWehmut.'].some((label) => consoleOverview.includes(label)),
)
check('Console overview cards omit route labels', !consoleOverview.includes('<code>{{ stat.path }}</code>'))
check(
  'Console overview columns share a fixed one-third-height row',
  /aspect-ratio:\s*3\s*\/\s*1/.test(consoleOverview)
    && /\.console-overview__avatar[\s\S]*?height:\s*100%/.test(consoleOverview)
    && consoleOverview.includes('overflow: clip'),
)
check(
  'Console overview renders shared statistics and footer metadata',
  /v-for="[^\"]*stat/.test(consoleOverview)
    && /uptime/i.test(consoleOverview)
    && /copyright/i.test(consoleOverview)
    && /icp/i.test(consoleOverview),
)
check(
  'desktop Footer is mounted only outside Console mode',
  footerTags.some((tag) => tag.includes('v-if="!isConsole"')),
)
check(
  'desktop automatic comments are mounted only outside Console mode',
  desktopCommentTags.some((tag) => tag.includes('layout="desktop"') && tag.includes('v-if="!isConsole"')),
)
check(
  'classic Home statistics are hidden only while Console mode is effective',
  homeStatsTags.some((tag) => tag.includes('v-if="!isConsole"')),
)
check('mobile keeps automatic comments', mobileLayout.includes('<GiscusComments layout="mobile" />'))
check('mobile keeps its Footer', mobileLayout.includes('<Footer />'))
check('mobile keeps one shared route outlet', (mobileLayout.match(/<RouterView\b/g) || []).length === 1)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
