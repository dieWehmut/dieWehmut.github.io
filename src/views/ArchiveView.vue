<template>
  <section class="archive-view page-surface">
    <div class="archive-view__main">
      <PageHeading title="Archive" :icon="Collection" />

      <section class="archive-view__feed">
        <FeedEntryCard v-for="post in posts" :key="post.id" :entry="postEntry(post)" />
      </section>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Collection } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getPosts } from '../data'
import type { ArchivePost } from '../types/content'

const posts = computed(() => getPosts())

function postEntry(post: ArchivePost) {
  return {
    title: post.title,
    description: post.summary,
    date: post.date,
    tags: post.tags,
    url: `/post/${post.id}`,
  }
}
</script>

<style scoped>
.archive-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.archive-view__main {
  flex: 1;
  min-width: 0;
}

.archive-view__feed {
  border-top: 1px solid var(--site-border);
  margin-top: 8px;
}
</style>
