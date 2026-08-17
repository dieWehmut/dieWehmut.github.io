<template>
  <section class="home-view page-surface">
    <div class="home-view__main">
      <HomeStatsGrid v-if="!isConsole" />

      <ConsoleMonthNavigator v-if="isConsole" :months="consoleMonths">
        <template #default="{ item }">
          <FeedEntryCard
            :key="item.id"
            :entry="item"
            :overflow-count="feedOverflowCount(item)"
          />
        </template>
      </ConsoleMonthNavigator>

      <section v-else class="home-view__feed content-timeline">
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

    <ScrollSpySidebar v-if="!isConsole" root-selector=".home-view__main" heading-selector=".content-time-heading" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FeedEntryCard from '../components/content/FeedEntryCard.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import ConsoleMonthNavigator from '../components/console/ConsoleMonthNavigator.vue'
import HomeStatsGrid from '../components/home/HomeStatsGrid.vue'
import { getPosts, getNotes } from '../data'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'
import { getDateSortTimestamp } from '../utils/date'
import { groupItemsByYearAndMonth } from '../utils/timelineGroups'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { locale } = useI18n()
const { isConsole } = useDisplayModePreference()
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

const consoleMonths = computed(() =>
  feedYearGroups.value.flatMap((year) =>
    year.months.map((month) => ({
      id: month.id,
      label: month.label,
      yearLabel: year.label,
      timestamp: month.timestamp,
      items: month.items,
    })),
  ),
)

function feedOverflowCount(item) {
  return overflowCountForItem(item, feedItems.value, feedHiddenCount.value)
}

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
