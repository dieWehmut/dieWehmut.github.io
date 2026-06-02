<template>
  <article
    class="project-item"
    :class="{ 'is-clickable': !!primaryUrl }"
    :role="primaryUrl ? 'link' : undefined"
    :tabindex="primaryUrl ? 0 : undefined"
    @click="openProject"
    @keydown.enter.prevent="openProject"
    @keydown.space.prevent="openProject"
  >
    <div class="project-item__main">
      <el-icon class="project-item__icon">
        <component :is="itemIcon" />
      </el-icon>
      <a
        class="project-item__name"
        :href="project.url"
        target="_blank"
        rel="noopener noreferrer"
      >{{ project.name }}</a>
      <time v-if="project.date" :datetime="project.date">{{ formattedDate }}</time>
    </div>
    <div class="project-item__actions">
      <a v-if="project.url" :href="project.url" target="_blank" rel="noopener noreferrer">Open</a>
      <a v-if="project.repoUrl && project.repoUrl !== project.url" :href="project.repoUrl" target="_blank" rel="noopener noreferrer">Repo</a>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Notebook, Headset, Menu, Document } from '@element-plus/icons-vue'
import type { ProjectEntry } from '../../types/content'

const props = defineProps<{ project: ProjectEntry; category: ProjectEntry['category'] }>()

const iconMap: Record<ProjectEntry['category'], unknown> = {
  websites: Notebook,
  games: Headset,
  apps: Menu,
  tools: Document,
}

const itemIcon = computed(() => iconMap[props.category])
const primaryUrl = computed(() => props.project.url || props.project.repoUrl || '')

const formattedDate = computed(() => {
  const date = new Date(props.project.date || '')
  if (Number.isNaN(date.valueOf())) return props.project.date || ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('a, button'))
}

function openProject(event?: MouseEvent | KeyboardEvent) {
  if (!primaryUrl.value || isInteractiveTarget(event?.target || null)) return
  window.open(primaryUrl.value, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.project-item.is-clickable {
  cursor: pointer;
}

.project-item:hover,
.project-item:focus-visible {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
  outline: none;
}

.project-item__main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.project-item__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  font-size: 18px;
  color: var(--site-muted);
}

.project-item__name {
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 25px;
  line-height: 1.2;
  text-decoration: none;
  transition: color 160ms ease;
}

.project-item__name:hover,
.project-item__name:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}

time {
  flex-shrink: 0;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 700;
}

.project-item__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.project-item__actions a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  font-weight: 800;
  text-decoration: none;
  transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.project-item__actions a:hover,
.project-item__actions a:focus-visible {
  color: var(--site-accent);
  border-color: rgba(31, 196, 31, 0.45);
  transform: translateY(-1px);
  text-decoration: none;
  outline: none;
}

@media (max-width: 640px) {
  .project-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .project-item__actions {
    justify-content: flex-start;
  }

  .project-item__name {
    font-size: 22px;
  }
}
</style>
