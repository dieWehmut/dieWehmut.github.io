<template>
  <section class="project-view page-surface">
    <div class="project-view__main">
      <section v-if="isConsole" class="console-project" aria-label="Project index">
        <header class="console-project__summary">
          <strong>{{ consoleProjectCount }} entries</strong>
        </header>
        <section v-for="group in projectGroups" :key="group.key" class="console-project__group">
          <header>
            <strong>{{ group.label }}</strong>
            <span>{{ group.totalCount }}</span>
          </header>
          <div class="console-project__rows">
            <div
              v-for="item in group.allItems"
              :key="item.id"
              class="console-project__row"
            >
              <code>{{ group.key }}</code>
              <strong>{{ item.name }}</strong>
              <time v-if="item.date" :datetime="item.date">{{ item.date }}</time>
              <div class="console-project__links">
                <a
                  v-if="item.url"
                  class="console-project__link console-project__link--site"
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >site</a>
                <a
                  v-if="item.repoUrl"
                  class="console-project__link console-project__link--repo"
                  :href="item.repoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >repo</a>
                <span v-if="!item.url && !item.repoUrl">local entry</span>
              </div>
            </div>
          </div>
        </section>
      </section>

      <template v-else>
      <section v-for="group in projectGroups" :key="group.key" class="project-group">
        <div class="project-group__heading">
          <el-icon class="project-group__icon"><component :is="categoryIcons[group.key]" /></el-icon>
          <h2>{{ group.label }}</h2>
          <span>{{ group.totalCount }}</span>
        </div>
        <div class="project-list">
          <ProjectListItem
            v-for="item in group.items"
            :key="item.id"
            :project="item"
            :category="group.key"
            :overflow-count="projectOverflowCount(group, item)"
          />
        </div>
      </section>
      </template>
    </div>

    <ScrollSpySidebar v-if="!isConsole" root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Connection, VideoPlay, Iphone, Setting, Collection } from '@element-plus/icons-vue'
import ProjectListItem from '../components/project/ProjectListItem.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getProjectEntries } from '../data'
import type { ProjectEntry } from '../types/content'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { t } = useI18n()
const { isConsole } = useDisplayModePreference()

const order: Array<ProjectEntry['category']> = ['websites', 'games', 'apps', 'tools', 'templates']
const labelKeys: Record<ProjectEntry['category'], string> = {
  websites: 'project.categories.websites',
  games: 'project.categories.games',
  apps: 'project.categories.apps',
  tools: 'project.categories.tools',
  templates: 'project.categories.templates',
}
const categoryIcons: Record<ProjectEntry['category'], unknown> = {
  websites: Connection,
  games: VideoPlay,
  apps: Iphone,
  tools: Setting,
  templates: Collection,
}

const projectGroups = computed(() =>
  order
    .map((key) => {
      const allItems = getProjectEntries().filter((item) => item.category === key)
      return {
        key,
        label: t(labelKeys[key]),
        totalCount: allItems.length,
        hiddenCount: hiddenCardCount(allItems),
        allItems,
        items: limitCardGroup(allItems),
      }
    })
    .filter((group) => group.items.length > 0)
)

const consoleProjectCount = computed(() =>
  projectGroups.value.reduce((total, group) => total + group.totalCount, 0),
)

function projectOverflowCount(
  group: { items: ProjectEntry[]; hiddenCount: number },
  item: ProjectEntry
) {
  return overflowCountForItem(item, group.items, group.hiddenCount)
}
</script>

<style scoped>
.console-project {
  display: grid;
  gap: 18px;
  color: var(--console-text, var(--site-text));
  font-family: var(--console-font, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
}

.console-project__summary,
.console-project__group > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  min-height: 38px;
  padding: 7px 0;
  border-bottom: 1px solid var(--console-border, var(--site-border));
}

.console-project__group > header strong {
  color: var(--console-accent, var(--site-accent));
}

.console-project__summary strong,
.console-project__group > header span {
  color: var(--console-muted, var(--site-muted));
  font-size: 0.78rem;
  font-weight: 500;
}

.console-project__rows {
  display: grid;
  gap: 2px;
  margin-top: 4px;
}

.console-project__row {
  display: grid;
  grid-template-columns: 88px minmax(160px, 0.8fr) 110px minmax(220px, 1.2fr);
  align-items: baseline;
  gap: 14px;
  min-height: 35px;
  padding: 6px 8px;
  border: 1px solid transparent;
  color: var(--console-muted, var(--site-muted));
  text-decoration: none;
}

.console-project__row:hover,
.console-project__row:focus-within {
  border-color: var(--console-border-strong, var(--site-accent));
  color: var(--console-text, var(--site-text));
  background: var(--console-selection, transparent);
  outline: none;
}

.console-project__row code {
  color: var(--console-accent, var(--site-accent));
  font: inherit;
  font-size: 0.76rem;
}

.console-project__row strong,
.console-project__links {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-project__row strong {
  color: var(--console-text, var(--site-text));
  font-weight: 600;
}

.console-project__row time,
.console-project__links {
  color: var(--console-muted, var(--site-muted));
  font-size: 0.76rem;
}

.console-project__links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.console-project__link {
  padding: 1px 5px;
  border: 1px solid var(--console-border, var(--site-border));
  color: var(--console-muted, var(--site-muted));
  text-decoration: none;
}

.console-project__link:hover,
.console-project__link:focus-visible {
  border-color: var(--console-border-strong, var(--site-accent));
  color: var(--console-accent, var(--site-accent));
  outline: none;
}

@media (max-width: 1100px) {
  .console-project__row {
    grid-template-columns: 74px minmax(130px, 0.8fr) 92px minmax(150px, 1fr);
    gap: 9px;
  }
}

@media (max-width: 900px) {
  .console-project {
    display: none;
  }
}

.project-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.project-view__main {
  flex: 1;
  min-width: 0;
}

.project-group + .project-group {
  margin-top: 42px;
}

.project-group__heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.project-group__icon {
  width: 28px;
  height: 28px;
  font-size: 28px;
  color: var(--site-accent);
  flex-shrink: 0;
}

h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
}

.project-group__heading span {
  min-width: 34px;
  min-height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  color: var(--site-accent);
  background: rgb(var(--site-accent-rgb) / 0.1);
  font-weight: 800;
}

.project-list {
  border-top: 1px solid var(--site-border);
}
</style>
