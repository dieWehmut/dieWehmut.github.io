<template>
  <section class="home-view page-surface">
    <div class="home-view__main">
      <div class="home-view__grid">
        <RouterLink class="home-view__panel" to="/archive">
          <span>Posts</span>
          <strong>{{ postsCount }}</strong>
        </RouterLink>
        <RouterLink class="home-view__panel" to="/notes">
          <span>Notes</span>
          <strong>{{ notesCount }}</strong>
        </RouterLink>
        <RouterLink v-if="siteConfig.enableInfra" class="home-view__panel" to="/infra">
          <span>Infra</span>
          <strong>{{ infraCount }}</strong>
        </RouterLink>
        <RouterLink class="home-view__panel" to="/capture">
          <span>Capture</span>
          <strong>{{ captureCount ?? '...' }}</strong>
        </RouterLink>
        <RouterLink v-if="siteConfig.enableProject" class="home-view__panel" to="/project">
          <span>Project</span>
          <strong>{{ projectCount }}</strong>
        </RouterLink>
        <RouterLink class="home-view__panel" to="/tags">
          <span>Tags</span>
          <strong>{{ tagsCount }}</strong>
        </RouterLink>
      </div>

      <div class="home-view__meta">
        <span>Last Commit</span>
        <strong>{{ lastUpdated }}</strong>
      </div>

      <section class="home-view__feed">
        <FeedEntryCard v-for="item in feedItems" :key="item.id" :entry="item" />
      </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { useProfile } from '../composables/useProfile'
import { infra } from '../data/site/infra.ts'
import { siteConfig } from '../data/site/config'
import { getPosts, getProjectEntries, getNotes, getTagGroups } from '../data'
import { getDateSortTimestamp } from '../utils/date'

const infraCount = computed(() => (infra.value || []).length)
const projectCount = computed(() => {
  const names = new Set(getProjectEntries().map((item) => item.name.trim().toLowerCase()).filter(Boolean))
  return names.size
})
const postsCount = computed(() => getPosts().length)
const notesCount = computed(() => getNotes().length)
const tagsCount = computed(() => getTagGroups().length)
const captureCount = ref(null)
const { lastUpdated } = useProfile()

function timestamp(date) {
  return getDateSortTimestamp(date)
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

onMounted(async () => {
  const { getCaptureAssets } = await import('../data/capture')
  captureCount.value = getCaptureAssets().length
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 8px 0 36px;
}

.home-view__panel {
  padding: 16px 18px;
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

.home-view__panel span {
  display: block;
  color: var(--site-muted);
  font-weight: 800;
  font-size: 13px;
}

.home-view__panel strong {
  display: block;
  margin: 8px 0 0;
  color: var(--site-accent);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
  line-height: 1;
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

@media (max-width: 760px) {
  .home-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-view__meta {
    flex-direction: column;
    align-items: flex-start;
  }
}

</style>
