<template>
  <section class="archive-view page-surface">
    <div class="archive-view__main">
      <section class="archive-view__feed content-timeline">
        <section v-for="year in yearGroups" :key="year.id" class="content-timeline__year">
          <h2 :id="year.id" class="content-time-heading content-time-heading--year">
            {{ year.label }}
          </h2>

          <section v-for="month in year.months" :key="month.id" class="content-timeline__month">
            <h3 :id="month.id" class="content-time-heading content-time-heading--month">
              {{ month.label }}
            </h3>

            <div class="content-timeline__items">
              <FeedEntryCard
                v-for="post in month.items"
                :key="post.id"
                :entry="postEntry(post)"
                :overflow-count="postOverflowCount(post)"
              />
            </div>
          </section>
        </section>
      </section>
    </div>

    <ScrollSpySidebar root-selector=".archive-view__main" heading-selector=".content-time-heading" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getPosts } from '../data'
import type { ArchivePost } from '../types/content'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'
import { groupItemsByYearAndMonth } from '../utils/timelineGroups'

const { locale } = useI18n()
const allPosts = computed(() => getPosts())
const posts = computed(() => limitCardGroup(allPosts.value))
const postsHiddenCount = computed(() => hiddenCardCount(allPosts.value))
const yearGroups = computed(() =>
  groupItemsByYearAndMonth(posts.value, {
    idPrefix: 'archive',
    locale: locale.value,
    getDate: (post) => post.date,
  })
)

function postOverflowCount(post: ArchivePost) {
  return overflowCountForItem(post, posts.value, postsHiddenCount.value)
}

function postEntry(post: ArchivePost) {
  return {
    title: post.title,
    description: post.summary,
    date: post.date,
    tags: post.tags,
    updated: post.updated,
    wordCount: post.wordCount,
    readingMinutes: post.readingMinutes,
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
  margin-top: 8px;
}

.content-timeline,
.content-timeline__year,
.content-timeline__month,
.content-timeline__items {
  display: grid;
  gap: 24px;
}

.content-time-heading {
  margin: 0;
  scroll-margin-top: 28px;
}

.content-time-heading--year {
  color: var(--site-text);
  font-size: 28px;
  line-height: 1.1;
  font-weight: 900;
}

.content-time-heading--month {
  color: var(--site-muted);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
}
</style>
