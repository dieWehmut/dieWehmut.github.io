<template>
  <section class="help-view page-surface">
    <div class="help-view__layout" :class="{ 'help-view__layout--console': isConsole }">
      <ScrollSpySidebar
        v-if="isConsole"
        class="help-view__aside help-view__aside--console"
        root-selector=".help-view__content"
        heading-selector="h2"
      />

      <div class="help-view__content">
        <header class="help-view__intro">
          <h1>Nexus Console</h1>
          <p v-for="line in intro" :key="line">{{ line }}</p>
        </header>

        <section class="help-view__section">
          <h2 id="the-prompt">The prompt</h2>
          <ul class="help-view__notes">
            <li v-for="note in promptNotes" :key="note">{{ note }}</li>
          </ul>
        </section>

        <section class="help-view__section">
          <h2 id="keys">Keys</h2>
          <dl class="help-view__rows">
            <div v-for="binding in keyBindings" :key="binding.keys" class="help-view__row">
              <dt><code>{{ binding.keys }}</code></dt>
              <dd>{{ binding.description }}</dd>
            </div>
          </dl>
        </section>

        <section v-for="group in commandGroups" :key="group.id" class="help-view__section">
          <h2 :id="group.id">{{ group.title }}</h2>
          <dl class="help-view__rows">
            <div v-for="command in group.commands" :key="command.input" class="help-view__row">
              <dt><code>{{ command.input }}</code></dt>
              <dd>{{ command.description }}</dd>
            </div>
          </dl>
        </section>

        <section class="help-view__section">
          <h2 id="targets">Naming a target</h2>
          <dl class="help-view__rows">
            <div v-for="target in targets" :key="target.form" class="help-view__row">
              <dt><code>{{ target.form }}</code></dt>
              <dd>{{ target.description }}</dd>
            </div>
          </dl>
        </section>

        <section class="help-view__section">
          <h2 id="on-screen">What is on screen</h2>
          <dl class="help-view__rows">
            <div v-for="part in screenParts" :key="part.name" class="help-view__row">
              <dt><code>{{ part.name }}</code></dt>
              <dd>{{ part.description }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <ScrollSpySidebar
        v-if="!isConsole"
        class="help-view__aside"
        root-selector=".help-view__content"
        heading-selector="h2"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { consoleCommandGroups, listConsoleCommands } from '../console/commandRegistry'
import { siteConfig } from '../data/site/config'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { isConsole } = useDisplayModePreference()

const intro = [
  'Console is the same site with a command line where the sidebar used to be. Every page is still a page; the difference is that you reach it by typing rather than by clicking.',
  'It is a desktop layout: on a narrow screen the site serves its standard layout instead. The classic button in the banner and the display-mode toggle in the floating settings both switch back, and so does /mode/classic.',
]

/**
 * How the prompt behaves. These are the rules a reader cannot discover by
 * looking — the ones that come from `suggestions.ts` (depth gating, the
 * five-row window) and `useConsoleSession` (preview, collapse, silence).
 */
const promptNotes = [
  'Every command starts with a slash. Typing filters the list underneath; Enter runs the highlighted row, or the text as typed if no row is highlighted.',
  'A child command stays hidden until its parent is spelled out: /theme first, then /theme/dark. This keeps the list to the depth you are actually at.',
  'Only five rows are ever drawn. The window travels with the cursor instead of the rows scrolling, so the prompt keeps a constant height and the page never shifts under it.',
  'Theme and colour rows apply as the cursor lands on them, so the selection doubles as a preview. Enter keeps it; Escape puts back the value that was live before.',
  'Choosing a value collapses the list back to the bare prompt — the menu has nothing left to offer. Escape reopens it if you want a different value.',
  'A command the console cannot resolve stays silent. A typo does nothing rather than reporting an error, so nothing has to be dismissed.',
  'Commands that ran before sit in the recent row above the prompt; clicking one runs it again.',
]

/**
 * Mirrors the keydown chain in `ConsoleShell.handleShellKeydown` and
 * `useConsoleSession.handleInputKeydown`, in the order the keys are offered.
 */
const keyBindings = [
  { keys: 'Enter', description: 'Run the highlighted row, or the text as typed. With an empty prompt it opens the highlighted result on the page.' },
  { keys: '↑ ↓', description: 'Move through the rows. With nothing typed and no rows open they walk the results on the page, then the commands you ran before.' },
  { keys: '← →', description: 'Move through option rows. On a timeline page with nothing typed they step through months instead.' },
  { keys: 'Esc', description: 'Back one step: first the argument, then the command word, then the menu that was collapsed by a choice.' },
  { keys: 'Click', description: 'Every row is also a button. Nothing is keyboard-only.' },
]

/**
 * Placeholders live here rather than inline: a literal `<` in template text
 * would be read as the start of a tag.
 */
const targets = [
  { form: '/search <text>', description: 'Everything after the space is the query, so /search vue router searches for both words. Results follow each keystroke.' },
  { form: '/post/<id>', description: 'Open a post by id. /post on its own lists them to pick from.' },
  { form: '/note/<id>', description: 'Open a note by id. /note on its own lists them to pick from.' },
  { form: '/tags/<tag>', description: 'Everything filed under one tag.' },
  { form: '/capture/<id>', description: 'A single captured asset.' },
  { form: '/theme/<value>', description: 'Skip the menu and set a value directly. The same shape works for /color, /background, /language and /mode.' },
]

const screenParts = [
  { name: 'banner', description: 'The portrait, the content counters — each one a link to its index — and the runtime rows: uptime, the live theme and colour, copyright and ICP.' },
  { name: 'output', description: 'Whatever the last command produced. Arriving at a page aligns the start of its output with the top of the screen rather than scrolling the whole document.' },
  { name: 'section bar', description: 'How far through the page you are, plus one box per heading. Clicking a box jumps to that heading.' },
  { name: 'dock', description: 'The recent row, the prompt and the option rows, riding the bottom of the viewport so the rows are always within reach of the caret.' },
  { name: 'comments', description: 'Always at the end of an article, never behind a command. /comment only scrolls you there.' },
]

/**
 * The command tables come from the registry the prompt itself reads, so this
 * page cannot drift out of step with what the console will accept — including
 * the sections that are switched off in site config.
 */
const commandGroups = computed(() => {
  const commands = listConsoleCommands({
    infra: siteConfig.enableInfra,
    project: siteConfig.enableProject,
  })
  return consoleCommandGroups
    .map((group) => ({
      ...group,
      commands: commands.filter((command) => command.group === group.id),
    }))
    .filter((group) => group.commands.length)
})
</script>

<style scoped>
.help-view__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--site-scroll-spy-width);
  gap: var(--site-view-aside-gap);
  align-items: start;
}

