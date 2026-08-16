import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const projectView = read('src/views/ProjectView.vue')
const captureView = read('src/views/CaptureView.vue')
const infraView = read('src/views/InfraView.vue')
const floatButton = read('src/components/system/FloatButton.vue')
const consoleStyles = read('src/styles/console.scss')
const monthNavigator = read('src/components/console/ConsoleMonthNavigator.vue')
const searchView = read('src/views/SearchView.vue')

const checks = [
  ['project console keeps site links', projectView.includes('console-project__link--site')],
  ['project console keeps repository links', projectView.includes('console-project__link--repo')],
  ['capture detail keeps tag navigation', captureView.includes('selectedGroup.tags') && captureView.includes('console-capture-detail__tags')],
  ['capture timeline keeps tag navigation', captureView.includes('asCaptureGroup(item).tags') && captureView.includes('console-capture-group__tags')],
  ['capture back navigation restores the console result viewport', captureView.includes('activeCaptureScrollContainer')],
  ['console feed cards cannot overflow their viewport', consoleStyles.includes('.desktop-layout--console .feed-entry-card') && consoleStyles.includes('margin-inline: 0 !important')],
  ['console infra stops the orbit side ticker', infraView.includes('syncSideTicker') && infraView.includes('watch(isConsole')],
  ['console floating controls use terminal chrome', floatButton.includes("'is-console': isConsole") && floatButton.includes('.float-controls.is-console')],
  ['empty monthly views render an explicit empty state', !/<section\s+v-if="months\.length"/.test(monthNavigator) && /<template\s+v-if="months\.length">/.test(monthNavigator)],
  ['console section arrows select adjacent headings', read('src/components/system/ScrollSpySidebar.vue').includes('scrollToHeading(target.id)')],
  ['console search reuses typed result behavior', (searchView.match(/<SearchResultItem\b/g) || []).length >= 2],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
