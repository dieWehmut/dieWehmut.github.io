<template>
  <article class="archive-post" :id="post.id" @click="goToPost">
    <time class="archive-post__date" :datetime="post.date">{{ shortDate }}</time>
    <div class="archive-post__body">
      <h2>{{ post.title }}</h2>
      <MarkdownPreview class="archive-post__summary" :source="post.summary" />
      <div class="archive-post__tags" v-if="post.tags?.length || post.wordCount || post.readingMinutes">
        <ContentStats :word-count="post.wordCount" :reading-minutes="post.readingMinutes" />
        <span v-for="tag in post.tags" :key="tag" class="archive-post__tag" @click.stop><RouterLink :to="`/tags/${encodeURIComponent(tag)}`"><el-icon class="archive-post__tag-icon"><PriceTag /></el-icon>{{ tag }}</RouterLink></span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { PriceTag } from '@element-plus/icons-vue'
import type { ArchivePost } from '../../types/content'
import { formatTimelineShortDate } from '../../utils/date'
import ContentStats from './ContentStats.vue'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps<{ post: ArchivePost }>()
const router = useRouter()

function goToPost() {
  router.push(`/post/${props.post.id}`)
}

const shortDate = computed(() => {
  return formatTimelineShortDate(props.post.date)
})
</script>

<style scoped>
.archive-post {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 22px;
  padding: 22px;
  margin: 0 -22px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: default;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.archive-post:hover {
  border-color: rgb(var(--site-accent-rgb) / 0.45);
  background: rgb(var(--site-accent-rgb) / 0.04);
  transform: translateY(-2px);
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
  color: var(--site-text);
  transition: color 160ms ease;
}

.archive-post:hover h2 {
  color: var(--site-accent);
}

.archive-post__summary {
  display: block;
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  --markdown-preview-lines: 3;
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
  color: var(--site-tag-color);
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
