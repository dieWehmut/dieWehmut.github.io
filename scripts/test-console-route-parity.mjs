import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const projectView = read('src/views/ProjectView.vue')
const captureView = read('src/views/CaptureView.vue')
const captureConsoleTemplate = captureView.slice(
  captureView.indexOf('<template v-if="isConsole">'),
  captureView.indexOf('\n      <template v-else>', captureView.indexOf('<template v-if="isConsole">')),
)
const infraView = read('src/views/InfraView.vue')
const app = read('src/App.vue')
const desktopLayout = read('src/layouts/DesktopSidebarLayout.vue')
const mobileLayout = read('src/layouts/MobileDrawerLayout.vue')
const router = read('src/router.ts')
const navMenu = read('src/components/navigation/NavMenu.vue')
const siteSidebar = read('src/components/navigation/SiteSidebar.vue')
const routeBreadcrumb = read('src/components/system/RouteBreadcrumb.vue')
const notFoundView = read('src/views/NotFoundView.vue')
const consoleStyles = read('src/styles/console.scss')
const monthNavigator = read('src/components/console/ConsoleMonthNavigator.vue')
const consoleShell = read('src/components/console/ConsoleShell.vue')
const searchView = read('src/views/SearchView.vue')
const tagsView = read('src/views/TagsView.vue')
const tagDetailView = read('src/views/TagDetailView.vue')
const consoleSelection = read('src/console/selection.ts')

