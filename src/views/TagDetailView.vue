<template>
  <section class="page-surface tag-detail-view">
    <div class="tag-detail__main">
      <ConsoleMonthNavigator v-if="isConsole" :months="consoleMonths">
        <template #default="{ item }">
          <article
            v-if="isPostTimelineItem(item)"
            :key="asPostTimelineItem(item).id"
            class="console-tag-detail__entry"
          >
            <div class="console-tag-detail__entry-main">
              <RouterLink :to="postUrl(asPostTimelineItem(item).post)">
                {{ asPostTimelineItem(item).post.title }}
              </RouterLink>
              <MarkdownPreview
                v-if="asPostTimelineItem(item).post.summary"
                class="console-tag-detail__summary"
                :source="asPostTimelineItem(item).post.summary"
              />
            </div>
            <div class="console-tag-detail__meta">
              <time v-if="asPostTimelineItem(item).post.date" :datetime="asPostTimelineItem(item).post.date">
                {{ formattedDate(asPostTimelineItem(item).post.date) }}
              </time>
              <code>{{ postUrl(asPostTimelineItem(item).post) }}</code>
            </div>
          </article>

          <article
            v-else
            :key="asCaptureTimelineItem(item).id"
            class="console-tag-detail__entry console-tag-detail__entry--capture"
          >
            <div class="console-tag-detail__capture-assets">
              <button
                v-for="capture in previewCaptureAssets(asCaptureTimelineItem(item).group)"
                :key="capture.id"
                type="button"
                :aria-label="`Open ${capture.title || capture.id}`"
                :title="capture.title || capture.id"
                @click="openCapture(capture)"
              >
                <img
                  :src="capture.image"
                  :alt="capture.title || capture.id"
                  loading="lazy"
                  decoding="async"
                  @error="retryPublicAssetImage($event, capture.image)"
                />
              </button>
              <RouterLink
                v-if="hiddenCaptureAssetCount(asCaptureTimelineItem(item).group) > 0"
                class="console-tag-detail__capture-overflow"
                :to="captureGroupUrl(asCaptureTimelineItem(item).group)"
                :aria-label="`Open ${hiddenCaptureAssetCount(asCaptureTimelineItem(item).group)} more captures`"
              >
                <strong>+{{ hiddenCaptureAssetCount(asCaptureTimelineItem(item).group) }}</strong>
                <span>more</span>
              </RouterLink>
            </div>
            <div class="console-tag-detail__entry-main">
              <span>{{ asCaptureTimelineItem(item).group.sources[0]?.title || 'Capture group' }}</span>
              <div class="console-tag-detail__meta">
                <time v-if="asCaptureTimelineItem(item).group.date" :datetime="asCaptureTimelineItem(item).group.date">
                  {{ formattedDate(asCaptureTimelineItem(item).group.date) }}
                </time>
                <RouterLink
                  class="console-tag-detail__capture-route"
                  :to="captureGroupUrl(asCaptureTimelineItem(item).group)"
                >
                  <!-- The row already states its title and date, so the link
                       carries the one fact it does not: how much is inside. The
                       opaque route id it used to print was not meant to be read. -->
                  {{ asCaptureTimelineItem(item).group.assets.length }} assets
                </RouterLink>
              </div>
            </div>
          </article>
        </template>
      </ConsoleMonthNavigator>

      <div v-else-if="timelineYearGroups.length" class="tag-detail__list content-timeline">
        <section v-for="year in timelineYearGroups" :key="year.id" class="content-timeline__year">
          <h2 :id="year.id" class="content-time-heading content-time-heading--year">
            {{ year.label }}
          </h2>

          <section v-for="month in year.months" :key="month.id" class="content-timeline__month">
            <h3 :id="month.id" class="content-time-heading content-time-heading--month">
              {{ month.label }}
            </h3>

            <div class="content-timeline__items">
              <template v-for="item in month.items" :key="item.id">
                <article v-if="item.kind === 'post'" class="tag-detail__item">
                  <div class="tag-detail__item-body">
                    <h2>
                      <RouterLink :to="postUrl(item.post)">{{ item.post.title }}</RouterLink>
                    </h2>
                    <MarkdownPreview
                      v-if="item.post.summary"
                      class="tag-detail__summary"
                      :source="item.post.summary"
                    />
                    <div v-if="item.post.date || item.post.tags?.length || item.post.wordCount || item.post.readingMinutes" class="tag-detail__meta-row">
                      <time v-if="item.post.date" class="tag-detail__date" :datetime="item.post.date"><el-icon class="tag-detail__date-icon"><Calendar /></el-icon>{{ formattedDate(item.post.date) }}</time>
                      <ContentStats :word-count="item.post.wordCount" :reading-minutes="item.post.readingMinutes" />
                      <RouterLink v-for="t in item.post.tags" :key="t" class="tag-detail__tag" :to="`/tags/${encodeURIComponent(t)}`"><el-icon class="tag-detail__tag-icon"><PriceTag /></el-icon>{{ t }}</RouterLink>
                    </div>
                  </div>
                </article>

                <article
                  v-else
                  class="tag-detail__capture-group"
                >
                  <div class="tag-detail__capture-grid">
                    <button
                      v-for="capture in item.group.assets"
                      :key="capture.id"
                      class="tag-detail__capture-media card-overflow-host"
                      type="button"
                      @click="openCapture(capture)"
                    >
                      <img
                        :src="capture.image"
                        :alt="capture.title || ''"
                        loading="lazy"
                        decoding="async"
                        @error="retryPublicAssetImage($event, capture.image)"
                      />
                      <span
                        v-if="captureOverflowCount(capture) > 0"
                        class="card-overflow-badge"
                        aria-hidden="true"
                      >
                        +{{ captureOverflowCount(capture) }}
                      </span>
                    </button>
                  </div>

                  <div class="tag-detail__capture-body">
                    <div v-if="item.group.sources.length" class="tag-detail__capture-sources">
                      <RouterLink
                        v-for="source in item.group.sources"
                        :key="`${source.type}:${source.id}`"
                        class="tag-detail__capture-source"
                        :to="source.url"
                      >
                        {{ source.title }}
                      </RouterLink>
                    </div>
                    <div class="tag-detail__capture-meta-row">
                      <time v-if="item.group.date" :datetime="item.group.date">
                        <el-icon class="tag-detail__date-icon"><Calendar /></el-icon>
                        {{ formattedDate(item.group.date) }}
                      </time>
                      <RouterLink
                        v-for="captureTag in item.group.tags"
                        :key="captureTag"
                        class="tag-detail__tag"
                        :to="`/tags/${encodeURIComponent(captureTag)}`"
                      >
                        <el-icon class="tag-detail__tag-icon"><PriceTag /></el-icon>
                        {{ captureTag }}
                      </RouterLink>
                    </div>
                  </div>
                </article>
              </template>
            </div>
          </section>
        </section>
      </div>

      <div v-if="!totalCount" class="tag-detail__empty">
        No entries found for this tag.
      </div>
    </div>

    <ScrollSpySidebar
      v-if="!isConsole && timelineYearGroups.length"
      :key="scrollSpyKey"
      root-selector=".tag-detail__main"
      heading-selector=".content-time-heading"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, RouterLink } from 'vue-router'
