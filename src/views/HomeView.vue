<template>
  <section class="home-view page-surface">
    <div class="home-view__grid">
      <RouterLink class="home-view__panel" to="/notes">
        <span>Notes</span>
        <strong>{{ notesCount }}</strong>
        <small>short records</small>
      </RouterLink>
      <RouterLink class="home-view__panel" to="/infra">
        <span>Infra</span>
        <strong>{{ infraCount }}</strong>
        <small>service endpoints</small>
      </RouterLink>
      <RouterLink class="home-view__panel" to="/project">
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

    <section class="home-view__section">
      <div class="home-view__section-title">
        <h2>Recent Archive</h2>
        <RouterLink to="/archive">View all</RouterLink>
      </div>
      <ArchivePostItem v-for="post in recentPosts" :key="post.id" :post="post" />
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ArchivePostItem from '../components/content/ArchivePostItem.vue'
import { infra } from '../data/content/infra'
import { getPosts, getProjectEntries, getNotes, getTagGroups } from '../data'

const recentPosts = computed(() => getPosts().slice(0, 3))
const infraCount = computed(() => (infra.value || []).length)
const projectCount = computed(() => {
  const names = getProjectEntries()
    .map((project) => project.name.trim().toLowerCase())
    .filter(Boolean)

  return new Set(names).size
})
const notesCount = computed(() => getNotes().length)
const tagsCount = computed(() => getTagGroups().length)
</script>

<style scoped>
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

.home-view__section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 8px;
}

.home-view__section-title h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
}

.home-view__section-title a {
  color: var(--site-accent);
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 760px) {
  .home-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .home-view__grid {
    grid-template-columns: 1fr;
  }
}
</style>