const checks = [
  ['project console keeps site links', projectView.includes('console-project__link--site')],
  ['project console keeps repository links', projectView.includes('console-project__link--repo')],
  ['capture detail keeps tag navigation', captureView.includes('selectedGroup.tags') && captureView.includes('console-capture-detail__tags')],
  ['capture timeline keeps tag navigation', captureView.includes('asCaptureGroup(item).tags') && captureView.includes('console-capture-group__tags')],
  [
    'capture timeline bounds each image preview group',
    captureView.includes('v-for="asset in previewAssets(asCaptureGroup(item))"')
      && !captureView.includes('v-for="asset in asCaptureGroup(item).assets"'),
  ],
  [
    'capture timeline exposes the hidden image count as a group link',
    captureView.includes('console-capture-group__overflow')
      && captureView.includes('hiddenAssetCount(asCaptureGroup(item))'),
  ],
  ['capture detail still renders the complete selected group', captureView.includes('v-for="asset in selectedGroup.assets"')],
  [
    'capture detail images defer offscreen loading',
    /v-for="asset in selectedGroup\.assets"[\s\S]{0,700}?<img[\s\S]{0,180}?loading="lazy"/.test(captureConsoleTemplate),
  ],
  [
    'capture group links save the console result viewport before navigation',
    /class="console-capture-group__overflow"[\s\S]{0,320}?@click="saveCaptureScrollPosition"/.test(captureConsoleTemplate)
      && /console-capture-group__body[\s\S]{0,220}?<RouterLink[^>]*@click="saveCaptureScrollPosition"/.test(captureConsoleTemplate),
  ],
  [
    'capture month selection survives a detail round trip',
    captureView.includes('state-key="capture"')
      && monthNavigator.includes('stateKey')
      && monthNavigator.includes('sessionStorage'),
  ],
  ['capture back navigation restores the console result viewport', captureView.includes('activeCaptureScrollContainer')],
  ['console feed cards cannot overflow their viewport', consoleStyles.includes('.desktop-layout--console .feed-entry-card') && consoleStyles.includes('margin-inline: 0 !important')],
  ['console infra stops the orbit side ticker', infraView.includes('syncSideTicker') && infraView.includes('watch(isConsole')],
  ['console mode does not mount floating controls', /<FloatButton\s+v-if="!isConsole"\s*\/>/.test(app)],
  ['standard desktop keeps the footer outside console mode', /<Footer\s+v-if="!isConsole"\s*\/>/.test(desktopLayout)],
  ['standard desktop keeps automatic comments outside console mode', /<GiscusComments\s+v-if="!isConsole"[^>]*\/>/.test(desktopLayout)],
  ['mobile layout keeps its footer and automatic comments', mobileLayout.includes('<Footer />') && mobileLayout.includes('<GiscusComments layout="mobile" />')],
  ['router registers a dedicated root view loader', /root:\s*\(\)\s*=>\s*import\(['"]\.\/views\/RootView\.vue['"]\)/.test(router)],
  ['router registers a distinct root landing', /path:\s*['"]\/['"][^\n]+name:\s*['"]root['"][^\n]+component:\s*viewLoaders\.root/.test(router)],
  ['router registers canonical Home at slash-home', /path:\s*['"]\/home['"][^\n]+name:\s*['"]home['"][^\n]+component:\s*viewLoaders\.home/.test(router)],
  ['root landing is preloaded independently', /\[['"]\/['"],\s*viewLoaders\.root\]/.test(router)],
  ['Home route is preloaded by its canonical path', /\[['"]\/home['"],\s*viewLoaders\.home\]/.test(router)],
  ['primary navigation links Home canonically', /name:\s*['"]home['"][^\n]+to:\s*['"]\/home['"]/.test(navMenu)],
  ['sidebar avatar links Home canonically', /to="\/home"/.test(siteSidebar)],
  [
    'breadcrumbs link Home canonically',
    routeBreadcrumb.includes("home: { label: 'Home', to: '/home' }")
      && /siteCrumb\s*=\s*\{[^\n]+to:\s*['"]\/home['"]/.test(routeBreadcrumb),
  ],
  ['not-found recovery links Home canonically', !/to="\/"/.test(notFoundView) && /to="\/home"/.test(notFoundView)],
  ['empty monthly views render an explicit empty state', !/<section\s+v-if="months\.length"/.test(monthNavigator) && /<template\s+v-if="months\.length">/.test(monthNavigator)],
  [
    'monthly navigation renders date tabs without visible edge arrows',
    monthNavigator.includes('role="tablist"')
      && monthNavigator.includes('role="tab"')
      && monthNavigator.includes('selectMonth(index)')
      && !monthNavigator.includes('Previous month')
      && !monthNavigator.includes('Next month'),
  ],
  [
    'empty console prompt forwards horizontal keys to the month tabs',
    consoleShell.includes('CONSOLE_MONTH_NAVIGATION_EVENT')
      && consoleShell.includes('ArrowLeft')
      && consoleShell.includes('ArrowRight'),
  ],
  ['console section arrows select adjacent headings', read('src/components/system/ScrollSpySidebar.vue').includes('scrollToHeading(target.id)')],
  ['console search reuses typed result behavior', (searchView.match(/<SearchResultItem\b/g) || []).length >= 2],
  [
    'console tag index supports cyclic arrow selection and Enter from the command prompt',
    tagsView.includes('moveConsoleSelection')
      && tagsView.includes('CONSOLE_RESULT_NAVIGATION_EVENT')
      && tagsView.includes("action === 'activate'")
      && tagsView.includes("'is-selected': consoleTagCursor === index")
      && consoleShell.includes('CONSOLE_RESULT_NAVIGATION_EVENT')
      && consoleSelection.includes('CONSOLE_RESULT_NAVIGATION_EVENT'),
  ],
  [
    'console tag capture groups use bounded previews with a remaining count',
    tagDetailView.includes('previewCaptureAssets(asCaptureTimelineItem(item).group)')
      && tagDetailView.includes('hiddenCaptureAssetCount(asCaptureTimelineItem(item).group)')
      && !tagDetailView.includes('v-for="capture in asCaptureTimelineItem(item).group.assets"'),
  ],
  [
    'console tag capture entries link to their stable group route',
    tagDetailView.includes('captureGroupUrl(asCaptureTimelineItem(item).group)')
      && !tagDetailView.includes("group.assets[0]?.id || ''"),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
