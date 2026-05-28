<template>
  <section class="archive-view page-surface">
    <div class="archive-view__main">
      <PageHeading title="Archive" description="All posts grouped by year." :icon="Collection" />

      <section v-for="group in archiveGroups" :key="group.year" class="archive-year">
        <div class="archive-year__heading">
          <h2>{{ group.year }}</h2>
          <span>{{ group.posts.length }} posts</span>
        </div>
        <ArchivePostItem v-for="post in group.posts" :key="post.id" :post="post" />
      </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Collection } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import ArchivePostItem from '../components/content/ArchivePostItem.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getArchiveGroups } from '../data'

const archiveGroups = computed(() => getArchiveGroups())
</script>

<style scoped>
.archive-view {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.archive-view__main {
  flex: 1;
  min-width: 0;
}

.archive-year + .archive-year {
  margin-top: 42px;
}

.archive-year__heading {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 10px;
}

h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 42px;
}

.archive-year__heading span {
  padding: 5px 12px;
  border-radius: 10px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.08);
  font-weight: 800;
}
</style>
