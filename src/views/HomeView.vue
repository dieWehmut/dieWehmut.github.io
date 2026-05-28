<template>
  <section class="home-view page-surface">
    <div class="home-view__main">
      <div class="home-view__grid">
      <RouterLink class="home-view__panel" to="/notes">
        <span>Notes</span>
        <strong>{{ notesCount }}</strong>
        <small>short records</small>
      </RouterLink>
      <RouterLink v-if="siteConfig.enableInfra" class="home-view__panel" to="/infra">
        <span>Infra</span>
        <strong>{{ infraCount }}</strong>
        <small>service endpoints</small>
      </RouterLink>
      <RouterLink v-if="siteConfig.enableProject" class="home-view__panel" to="/project">
        <span>Project</span>
        <strong>{{ projectCount }}</strong>
        <small>websites, apps, games, tools</small>
      </RouterLink>
      <RouterLink class="home-view__panel" to="/tags">
        <span>Tags</span>
        <strong>{{ tagsCount }}</strong>
        <small>archive labels</small>
      </RouterLink>
    </div>

    <div class="home-view__meta">
      <span>Last Commit</span>
      <strong>{{ lastUpdated }}</strong>
    </div>

    <section class="home-view__feed">
      <article v-for="item in feedItems" :key="item.id" class="home-view__item">
        <div class="home-view__item-body">
          <h2>
            <RouterLink v-if="item.url && !item.external" :to="item.url">{{ item.title }}</RouterLink>
            <a v-else-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
            <span v-else>{{ item.title }}</span>
          </h2>
          <p v-if="item.description">{{ item.description }}</p>
          <div v-if="item.date || item.tags?.length" class="home-view__meta-row">
            <time v-if="item.date" class="home-view__date" :datetime="item.date"><el-icon class="home-view__date-icon"><Calendar /></el-icon>{{ formatDate(item.date) }}</time>
            <RouterLink v-for="tag in item.tags" :key="tag" class="home-view__tag" :to="`/tags/${encodeURIComponent(tag)}`"><el-icon class="home-view__tag-icon"><PriceTag /></el-icon>{{ tag }}</RouterLink>
          </div>
        </div>
      </article>
    </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, PriceTag } from '@element-plus/icons-vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { useProfile } from '../composables/useProfile'
import { infra } from '../data/site/infra.ts'
import { siteConfig } from '../data/site/config'
import { getPosts, getProjectEntries, getNotes, getTagGroups } from '../data'

const infraCount = computed(() => (infra.value || []).length)
const projectCount = computed(() => getProjectEntries().length)
const notesCount = computed(() => getNotes().length)
const tagsCount = computed(() => getTagGroups().length)
const { lastUpdated } = useProfile()

function timestamp(date) {
  return Date.parse(date || '') || 0
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.valueOf())) return date
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const feedItems = computed(() => {
  const postItems = getPosts().map((post) => ({
    id: `post:${post.id}`,
    title: post.title,
    description: post.summary,
    date: post.date,
    tags: post.tags,
    url: `/post/${post.id}`,
    external: false,
  }))

  const noteItems = getNotes().map((note) => ({
    id: `note:${note.id}`,
    title: note.title,
    description: note.summary,
    date: note.date,
    tags: note.tags,
    url: `/note/${note.id}`,
    external: false,
  }))

  return [...postItems, ...noteItems]
    .sort((a, b) => timestamp(b.date) - timestamp(a.date))
    .slice(0, 20)
})
</script>

<style scoped>
.home-view {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.home-view__main {
  flex: 1;
  min-width: 0;
}

.home-view__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 8px 0 44px;
}

.home-view__panel {
  padding: 22px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.home-view__panel:hover,
.home-view__panel:focus-visible {
  border-color: rgba(31, 196, 31, 0.42);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
  text-decoration: none;
  outline: none;
}

.home-view__panel span,
.home-view__panel small {
  display: block;
  color: var(--site-muted);
  font-weight: 800;
}

.home-view__panel strong {
  display: block;
  margin: 10px 0 6px;
  color: var(--site-accent);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 42px;
}

.home-view__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin: 0 0 36px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-muted);
  font-weight: 800;
}

.home-view__meta strong {
  color: var(--site-text);
  font-size: 16px;
}

.home-view__feed {
  border-top: 1px solid var(--site-border);
}

.home-view__item {
  padding: 20px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: default;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.home-view__item:hover {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
}

.home-view__item + .home-view__item {
  margin-top: -1px;
}

.home-view__item-body h2 {
  margin: 0;
  color: var(--site-text);
  font-size: 20px;
  line-height: 1.25;
}

.home-view__item-body h2 a {
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

.home-view__item-body h2 a:hover,
.home-view__item-body h2 a:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}

.home-view__item-body p {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-view__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 15px;
}

.home-view__date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 800;
}

.home-view__date-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.home-view__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.home-view__tag:hover,
.home-view__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.home-view__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

@media (max-width: 760px) {
  .home-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-view__meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .home-view__item {
    gap: 10px;
  }
}

</style>
