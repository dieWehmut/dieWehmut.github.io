<template>
  <article
    class="feed-entry-card card-overflow-host"
    :class="{ 'is-clickable': !!entry.url, 'has-overflow-badge': overflowCount > 0 }"
    :role="entry.url ? 'link' : undefined"
    :tabindex="entry.url ? 0 : undefined"
    @click="openEntry"
    @keydown.enter.prevent="openEntry"
    @keydown.space.prevent="openEntry"
  >
    <div class="feed-entry-card__body">
      <h2>
        <RouterLink v-if="entry.url && !entry.external" :to="entry.url">{{ entry.title }}</RouterLink>
        <a v-else-if="entry.url" :href="entry.url" target="_blank" rel="noopener noreferrer">{{ entry.title }}</a>
        <span v-else>{{ entry.title }}</span>
      </h2>
      <MarkdownPreview
        v-if="entry.description"
        class="feed-entry-card__description"
        :source="entry.description"
      />
      <div v-if="entry.date || entry.updated || entry.tags?.length || entry.wordCount || entry.readingMinutes" class="feed-entry-card__meta-row">
        <time v-if="entry.date" class="feed-entry-card__date" :datetime="entry.date">
          <el-icon class="feed-entry-card__date-icon"><Calendar /></el-icon>
          {{ formatDate(entry.date) }}
        </time>
        <time v-if="entry.updated" class="feed-entry-card__updated" :datetime="entry.updated">
          <el-icon class="feed-entry-card__updated-icon"><Edit /></el-icon>
          Updated: {{ formatDate(entry.updated) }}
        </time>
        <ContentStats :word-count="entry.wordCount" :reading-minutes="entry.readingMinutes" />
        <RouterLink
          v-for="tag in entry.tags"
          :key="tag"
          class="feed-entry-card__tag"
          :to="`/tags/${encodeURIComponent(tag)}`"
          @click.stop
        >
          <el-icon class="feed-entry-card__tag-icon"><PriceTag /></el-icon>
          {{ tag }}
        </RouterLink>
      </div>
    </div>
    <span v-if="overflowCount > 0" class="card-overflow-badge" aria-hidden="true">
      +{{ overflowCount }}
    </span>
  </article>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { Calendar, Edit, PriceTag } from '@element-plus/icons-vue'
import { formatTimelineDate } from '../../utils/date'
import ContentStats from './ContentStats.vue'
import MarkdownPreview from './MarkdownPreview.vue'

type FeedEntry = {
  title: string
  description?: string
  date?: string
  tags?: string[]
  wordCount?: number
  readingMinutes?: number
  url?: string
  external?: boolean
  updated?: string
}

const props = withDefaults(defineProps<{
  entry: FeedEntry
  overflowCount?: number
}>(), {
  overflowCount: 0,
})
const router = useRouter()

function formatDate(date: string) {
  return formatTimelineDate(date)
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('a, button'))
}

function openEntry(event?: MouseEvent | KeyboardEvent) {
  if (!props.entry.url || isInteractiveTarget(event?.target || null)) return
  if (props.entry.external) {
    window.open(props.entry.url, '_blank', 'noopener,noreferrer')
    return
  }
  router.push(props.entry.url)
}
</script>

<style scoped>
.feed-entry-card {
  padding: 20px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.feed-entry-card.is-clickable {
  cursor: pointer;
}

.feed-entry-card.has-overflow-badge {
  padding-right: 82px;
}

.feed-entry-card:hover,
.feed-entry-card:focus-visible {
  border-color: rgb(var(--site-accent-rgb) / 0.45);
  background: rgb(var(--site-accent-rgb) / 0.04);
  transform: translateY(-2px);
  outline: none;
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

.feed-entry-card__description {
  display: block;
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  --markdown-preview-lines: 3;
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

.feed-entry-card__updated {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.feed-entry-card__updated-icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
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
