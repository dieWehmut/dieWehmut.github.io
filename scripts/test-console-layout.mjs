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
const router = read('src/router.ts')
const desktopTemplate = desktopLayout.split('<script setup')[0]
const consoleLayoutBlock = desktopLayout.match(/\.desktop-layout--console \{[\s\S]*?\n\}/)?.[0] || ''
const consoleContentBlock = desktopLayout.match(/\.desktop-layout--console \.desktop-layout__content \{[\s\S]*?\n\}/)?.[0] || ''
const consoleResultBlock = desktopLayout.match(/\.desktop-layout--console \.desktop-layout__result \{[\s\S]*?\n\}/)?.[0] || ''
const consoleShellTemplate = consoleShell.split('<script setup')[0]
const consoleOverviewAvatarBlock = consoleOverview.match(/\.console-overview__avatar \{[^}]*\}/)?.[0] || ''
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
  'Console mode scrolls the whole document instead of an inner viewport',
  /min-height:\s*100vh\s*;/.test(consoleLayoutBlock)
    && !/overflow/.test(consoleLayoutBlock)
    && !/overflow/.test(consoleContentBlock)
    && !/overflow/.test(consoleResultBlock)
    && !desktopLayout.includes('resultRef'),
)
check(
  'Console reveal helpers drive the window scroller',
  desktopLayout.includes('window.scrollTo({ top: 0')
    && desktopLayout.includes('window.scrollY + anchor.getBoundingClientRect().top'),
)
check(
  'Console route output can always reach the top of the page',
  /\.desktop-layout--console \.desktop-layout__main \{[\s\S]*?min-height:\s*100vh\s*;/.test(desktopLayout)
    && /\.desktop-layout--console \.desktop-layout__main--empty \{[\s\S]*?min-height:\s*0\s*;/.test(desktopLayout),
)
check(
  'router hands the scroller to Console mode',
  /scrollBehavior\([\s\S]*?useDisplayModePreference\(\)\.isConsole\.value\) return false/.test(router),
)
check('mobile layout does not mount the console shell', !mobileLayout.includes('ConsoleShell'))
check('mobile layout does not mount the Console overview', !mobileLayout.includes('ConsoleOverviewHeader'))
check('desktop/mobile breakpoint remains 900px', siteShell.includes('(max-width: 900px)'))
check('settings button exposes expanded state', floatButton.includes(':aria-expanded="settingsOpen"'))
check('language selector exposes expanded state', floatButton.includes(':aria-expanded="languageOpen"'))
check('colour selector exposes expanded state', floatButton.includes(':aria-expanded="colorSchemeOpen"'))
check(
  'classic controls use the terminal prompt mark for Console mode',
  floatButton.includes('float-controls__terminal-mark')
    && floatButton.includes('&gt;_')
    && !floatButton.includes('<Monitor />'),
)
check('console capture preserves authorized editor controls', captureView.includes('console-capture-editor'))
check('capture confirmation remains available in console mode', captureView.includes('<Teleport to="body">'))
check('console overrides dynamic mesh with matching specificity', desktopLayout.includes(':root.dynamic-background-enabled .desktop-layout--console .desktop-layout__content'))
check('nested panels expose keyboard selection', consolePanel.includes('activateSelection'))
check('console typography does not scale with viewport width', !/font-size:\s*clamp\(/.test(consoleShell))
check(
  'console typography uses neutral letter spacing',
  [...consoleShell.matchAll(/letter-spacing:\s*([^;]+);/g)].every((match) => match[1].trim() === '0'),
)
check(
  'console prompt caret and every option row share one left edge',
  /--console-prompt-indent:\s*34px/.test(consoleShell)
    && /\.console-shell__prompt-symbol \{[\s\S]*?width:\s*var\(--console-prompt-indent\)/.test(consoleShell)
    && /\.console-shell__suggestion \{[\s\S]*?padding:[^;]*var\(--console-prompt-indent\)/.test(consoleShell)
    && /\.console-panel__heading \{[\s\S]*?padding-left:\s*var\(--console-prompt-indent/.test(consolePanel)
    && /\.console-panel__row \{[\s\S]*?padding:[^;]*var\(--console-prompt-indent/.test(consolePanel),
)
check('shared article PDF export remains in standard mode', routeBreadcrumb.includes('ArticleExportButton'))
check(
  'console article pages carry no export button of their own',
  !postView.includes('ArticleExportButton') && !noteView.includes('ArticleExportButton'),
)
check(
  'the console exports the current article through /export',
  consoleSession.includes("from './useArticlePdfExport'")
    && /resolution\.kind === 'export' && !hasExportableArticle\(\)/.test(consoleSession)
    && /resolution\.kind === 'export'\)[\s\S]*?await exportArticlePdf\(\)/.test(consoleSession),
)
check('console mode marks the document for native cursor overrides', displayPreference.includes('console-mode-active'))
check('console uses the terminal text cursor everywhere', consoleStyles.includes('cursor: text !important'))
check(
  'console option rows are a fixed window that travels with the cursor',
  consoleShell.includes("from '../../console/suggestions'")
    && /const visibleSuggestions = computed\([\s\S]*?consoleOptionWindowStart\(suggestionCursor\.value, suggestions\.value\.length\)/.test(consoleShell)
    && consoleShell.includes('v-for="{ suggestion, index } in visibleSuggestions"')
    && /const visibleOptions = computed\([\s\S]*?consoleOptionWindowStart\(selectedIndex\.value, panelOptions\.value\.length\)/.test(consolePanel)
    && consolePanel.includes('v-for="{ option, index } in visibleOptions"'),
)
check(
  'the windowed rows replace scrolling inside the dock',
  !consoleShell.includes('scrollIntoView')
    && !consolePanel.includes('scrollIntoView')
    && !consoleShell.includes('suggestionsRef'),
)
check(
  'an expanded dock rides the viewport bottom without moving the page',
  consoleShell.includes("'console-shell--expanded': hasTransient")
    && /const hasTransient = computed\([\s\S]*?feedback\.value && !activePanel\.value/.test(consoleShell)
    && /\.desktop-layout__command-dock\.console-shell--expanded \{[^}]*position: sticky;[^}]*bottom: 0;/.test(desktopLayout),
)

check(
  'nested panels return to the previous menu with Escape',
  consolePanel.includes("event.key === 'Escape'")
    && consoleShell.includes('returnToPreviousMenu()')
    && consoleSession.includes('panelStack.value.pop()'),
)
check(
  'choosing a value collapses the dock back to the bare prompt',
  /if \(commits\) collapseCommittedPanel\(resolution\.panel\)/.test(consoleSession)
    && /function collapseCommittedPanel\([\s\S]*?activePanel\.value = null[\s\S]*?feedback\.value = ''/.test(consoleSession),
)
check(
  'Escape reopens the panel a choice collapsed',
  /function reopenCommittedPanel\([\s\S]*?activePanel\.value = \{ panel: committed\.panel \}/.test(consoleSession)
    && /if \(target === null\) return reopenCommittedPanel\(\)/.test(consoleSession),
)
check(
  'the collapsed panel is only the step just taken',
  /function setInput\([^}]*committedPanel\.value = null/.test(consoleSession)
    && /function clearPanelNavigation\([^}]*committedPanel\.value = null/.test(consoleSession),
)
check(
  'suggestion filtering lives in the pure console module',
  consoleSession.includes("from '../console/suggestions'")
    && /return filterConsoleSuggestions\(prefix, listConsoleCommands\(commandAvailability\), dynamicOptions\)/.test(consoleSession)
    && !consoleSession.includes('options.slice(0, 12)'),
)
const removedPanelCommands = [
  'agent',
  'list',
  'status',
  'permissions',
  'docker',
  'workspace',
  'model',
  'archive',
  'config',
  'doctor',
]
for (const removedCommand of removedPanelCommands) {
  check(
    `removed /${removedCommand} command has no dedicated panel entry`,
    !new RegExp(`(?:case\\s+['\"]${removedCommand}['\"]|\\b${removedCommand}\\s*:\\s*['\"])`).test(consolePanel)
      && !new RegExp(`\\|\\s*['\"]${removedCommand}['\"]`).test(commandRegistry),
  )
}
check(
  'Console command dock sits at the end of the document flow',
  /\.desktop-layout--console \.desktop-layout__content[\s\S]*?display:\s*block\s*;/.test(desktopLayout)
    && !/\.desktop-layout--console \.desktop-layout__result[\s\S]*?flex:\s*0\s+1\s+auto\s*;/.test(desktopLayout)
    && !/grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto\s*;/.test(desktopLayout),
)
check(
  'Console command choices open below the prompt',
  consoleShellTemplate.indexOf('class="console-shell__transient"') > -1
    && consoleShellTemplate.indexOf('class="console-shell__prompt"') < consoleShellTemplate.indexOf('class="console-shell__transient"'),
)
check(
  'Console dock no longer clamps itself to the viewport height',
  consoleShell.includes('console-shell__transient')
    && !/max-height:\s*calc\(100vh/.test(consoleShell)
    && !/max-height:\s*min\(38vh/.test(consoleShell),
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
  'Console overview starts with a terminal site title',
  consoleOverview.indexOf('console-overview__chrome') > -1
    && consoleOverview.indexOf('console-overview__chrome') < consoleOverview.indexOf('>CONTENT<')
    && consoleOverview.includes('&gt;_')
    && consoleOverview.includes('{{ config.title }}'),
)
check(
  'Console overview exposes a direct classic mode switch',
  consoleOverview.includes('console-overview__classic')
    && consoleOverview.includes("setDisplayMode('standard')")
    && consoleOverview.includes('aria-label="Switch to classic mode"'),
)
check(
  'Console overview columns share a fixed one-third-height row',
  /aspect-ratio:\s*3\s*\/\s*1/.test(consoleOverview)
    && /\.console-overview__portrait \{[^}]*height:\s*100%/.test(consoleOverview)
    && consoleOverview.includes('overflow: clip'),
)
check(
  'the portrait plate keeps its size while the icon inside is inset',
  /width:\s*80%/.test(consoleOverviewAvatarBlock)
    && /height:\s*80%/.test(consoleOverviewAvatarBlock)
    && !/height:\s*100%/.test(consoleOverviewAvatarBlock),
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
check(
  'theme and color rows preview the moment the cursor lands on them',
  /livePreview: \{ kind: 'theme'/.test(consolePanel)
    && /livePreview: \{ kind: 'color'/.test(consolePanel)
    && /function selectIndex\([\s\S]*?previewIndex\(selectedIndex\.value\)/.test(consolePanel)
    && /function moveSelection\([\s\S]*?previewIndex\(selectedIndex\.value\)/.test(consolePanel),
)
check(
  'only click or Enter commits the previewed preference',
  consolePanel.includes('@click="commitIndex(index)"')
    && /function commitIndex\([\s\S]*?previewBaseline = null[\s\S]*?emit\('execute'/.test(consolePanel)
    && /function activateSelection\(\)[\s\S]*?commitIndex\(selectedIndex\.value\)/.test(consolePanel),
)
check(
  'leaving a preference panel rolls the preview back',
  /function cancelPreview\(\)[\s\S]*?applyPreference\(previewBaseline\)/.test(consolePanel)
    && /function closePanel\(\)[\s\S]*?cancelPreview\(\)/.test(consolePanel)
    && /event\.key === 'Escape'[\s\S]*?cancelPreview\(\)/.test(consolePanel)
    && /watch\(\s*\[\(\) => props\.panel[\s\S]*?cancelPreview\(\)/.test(consolePanel),
)
check(
  'opening a preference panel starts on the option that is already live',
  consolePanel.includes('findIndex((option) => option.current)'),
)
check(
  'light themes keep the avatar plate and the command input on the page background',
  /--console-canvas: var\(--console-surface\)/.test(desktopLayout)
    && /html\[data-theme='light'\] \.desktop-layout--console \{[\s\S]*?--console-canvas: var\(--console-bg\)/.test(desktopLayout)
    && /\.console-shell__prompt \{[\s\S]*?background: var\(--console-canvas/.test(consoleShell)
    && /\.console-overview__portrait \{[\s\S]*?background: var\(--console-canvas/.test(consoleOverview),
)
check(
  'every console panel is a list of options, so the detail table is gone',
  !consolePanel.includes('console-panel__details')
    && !consolePanel.includes('detailLines')
    && /const panelOptions = computed<PanelOption\[\]>/.test(consolePanel),
)
check(
  'console mode draws no rules',
  /\.desktop-layout--console \{[^}]*--console-border: transparent;[^}]*--console-border-strong: transparent;/
    .test(desktopLayout),
)
check(
  'every line in a console rule resolves through a border token',
  paintedConsoleLines().length === 0,
)

/**
 * Console mode stays rule-free by keeping its two border tokens transparent, so
 * a line that names any other colour escapes that switch. This walks the whole
 * stylesheet surface rather than a list of files, so a console block added
 * later cannot quietly reintroduce one.
 */
function paintedConsoleLines() {
  const lineProperty = /^(?:border|outline)(?:-(?:top|right|bottom|left))?(?:-color)?$/
  const painted = []
  for (const file of styleFiles(path.join(root, 'src'))) {
    const source = fs.readFileSync(file, 'utf8')
    for (const [, selector, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/console/i.test(selector)) continue
      for (const declaration of body.split(';')) {
        const separator = declaration.indexOf(':')
        if (separator < 0) continue
        const property = declaration.slice(0, separator).trim()
        const value = declaration.slice(separator + 1).replace('!important', '').trim()
        if (!lineProperty.test(property)) continue
        if (/^(?:0|none)$/.test(value)) continue
        if (/\btransparent\b/.test(value) || value.includes('--console-border')) continue
        painted.push(`${file} :: ${selector.trim()} :: ${property}: ${value}`)
      }
    }
  }
  return painted
}

function styleFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return styleFiles(full)
    return /\.(?:vue|scss|css)$/.test(entry.name) ? [full] : []
  })
}

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
for (const painted of paintedConsoleLines()) console.log(`     ${painted}`)
if (failures.length) process.exitCode = 1