import { PriceTag, Calendar } from '@element-plus/icons-vue'
import ContentStats from '../components/content/ContentStats.vue'
import MarkdownPreview from '../components/content/MarkdownPreview.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import ConsoleMonthNavigator, { type ConsoleMonthGroup } from '../components/console/ConsoleMonthNavigator.vue'
import { getPosts, getNotes } from '../data'
import type { CaptureAsset, CaptureSourceRef, TagContentEntry } from '../types/content'
import { CARD_GROUP_LIMIT, hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'
import { formatTimelineDate, getDateSortTimestamp } from '../utils/date'
import { openImagePreviewGallery } from '../utils/imagePreview'
import { retryPublicAssetImage } from '../utils/publicAssets'
import { groupItemsByYearAndMonth } from '../utils/timelineGroups'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const route = useRoute()
const { locale } = useI18n()
const { isConsole } = useDisplayModePreference()
const capturePreviewLimit = CARD_GROUP_LIMIT
const tag = computed(() => String(route.params.tag || ''))
const captures = ref<CaptureAsset[]>([])
const totalCount = computed(() => posts.value.length + captures.value.length)
const visibleCaptures = computed(() => limitCardGroup(captures.value))
const captureHiddenCount = computed(() => hiddenCardCount(captures.value))
const captureGroups = computed(() => groupCapturesByDate(visibleCaptures.value))
const timelineItems = computed<TagTimelineItem[]>(() => {
  const postItems: TagTimelineItem[] = posts.value.map((post, index) => ({
    id: `${post._isNote ? 'note' : 'post'}:${post.id}`,
    kind: 'post',
    timestamp: getDateSortTimestamp(post.date),
    priority: 0,
    order: index,
    post,
  }))

  const captureItems: TagTimelineItem[] = captureGroups.value.map((group, index) => ({
    id: group.id,
    kind: 'capture',
    timestamp: group.timestamp,
    priority: 1,
    order: index,
    group,
  }))

  return [...postItems, ...captureItems]
    .sort((a, b) => b.timestamp - a.timestamp || a.priority - b.priority || a.order - b.order)
})
const timelineYearGroups = computed(() =>
  groupItemsByYearAndMonth(timelineItems.value, {
    idPrefix: 'tag-detail',
    locale: locale.value,
    getDate: (item) => item.kind === 'post' ? item.post.date : item.group.date,
  })
)
const consoleMonths = computed<ConsoleMonthGroup[]>(() =>
  timelineYearGroups.value.flatMap((year) =>
    year.months.map((month) => ({
      id: month.id,
      label: month.label,
      yearLabel: year.label,
      timestamp: month.timestamp,
      items: month.items,
    })),
  ),
)
const scrollSpyKey = computed(() =>
  timelineYearGroups.value
    .map((year) => `${year.id}:${year.months.map((month) => `${month.id}:${month.items.map((item) => item.id).join(',')}`).join(';')}`)
    .join('|')
)

type CaptureGroup = {
  id: string
  date?: string
  timestamp: number
  tags: string[]
  sources: CaptureSourceRef[]
  assets: CaptureAsset[]
}

type TagTimelineItem =
  | {
      id: string
      kind: 'post'
      timestamp: number
      priority: number
      order: number
      post: TagContentEntry
    }
  | {
      id: string
      kind: 'capture'
      timestamp: number
      priority: number
      order: number
      group: CaptureGroup
    }

const posts = computed<TagContentEntry[]>(() => {
  const matchTag = (tags: string[]) => tags.some((t) => t.toLowerCase() === tag.value.toLowerCase())
  const matchedPosts = getPosts().filter((post) => matchTag(post.tags))
  const matchedNotes = getNotes()
    .filter((note) => matchTag(note.tags))
    .map((note): TagContentEntry => ({
      id: note.id,
      title: note.title,
      date: note.date,
      tags: note.tags,
      summary: note.summary,
      wordCount: note.wordCount,
      readingMinutes: note.readingMinutes,
      _isNote: true,
    }))
  return [...matchedPosts, ...matchedNotes].sort((a, b) => getDateSortTimestamp(b.date) - getDateSortTimestamp(a.date))
})

async function loadCaptures() {
  const { getCaptureAssetsByTag } = await import('../data/capture')
  captures.value = getCaptureAssetsByTag(tag.value)
}

function postUrl(post: TagContentEntry): string {
  if (post._isNote) return `/note/${post.id}`
  return `/post/${post.id}`
}

function formattedDate(dateStr?: string): string {
  return formatTimelineDate(dateStr)
}

function captureOverflowCount(capture: CaptureAsset): number {
  return overflowCountForItem(capture, visibleCaptures.value, captureHiddenCount.value)
}

function groupCapturesByDate(assets: CaptureAsset[]): CaptureGroup[] {
  const groups = new Map<string, CaptureGroup>()

  for (const asset of assets) {
    const key = asset.date || 'undated'
    const group = groups.get(key) || {
      id: `capture-${slugFromDate(key)}`,
      date: asset.date,
      timestamp: getDateSortTimestamp(asset.date),
      tags: [],
      sources: [],
      assets: [],
    }

    group.tags = mergeUnique(group.tags, asset.tags || [])
    group.sources = mergeSources(group.sources, asset.sourceRefs || [])
    group.assets.push(asset)
    groups.set(key, group)
  }

  return Array.from(groups.values()).sort((a, b) => b.timestamp - a.timestamp)
}

function isPostTimelineItem(item: unknown): item is Extract<TagTimelineItem, { kind: 'post' }> {
  return Boolean(item && typeof item === 'object' && (item as { kind?: string }).kind === 'post')
}

function asPostTimelineItem(item: unknown): Extract<TagTimelineItem, { kind: 'post' }> {
  return item as Extract<TagTimelineItem, { kind: 'post' }>
}

function asCaptureTimelineItem(item: unknown): Extract<TagTimelineItem, { kind: 'capture' }> {
  return item as Extract<TagTimelineItem, { kind: 'capture' }>
}

function previewCaptureAssets(group: CaptureGroup): CaptureAsset[] {
  return group.assets.slice(0, capturePreviewLimit)
}

function hiddenCaptureAssetCount(group: CaptureGroup): number {
  return Math.max(0, group.assets.length - capturePreviewLimit)
}

function captureGroupUrl(group: CaptureGroup): string {
  return `/capture/${encodeURIComponent(group.id)}`
}

function mergeUnique(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming]))
}

