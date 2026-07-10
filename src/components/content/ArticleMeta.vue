<template>
  <div class="article-meta">
    <div class="article-meta__info-row">
      <time v-if="date" class="article-meta__date" :datetime="date">
        <el-icon class="article-meta__icon"><Calendar /></el-icon>
        {{ formattedDate }}
      </time>
      <span v-if="updated" class="article-meta__updated">
        <el-icon class="article-meta__icon"><Edit /></el-icon>
        Updated: {{ updated }}
      </span>
      <span v-if="wordCount" class="article-meta__stat">
        <el-icon class="article-meta__icon"><Document /></el-icon>
        {{ wordCount }} words
      </span>
      <span v-if="readingMinutes" class="article-meta__stat">
        <el-icon class="article-meta__icon"><Timer /></el-icon>
        {{ readingMinutes }} min
      </span>
      <a
        class="article-meta__license"
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        title="CC BY-SA 4.0"
      >
        <svg class="article-meta__cc-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="800">cc</text>
        </svg>
        BY-SA 4.0
      </a>
    </div>
    <div v-if="tags?.length" class="article-meta__tags">
      <RouterLink
        v-for="tag in tags"
        :key="tag"
        class="article-meta__tag"
        :to="`/tags/${encodeURIComponent(tag)}`"
      >
        <el-icon class="article-meta__icon--tag"><PriceTag /></el-icon>
        {{ tag }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, Edit, Document, Timer, PriceTag } from '@element-plus/icons-vue'
import { formatTimelineDate } from '../../utils/date'

const props = defineProps<{
  date?: string
  updated?: string
  wordCount?: number
  readingMinutes?: number
  tags?: string[]
}>()

const formattedDate = computed(() => {
  if (!props.date) return ''
  return formatTimelineDate(props.date)
})
</script>

<style scoped>
.article-meta {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.article-meta__info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
}

.article-meta__date,
.article-meta__updated,
.article-meta__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.article-meta__icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
}

.article-meta__license {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--site-muted);
  text-decoration: none;
  transition: color 160ms ease;
}

.article-meta__license:hover,
.article-meta__license:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.article-meta__cc-icon {
  flex-shrink: 0;
}

.article-meta__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.article-meta__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.article-meta__tag:hover,
.article-meta__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.article-meta__icon--tag {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

@media (min-width: 641px) {
  .article-meta {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
}
</style>