.help-view__content {
  min-width: 0;
}

.help-view__aside {
  align-self: start;
}

.help-view__intro h1 {
  margin: 0 0 12px;
  color: var(--site-text);
  font-size: 1.6em;
  font-weight: 700;
}

.help-view__intro p {
  margin: 0 0 12px;
  max-width: 72ch;
  color: var(--site-muted);
  line-height: 1.8;
}

.help-view__section h2 {
  margin: 40px 0 16px;
  color: var(--site-text);
  font-size: 1.25em;
  font-weight: 700;
}

.help-view__notes {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  max-width: 78ch;
  color: var(--site-muted);
  line-height: 1.75;
}

.help-view__rows {
  display: grid;
  gap: 2px;
  margin: 0;
}

.help-view__row {
  display: grid;
  grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
  align-items: baseline;
  gap: 18px;
  min-height: 34px;
  padding: 6px 8px;
  border: 1px solid transparent;
  color: var(--site-muted);
}

.help-view__row:hover {
  border-color: var(--site-border);
  color: var(--site-text);
}

.help-view__row dt {
  min-width: 0;
}

.help-view__row code {
  color: var(--site-accent);
  font-family: var(--console-font, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
  overflow-wrap: anywhere;
}

.help-view__row dd {
  margin: 0;
  min-width: 0;
  line-height: 1.7;
}

.help-view__layout--console {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: var(--console-font, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
}

.help-view__aside--console {
  width: 100%;
  order: -1;
}

.help-view__layout--console .help-view__intro h1 {
  font-size: 1.05rem;
  font-weight: 700;
}

.help-view__layout--console .help-view__intro p,
.help-view__layout--console .help-view__notes,
.help-view__layout--console .help-view__row {
  font-size: 0.82rem;
}

.help-view__layout--console .help-view__section h2 {
  margin: 30px 0 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--console-border, var(--site-border));
  color: var(--console-text, var(--site-text));
  font-size: 0.88rem;
}

.help-view__layout--console .help-view__row {
  color: var(--console-muted, var(--site-muted));
}

.help-view__layout--console .help-view__row:hover {
  border-color: var(--console-border-strong, var(--site-accent));
  color: var(--console-text, var(--site-text));
  background: var(--console-selection, transparent);
}

.help-view__layout--console .help-view__row code {
  color: var(--console-accent, var(--site-accent));
}

@media (max-width: 900px) {
  .help-view__layout {
    grid-template-columns: 1fr;
  }

  .help-view__aside {
    display: none;
  }

  .help-view__layout--console {
    display: none;
  }
}
</style>
