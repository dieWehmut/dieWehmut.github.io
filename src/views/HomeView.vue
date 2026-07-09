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

      <section class="home-view__feed content-timeline">
        <section v-for="year in feedYearGroups" :key="year.id" class="content-timeline__year">
          <h2 :id="year.id" class="content-time-heading content-time-heading--year">
            {{ year.label }}
          </h2>

          <section v-for="month in year.months" :key="month.id" class="content-timeline__month">
            <h3 :id="month.id" class="content-time-heading content-time-heading--month">
              {{ month.label }}
            </h3>

            <div class="content-timeline__items">
              <FeedEntryCard
                v-for="item in month.items"
                :key="item.id"
                :entry="item"
                :overflow-count="feedOverflowCount(item)"
              />
            </div>
          </section>
        </section>
      </section>
    </div>

    <ScrollSpySidebar root-selector=".home-view__main" heading-selector=".content-time-heading" />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { infra } from '../data/site/infra.ts'
import { siteConfig } from '../data/site/config'
import { getPosts, getProjectEntries, getNotes, getTagGroups } from '../data'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'
import { getDateSortTimestamp } from '../utils/date'
import { groupItemsByYearAndMonth } from '../utils/timelineGroups'

const { locale } = useI18n()
const infraCount = computed(() => (infra.value || []).length)
const projectCount = computed(() => {
  const names = new Set(getProjectEntries().map((item) => item.name.trim().toLowerCase()).filter(Boolean))
  return names.size
})
const postsCount = computed(() => getPosts().length)
const notesCount = computed(() => getNotes().length)
const tagsCount = computed(() => getTagGroups().length)
const captureCount = ref(null)

function timestamp(date) {
  return getDateSortTimestamp(date)
}

const allFeedItems = computed(() => {
  return [
    ...getPosts().map((post) => ({ kind: 'post', entry: post })),
    ...getNotes().map((note) => ({ kind: 'note', entry: note })),
  ]
    .sort((a, b) => timestamp(b.entry.date) - timestamp(a.entry.date))
    .map(({ kind, entry }) => ({
      id: `${kind}:${entry.id}`,
      title: entry.title,
      description: entry.summary,
      date: entry.date,
      tags: entry.tags,
      updated: entry.updated,
      wordCount: entry.wordCount,
      readingMinutes: entry.readingMinutes,
      url: `/${kind}/${entry.id}`,
      external: false,
    }))
})

const feedItems = computed(() => limitCardGroup(allFeedItems.value))
const feedHiddenCount = computed(() => hiddenCardCount(allFeedItems.value))

const feedYearGroups = computed(() =>
  groupItemsByYearAndMonth(feedItems.value, {
    idPrefix: 'home',
    locale: locale.value,
    getDate: (item) => item.date,
  })
)

function feedOverflowCount(item) {
  return overflowCountForItem(item, feedItems.value, feedHiddenCount.value)
}

onMounted(async () => {
  const { getCaptureAssets } = await import('../data/capture')
  captureCount.value = getCaptureAssets().length
})
</script>

<style scoped>
.home-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
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

@media (max-width: 760px) {
  .home-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

</style>
