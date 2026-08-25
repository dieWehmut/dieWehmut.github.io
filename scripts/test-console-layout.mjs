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
const friendsView = read('src/views/FriendsView.vue')
const aboutView = read('src/views/AboutView.vue')
const notFoundView = read('src/views/NotFoundView.vue')
const consoleShell = read('src/components/console/ConsoleShell.vue')
const consoleSession = read('src/composables/useConsoleSession.ts')
const consoleOverview = readOptional('src/components/console/ConsoleOverviewHeader.vue')
const consolePanel = read('src/components/console/ConsolePanelView.vue')
const commandRegistry = read('src/console/commandRegistry.ts')
const consoleRowAccent = read('src/composables/useConsoleRowAccent.ts')
const consoleBlockCaret = read('src/composables/useConsoleBlockCaret.ts')
const monthNavigator = read('src/components/console/ConsoleMonthNavigator.vue')
const routeBreadcrumb = read('src/components/system/RouteBreadcrumb.vue')
const postView = read('src/views/PostView.vue')
const noteView = read('src/views/NoteView.vue')
const homeView = read('src/views/HomeView.vue')
const displayPreference = read('src/composables/useDisplayModePreference.ts')
const scrollSpy = read('src/components/system/ScrollSpySidebar.vue')
const consoleStatusLine = read('src/composables/useConsoleStatusLine.ts')
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
  // The float button reads and writes the same scroller. It kept calling a helper
  // that had been deleted along with the inner viewport, so back-to-top threw
  // instead of scrolling — plain-JS SFCs are outside vue-tsc, so nothing caught it.
  'the float button scrolls the same scroller it watches',
  floatButton.includes('atTop.value = window.scrollY < 60')
    && floatButton.includes('window.scrollTo({ top: 0')
    && !floatButton.includes('activeScrollContainer'),
)
check(
  'Console route output can always reach the top of the page',
  // The reserve belongs to the output block as a whole. Held on the route output
  // alone it would have spent its slack between that output and its comments,
  // which is the gap this places after them instead.
  /min-height:\s*100vh\s*;/.test(consoleResultBlock)
    && !/\.desktop-layout--console \.desktop-layout__main \{[^}]*min-height/.test(desktopLayout)
    && /\.desktop-layout--console \.desktop-layout__result--empty \{[^}]*min-height:\s*0\s*;/.test(desktopLayout)
    && desktopTemplate.includes("'desktop-layout__result--empty': isConsole && route.name === 'root'"),
)
check(
  'the comment block reads as the tail of the output it belongs to',
  /--console-block-tail:\s*\d+px/.test(consoleLayoutBlock)
    && /\.desktop-layout--console \.desktop-layout__main \{[^}]*padding:[^;]*var\(--console-block-tail\)/.test(desktopLayout)
    && /\.desktop-layout__comment \{[^}]*padding: 0 0 var\(--console-block-tail\)/.test(desktopLayout),
)
check(
  'both console top rows ride the top of the viewport out of one recipe',
  /\.desktop-layout--console \.console-top-row \{[^}]*position: sticky/.test(consoleStyles)
    && /\.desktop-layout--console \.console-top-row \{[^}]*top: 0/.test(consoleStyles)
    && /\.desktop-layout--console \.console-top-row \{[^}]*background: var\(--console-bg\)/.test(consoleStyles)
    && scrollSpy.includes("'console-top-row': effectiveMode === 'console'")
    && monthNavigator.includes('console-month-navigator__header console-top-row')
    // The rule that used to flatten the sidebar also un-stuck it.
    && !/\.desktop-layout--console \.scroll-spy \{[^}]*position: static/.test(consoleStyles),
)
check(
  'a stuck row leaves the wheel to the page it is pinned over',
  /effectiveMode\.value === 'console'\) return/.test(scrollSpy)
    && !/navRef\.value\.scrollLeft \+= event\.deltaY/.test(scrollSpy),
)
check(
  // Nudging the strip just far enough to expose the selected box leaves that box
  // against an edge, so on a long article the row shows nothing of the direction the
  // reader is travelling in. Centring is the rule the prompt's own option list
  // already follows; the boxes here are as wide as their titles, so it is written in
  // pixels, and an assignment past either limit is clamped into the parking the
  // helper does with Math.min/Math.max.
  'the section strip holds the selection in the middle and re-aims only on a new section',
  /nav\.scrollLeft \+= \(buttonRect\.left \+ buttonRect\.width \/ 2\) - \(navRect\.left \+ navRect\.width \/ 2\)/.test(scrollSpy)
    && /if \(centredId === activeId\.value\) return/.test(scrollSpy)
    && !/scrollLeft -= navRect\.left - buttonRect\.left \+ 12/.test(scrollSpy),
)
check(
  // The boxes are slot content, so they wear their host view's style scope and the
  // marker has to be global. Being global it ties with the surface those hosts give
  // their own cards, which is why the class is doubled rather than made important.
  'the box under the keyboard cursor is marked globally and outranks its own surface',
  /\.console-box-selected\.console-box-selected \{[^}]*background: color-mix\(in srgb, var\(--console-row-accent/.test(consoleStyles)
    && monthNavigator.includes("const CONSOLE_BOX_SELECTED_CLASS = 'console-box-selected'")
    && monthNavigator.includes('classList.toggle(CONSOLE_BOX_SELECTED_CLASS, selected)')
    // Same accent cycle as the prompt's own menu, so one cursor reads one way.
    && monthNavigator.includes("setProperty('--console-row-accent', rowAccent(index))")
    && !/\.desktop-layout--console \.console-box-selected[^.{]*\{/.test(consoleStyles),
)
check(
  'a box scrolling into view clears the row it is stuck under, from the row height itself',
  /--console-top-row-height:\s*\d+px/.test(consoleLayoutBlock)
    && /\.console-box-selected\.console-box-selected \{[^}]*scroll-margin-top: var\(--console-top-row-height\)/.test(consoleStyles)
    && /__header \{[^}]*min-height: var\(--console-top-row-height\)/.test(monthNavigator),
)
check(
  'router hands the scroller to Console mode',
  /scrollBehavior\([\s\S]*?useDisplayModePreference\(\)\.isConsole\.value\) return false/.test(router),
)
check(
  // One array, read straight off the live preferences, so a fork adds a reading by
  // appending an entry rather than by touching the template.
  'the status line reads back the state every preference command owns',
  ['path', 'mode', 'theme', 'color', 'icon', 'language', 'background']
    .every((key) => new RegExp(`key: '${key}'`).test(consoleStatusLine))
  && consoleStatusLine.includes('route.path')
  && consoleStatusLine.includes('activeMode.value')
  && consoleStatusLine.includes('iconForm.value')
  && consoleStatusLine.includes('dynamicBackgroundEnabled.value')
  && consoleShell.includes('const { segments: statusSegments } = useConsoleStatusLine()')
  && /v-for="\(segment, index\) in statusSegments"/.test(consoleShellTemplate),
)
check(
  // Last in the dock: the prompt keeps its menu directly beneath it, and with
  // nothing transient open this lands right under the input, as pictured.
  'the status line sits below the prompt without splitting it from its suggestions',
  consoleShellTemplate.indexOf('console-shell__status')
    > consoleShellTemplate.indexOf('console-shell__transient')
  && /\.console-shell__status \{[^}]*padding: 0 12px 0 var\(--console-prompt-indent\)/.test(consoleShell)
  // Values a step brighter than the dots between them.
  && /\.console-shell__status \{[^}]*color: var\(--console-dim\)/.test(consoleShell)
  && /\.console-shell__status-value \{[^}]*color: var\(--console-muted\)/.test(consoleShell),
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
    && /\.console-shell__prompt-symbol \{[^}]*width:\s*var\(--console-prompt-indent\)/.test(consoleShell)
    && /\.console-shell__suggestion \{[^}]*padding:[^;]*var\(--console-prompt-indent\)/.test(consoleShell)
    && /\.console-panel__heading \{[^}]*padding-left:\s*var\(--console-prompt-indent/.test(consolePanel)
    && /\.console-panel__row \{[^}]*padding:[^;]*var\(--console-prompt-indent/.test(consolePanel),
)
check(
  'a measured block replaces the browser caret in the prompt',
  /\.console-shell__input \{[^}]*caret-color: transparent/.test(consoleShell)
    && consoleShellTemplate.includes('class="console-shell__caret"')
    && consoleShellTemplate.includes('`${caretWidth}px`')
    && consoleShellTemplate.includes('translate(${caretOffset}px, -50%)')
    && /\.console-shell__caret \{[^}]*background: var\(--console-accent\)/.test(consoleShell),
)
check(
  'the block is measured from the field it covers, at the same size',
  /getComputedStyle\(input\)/.test(consoleBlockCaret)
    && /measureText\(text\)\.width/.test(consoleBlockCaret)
    && /paddingLeft\) \+ parseFloat\(styles\.borderLeftWidth\)/.test(consoleBlockCaret)
    && /input\.scrollLeft/.test(consoleBlockCaret)
    && /\.console-shell__input \{[^}]*font-size: var\(--console-input-size\)/.test(consoleShell)
    && /\.console-shell__caret \{[^}]*font-size: var\(--console-input-size\)/.test(consoleShell),
)
check(
  'the block only reads the selection and never touches a key binding',
  !/keydown|preventDefault|event\.key/.test(consoleBlockCaret)
    && /requestAnimationFrame\(measure\)/.test(consoleBlockCaret)
    && (consoleShellTemplate.match(/@keydown="handleShellKeydown"/g) || []).length === 1
    && consoleShell.includes('handleSessionInputKeydown(event)'),
)
check(
  'the block blinks like a terminal and holds still for reduced motion',
  /animation: console-caret-blink [^;]*step-end infinite/.test(consoleShell)
    && /@media \(prefers-reduced-motion: reduce\) \{\s*\.console-shell__caret \{[^}]*animation: none/.test(consoleShell),
)
check(
  // Where the marker sits is this suite's claim; what it says is translated now, so
  // the wording is checked in scripts/test-console-i18n.mjs instead.
  'the INSERT marker rides the far end of the row, clear of the slash column',
  consoleShellTemplate.includes("t('console.shell.insert')")
    && consoleShellTemplate.indexOf('console-shell__mode') > consoleShellTemplate.indexOf('console-shell__field')
    && consoleShellTemplate.indexOf('console-shell__mode') < consoleShellTemplate.indexOf('console-shell__submit'),
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
    // The registry's rows now pass through a `map` that turns each description key
    // into text, so the command list reaches the filter as a local rather than
    // inline. What matters is unchanged: the registry supplies the rows and the pure
    // module does the filtering, with no second cap applied here.
    && /const commands = listConsoleCommands\(commandAvailability\)/.test(consoleSession)
    && /return filterConsoleSuggestions\(prefix, commands, dynamicOptions\)/.test(consoleSession)
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
check('Console overview avatar draws grayscale through a form of its own', /--grayscale \{[^}]*filter:\s*grayscale\(1\)\s*;/.test(consoleOverview))
check('Console overview avatar stays fully visible', /object-fit:\s*contain\s*;/.test(consoleOverview))
// The four icon forms are `test-console-avatar.mjs`'s subject. All this file asks
// is that the base rule stays neutral, so each form adds its own look rather than
// fighting a default, and that the coarse form's sampling cannot leak onto it.
check(
  'the avatar rule itself stays neutral so every icon form opts in',
  /filter:\s*none\s*;/.test(consoleOverviewAvatarBlock)
    && /image-rendering:\s*auto\s*;/.test(consoleOverviewAvatarBlock),
)
check(
  'coarse sampling is confined to the form that asks for it',
  !/image-rendering:\s*(?:pixelated|crisp-edges)/.test(consoleOverviewAvatarBlock)
    && /--pixelated \{[^}]*image-rendering:\s*pixelated/.test(consoleOverview),
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
  consoleOverview.includes("setDisplayMode('standard')")
    && consoleOverview.includes('aria-label="Switch to classic mode"'),
)
check(
  'Console overview columns share a fixed one-third-height row',
  /aspect-ratio:\s*3\s*\/\s*1/.test(consoleOverview)
    && /\.console-overview__portrait \{[^}]*height:\s*100%/.test(consoleOverview)
    && consoleOverview.includes('overflow: clip'),
)
check(
  'the portrait plate keeps its size while the icon inside is nearly plate-sized',
  avatarInset() >= 90
    && avatarInset() < 100
    && !/height:\s*100%/.test(consoleOverviewAvatarBlock)
    && /\.console-overview__portrait \{[^}]*place-items: center/.test(consoleOverview),
)

/**
 * How much of the plate the icon takes, as a whole percent, read from the token
 * both axes are sized from. 0 unless both axes actually resolve through it — an
 * icon inset on one axis only would gain a lopsided margin.
 */
function avatarInset() {
  const inset = consoleOverviewAvatarBlock.match(/--console-icon-inset:\s*(\d+)%/)?.[1]
  const bothAxes = /width:\s*var\(--console-icon-inset\)/.test(consoleOverviewAvatarBlock)
    && /height:\s*var\(--console-icon-inset\)/.test(consoleOverviewAvatarBlock)
  return inset && bothAxes ? Number(inset) : 0
}
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
  'light themes keep the command input on the page background',
  /--console-canvas: var\(--console-surface\)/.test(desktopLayout)
    && /html\[data-theme='light'\] \.desktop-layout--console \{[^}]*--console-canvas: var\(--console-bg\)/.test(desktopLayout)
    && /\.console-shell__prompt \{[^}]*background: var\(--console-canvas/.test(consoleShell),
)
check(
  'the avatar plate takes the banner background in both themes',
  /\.console-overview__portrait \{[^}]*background: var\(--console-bg\)/.test(consoleOverview)
    && !consoleOverview.includes('--console-canvas'),
)
check(
  'console section chips are sized like the month chips, so several fit the row',
  /\.desktop-layout--console \.scroll-spy__nav button \{[^}]*width: auto !important;[^}]*max-width: 25% !important;/
    .test(consoleStyles)
    && /\.desktop-layout--console \.scroll-spy__nav button \{[^}]*white-space: nowrap !important;/.test(consoleStyles)
    && /\.desktop-layout--console \.scroll-spy__nav button \{[^}]*text-overflow: ellipsis !important;/.test(consoleStyles)
    && /\.console-month-navigator__header button \{[^}]*white-space: nowrap;/.test(monthNavigator),
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
  'the cursored row borrows another colour scheme, cycling by row index',
  /filter\(\(id\) => id !== colorScheme\.value\)/.test(consoleRowAccent)
    && /siteColorSchemes\[id\]\[theme\.value\]\.accent/.test(consoleRowAccent)
    && /accents\[index % accents\.length\]/.test(consoleRowAccent),
)
check(
  'both option lists paint the cursor with that row accent',
  [consoleShell, consolePanel].every((source) => source.includes("'--console-row-accent': rowAccent(index)"))
    && /\.console-shell__suggestion\.is-selected \{[^}]*var\(--console-row-accent/.test(consoleShell)
    && /\.console-shell__suggestion\.is-selected code \{[^}]*var\(--console-row-accent/.test(consoleShell)
    && /\.console-panel__row\.is-selected \{[^}]*var\(--console-row-accent/.test(consolePanel)
    && /\.console-panel__row\.is-selected code \{[^}]*var\(--console-row-accent/.test(consolePanel),
)
check(
  'every line in a console rule resolves through a border token',
  paintedConsoleLines().length === 0,
)
check(
  'one token sizes every square console thumbnail',
  /--console-thumb: \d+px/.test(consoleLayoutBlock)
    && /\.console-friends__avatar \{[^}]*var\(--console-thumb/.test(friendsView)
    && !/flex: 0 0 \d+px/.test(captureView),
)
// Capture opted out of that token deliberately: a contact sheet has to divide the
// row it is given, and a fixed stamp width can only be three-to-a-row at one
// container width. Friend avatars are a list of faces and do want a fixed size.
check(
  'capture sizes its tiles by dividing the row, not by the thumbnail token',
  !/--console-thumb/.test(captureView)
    && /\.console-capture-group__media \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(captureView),
)
check(
  'console capture is three to a row in both the list and the detail, as classic is',
  /\.console-capture-group__media \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(captureView)
    && /\.console-capture-detail__assets \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(captureView)
    && /\.capture-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(captureView)
    && /\.capture-detail__grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(captureView),
)
check(
  // Matching the column count alone would still leave the two modes at different
  // sizes. The gap and the fit are the rest of the arithmetic: a seamless sheet of
  // square crops in the list, a spaced gallery under a 76vh cap in the detail.
  'the two modes agree on the gap and the fit at both scales',
  /\.console-capture-group__media \{[^}]*gap: 0/.test(captureView)
    && /\.capture-grid \{[^}]*gap: 0/.test(captureView)
    && /\.console-capture-detail__assets \{[^}]*gap: 12px/.test(captureView)
    && /\.capture-detail__grid \{[^}]*gap: 12px/.test(captureView)
    && /\.console-capture-group__media \.console-capture-asset \{[^}]*aspect-ratio: 1/.test(captureView)
    && /\.console-capture-detail__assets img \{[^}]*max-height: 76vh[^}]*object-fit: contain/.test(captureView),
)
check(
  'one recipe styles every console button, out of the fill tokens',
  /--console-control: [^;]*var\(--site-accent\)/.test(consoleLayoutBlock)
    && /--console-control-strong: [^;]*var\(--site-accent\)/.test(consoleLayoutBlock)
    && /\.desktop-layout--console \.console-button \{[^}]*background: var\(--console-control\)/.test(consoleStyles)
    && /\.console-button:focus-visible \{[^}]*background: var\(--console-control-strong\)/.test(consoleStyles)
    && /\.console-button--icon \{/.test(consoleStyles),
)
check(
  'the views delegate their buttons to that recipe instead of restating it',
  [captureView, notFoundView, consoleOverview, consoleShell].every((source) => source.includes('console-button'))
    && !/\.console-capture-group__upload \{/.test(captureView)
    && !/\.console-overview__classic \{/.test(consoleOverview)
    && !/\.console-not-found__link \{/.test(notFoundView)
    && !/\.console-shell__submit \{[^}]*background/.test(consoleShell),
)
check(
  'a capture row is titled by its heading, never by its route id',
  !captureView.includes('<code>/capture/')
    && captureView.includes('class="console-capture-group__title"')
    && /asCaptureGroup\(item\)\.heading/.test(captureView),
)
check(
  // Two ways into the same upload was one too many: the editor bar already owns
  // it, and a per-row button spent a row of the contact sheet saying so again.
  'console capture uploads run through the editor bar alone',
  !captureView.includes('+ append')
    && /class="console-capture-editor"[\s\S]{0,400}\+ upload/.test(captureView)
    && captureView.includes('selectUploadGroup'),
)
check(
  // The preview limit is nine, which is three rows of three. Spending a tenth cell
  // on the overflow count would open a fourth row holding one item, so the count
  // rides the last tile instead — the same answer classic's badge gives.
  'a truncated capture group reports itself on its last tile',
  /capturePreviewLimit - 1 && hiddenAssetCount\(asCaptureGroup\(item\)\)/.test(captureView)
    && /\.console-capture-group__overflow \{[^}]*position: absolute/.test(captureView),
)
check(
  'console mode restyles the about contact block rather than replacing it',
  !aboutView.includes('console-about-contact')
    && aboutView.includes('about-contact__icon--github')
    && aboutView.includes('<Message />')
    && aboutView.includes('id="contact-me"')
    && /\.about-layout--console \.about-contact \{/.test(aboutView),
)
check(
  'the dashboard lists the profile and template repositories above CONTENT',
  consoleOverview.includes('>LINKS<')
    && consoleOverview.indexOf('>LINKS<') < consoleOverview.indexOf('>CONTENT<')
    && consoleOverview.includes('githubProfileUrl')
    // The template row names the repository the code came from, which is not this
    // site's own: it used to be derived from githubUser/githubRepo, so every fork
    // linked to itself under the label `template`.
    && consoleOverview.includes('templateRepoUrl')
    && !consoleOverview.includes('repositoryUrl')
    && /\.console-overview__links dd \{[^}]*text-overflow: ellipsis/.test(consoleOverview),
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
