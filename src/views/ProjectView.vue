<template>
  <section class="project-view page-surface">
    <div class="project-view__main">
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
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Connection, VideoPlay, Iphone, Setting, Collection } from '@element-plus/icons-vue'
import ProjectListItem from '../components/project/ProjectListItem.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getProjectEntries } from '../data'
import type { ProjectEntry } from '../types/content'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'

const order: Array<ProjectEntry['category']> = ['websites', 'games', 'apps', 'tools', 'templates']
const labels: Record<ProjectEntry['category'], string> = {
  websites: 'Websites',
  games: 'Games',
  apps: 'Apps',
  tools: 'Tools',
  templates: '模板',
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
        label: labels[key],
        totalCount: allItems.length,
        hiddenCount: hiddenCardCount(allItems),
        items: limitCardGroup(allItems),
      }
    })
    .filter((group) => group.items.length > 0)
)

function projectOverflowCount(
  group: { items: ProjectEntry[]; hiddenCount: number },
  item: ProjectEntry
) {
  return overflowCountForItem(item, group.items, group.hiddenCount)
}
</script>

<style scoped>
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
