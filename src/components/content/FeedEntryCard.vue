<template>
  <article class="feed-entry-card">
    <div class="feed-entry-card__body">
      <h2>
        <RouterLink v-if="entry.url && !entry.external" :to="entry.url">{{ entry.title }}</RouterLink>
        <a v-else-if="entry.url" :href="entry.url" target="_blank" rel="noopener noreferrer">{{ entry.title }}</a>
        <span v-else>{{ entry.title }}</span>
      </h2>
      <p v-if="entry.description">{{ entry.description }}</p>
      <div v-if="entry.date || entry.tags?.length" class="feed-entry-card__meta-row">
        <time v-if="entry.date" class="feed-entry-card__date" :datetime="entry.date">
          <el-icon class="feed-entry-card__date-icon"><Calendar /></el-icon>
          {{ formatDate(entry.date) }}
        </time>
        <RouterLink
          v-for="tag in entry.tags"
          :key="tag"
          class="feed-entry-card__tag"
          :to="`/tags/${encodeURIComponent(tag)}`"
        >
          <el-icon class="feed-entry-card__tag-icon"><PriceTag /></el-icon>
          {{ tag }}
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Calendar, PriceTag } from '@element-plus/icons-vue'
import { formatTimelineDate } from '../../utils/date'

type FeedEntry = {
  title: string
  description?: string
  date?: string
  tags?: string[]
  url?: string
  external?: boolean
}

defineProps<{
  entry: FeedEntry
}>()

function formatDate(date: string) {
  return formatTimelineDate(date)
}
</script>

<style scoped>
.feed-entry-card {
  padding: 20px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: default;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.feed-entry-card:hover {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
}

.feed-entry-card + .feed-entry-card {
  margin-top: -1px;
}

.feed-entry-card__body h2 {
  margin: 0;
  color: var(--site-text);
  font-size: 20px;
  line-height: 1.25;
}

.feed-entry-card__body h2 a {
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

.feed-entry-card__body h2 a:hover,
.feed-entry-card__body h2 a:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}

.feed-entry-card__body p {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-entry-card__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 15px;
}

.feed-entry-card__date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 800;
}

.feed-entry-card__date-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.feed-entry-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.feed-entry-card__tag:hover,
.feed-entry-card__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.feed-entry-card__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}
</style>