function mergeSources(existing: CaptureSourceRef[], incoming: CaptureSourceRef[]): CaptureSourceRef[] {
  const merged = [...existing]

  for (const source of incoming) {
    if (!merged.some((item) => item.type === source.type && item.id === source.id)) {
      merged.push(source)
    }
  }

  return merged
}

function slugFromDate(date: string): string {
  return date
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'undated'
}

function openCapture(capture: CaptureAsset) {
  openImagePreviewGallery(
    captures.value.map((item) => ({ src: item.image, alt: item.title || tag.value })),
    captures.value.findIndex((item) => item.id === capture.id)
  )
}

onMounted(loadCaptures)
watch(tag, loadCaptures)
</script>

<style scoped>
.console-tag-detail__entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(170px, auto);
  align-items: start;
  gap: 18px;
  min-height: 58px;
  padding: 8px 9px;
  border: 1px solid var(--console-border, var(--site-border));
  color: var(--console-text, var(--site-text));
  background: var(--console-surface, transparent);
}

.console-tag-detail__entry-main {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.console-tag-detail__entry-main > a {
  color: var(--console-accent, var(--site-accent));
  font-weight: 700;
  text-decoration: none;
}

.console-tag-detail__entry-main > a:hover,
.console-tag-detail__entry-main > a:focus-visible {
  text-decoration: underline;
  outline: none;
}

.console-tag-detail__summary {
  color: var(--console-muted, var(--site-muted));
  --markdown-preview-lines: 2;
}

.console-tag-detail__meta {
  display: grid;
  justify-items: end;
  gap: 4px;
  min-width: 0;
  color: var(--console-muted, var(--site-muted));
  font-size: 0.76rem;
}

.console-tag-detail__meta code {
  max-width: 100%;
  overflow: hidden;
  color: var(--console-accent, var(--site-accent));
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-tag-detail__capture-route {
  max-width: 100%;
  overflow: hidden;
  color: var(--console-accent, var(--site-accent));
  text-decoration: none;
}

.console-tag-detail__capture-route:hover,
.console-tag-detail__capture-route:focus-visible {
  text-decoration: underline;
  outline: none;
}

.console-tag-detail__entry--capture {
  grid-template-columns: minmax(120px, 280px) minmax(0, 1fr);
}

.console-tag-detail__capture-assets {
  display: flex;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
}

.console-tag-detail__capture-assets button {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--console-border, var(--site-border));
  border-radius: 0;
  background: transparent;
  cursor: zoom-in;
}

.console-tag-detail__capture-overflow {
  display: grid;
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  place-content: center;
  gap: 1px;
  border: 1px solid var(--console-border, var(--site-border));
  color: var(--console-muted, var(--site-muted));
  text-align: center;
  text-decoration: none;
}

.console-tag-detail__capture-overflow strong {
  color: var(--console-accent, var(--site-accent));
  font-size: 0.8rem;
}

.console-tag-detail__capture-overflow span {
  font-size: 0.64rem;
}

.console-tag-detail__capture-overflow:hover,
.console-tag-detail__capture-overflow:focus-visible {
  color: var(--console-text, var(--site-text));
  background: var(--console-selection, transparent);
  outline: none;
}

/* A thumbnail has no text to recolour, so it answers the cursor by fading. */
.console-tag-detail__capture-assets button:hover,
.console-tag-detail__capture-assets button:focus-visible {
  opacity: 0.68;
  outline: none;
}

.console-tag-detail__capture-assets img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 900px) {
  .console-tag-detail__entry {
    display: none;
  }
}

