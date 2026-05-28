<template>
  <article class="archive-post" :id="post.id">
    <time class="archive-post__date" :datetime="post.date">{{ shortDate }}</time>
    <div class="archive-post__body">
      <h2><RouterLink :to="`/post/${post.id}`">{{ post.title }}</RouterLink></h2>
      <p>{{ post.summary }}</p>
      <div class="archive-post__tags" v-if="post.tags?.length">
        <RouterLink v-for="tag in post.tags" :key="tag" :to="`/tags/${encodeURIComponent(tag)}`"><el-icon class="archive-post__tag-icon"><PriceTag /></el-icon>{{ tag }}</RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { PriceTag } from '@element-plus/icons-vue'
import type { ArchivePost } from '../../types/content'

const props = defineProps<{ post: ArchivePost }>()

const shortDate = computed(() => {
  const date = new Date(props.post.date)
  if (Number.isNaN(date.valueOf())) return props.post.date
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.archive-post {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 22px;
  padding: 22px 0;
}

.archive-post + .archive-post {
  border-top: 1px solid var(--site-border);
}

.archive-post__date {
  color: var(--site-muted);
  font-size: 18px;
  font-weight: 800;
}

h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

h2 a {
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

h2 a:hover,
h2 a:focus-visible {
  color: var(--site-accent);
  outline: none;
}

p {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
}

.archive-post__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  font-size: 15px;
}

.archive-post__tags a {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(190, 190, 190, 0.82);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.archive-post__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

.archive-post__tags a:hover,
.archive-post__tags a:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

@media (max-width: 640px) {
  .archive-post {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
