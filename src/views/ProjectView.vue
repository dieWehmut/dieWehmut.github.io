<template>
  <section class="project-view page-surface">
    <div class="project-view__main">
      <PageHeading title="Project" :icon="FolderOpened" />

      <section v-for="group in projectGroups" :key="group.key" class="project-group">
        <div class="project-group__heading">
          <el-icon class="project-group__icon"><component :is="categoryIcons[group.key]" /></el-icon>
          <h2>{{ group.label }}</h2>
          <span>{{ group.items.length }}</span>
        </div>
        <div class="project-list">
          <ProjectListItem v-for="item in group.items" :key="item.id" :project="item" :category="group.key" />
        </div>
      </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FolderOpened, Connection, VideoPlay, Iphone, Setting } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import ProjectListItem from '../components/project/ProjectListItem.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getProjectEntries } from '../data'
import type { ProjectEntry } from '../types/content'

const order: Array<ProjectEntry['category']> = ['websites', 'games', 'apps', 'tools']
const labels: Record<ProjectEntry['category'], string> = {
  websites: 'Websites',
  games: 'Games',
  apps: 'Apps',
  tools: 'Tools',
}
const categoryIcons: Record<ProjectEntry['category'], unknown> = {
  websites: Connection,
  games: VideoPlay,
  apps: Iphone,
  tools: Setting,
}

const projectGroups = computed(() =>
  order
    .map((key) => ({
      key,
      label: labels[key],
      items: getProjectEntries().filter((item) => item.category === key),
    }))
    .filter((group) => group.items.length > 0)
)
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
  background: rgba(31, 196, 31, 0.1);
  font-weight: 800;
}

.project-list {
  border-top: 1px solid var(--site-border);
}
</style>