.tag-detail-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.tag-detail__main {
  flex: 1;
  min-width: 0;
}

.tag-detail__list {
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

.tag-detail__capture-group {
  overflow: hidden;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.tag-detail__capture-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.tag-detail__capture-media {
  appearance: none;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  cursor: zoom-in;
}

.tag-detail__capture-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.tag-detail__capture-media img.is-image-failed {
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  object-fit: contain;
}

.tag-detail__capture-media:hover img,
.tag-detail__capture-media:focus-visible img {
  transform: scale(1.03);
}

.tag-detail__capture-media:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--site-accent);
  outline-offset: -2px;
}

.tag-detail__capture-body {
  display: grid;
  gap: 10px;
  padding: 12px 14px 14px;
}

.tag-detail__capture-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.tag-detail__capture-source {
  color: var(--site-text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.tag-detail__capture-source:hover,
.tag-detail__capture-source:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.tag-detail__capture-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  font-size: 14px;
}

.tag-detail__capture-meta-row time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.tag-detail__item {
  padding: 20px 0;
  border-top: 1px solid var(--site-border);
}

.tag-detail__item-body h2 {
  margin: 0;
  color: var(--site-text);
  font-size: 20px;
  line-height: 1.25;
}

.tag-detail__item-body h2 a {
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

.tag-detail__item-body h2 a:hover,
.tag-detail__item-body h2 a:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}

.tag-detail__summary {
  display: block;
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  --markdown-preview-lines: 3;
}

.tag-detail__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 15px;
}

.tag-detail__date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 800;
}

.tag-detail__date-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.tag-detail__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(190, 190, 190, 0.82);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.tag-detail__tag:hover,
.tag-detail__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.tag-detail__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

.tag-detail__empty {
  padding: 40px 0;
  color: var(--site-muted);
  text-align: center;
}

@media (max-width: 900px) {
  .tag-detail-view {
    display: block;
  }

  .tag-detail__capture-grid {
    grid-template-columns: repeat(3, calc(100vw / 3));
  }

  .tag-detail__capture-media {
    width: calc(100vw / 3);
  }

  .tag-detail__capture-group {
    margin-inline: -18px;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}
</style>
