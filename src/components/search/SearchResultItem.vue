<template>
  <ProjectListItem
    v-if="projectEntry"
    class="search-result__project"
    :project="projectEntry"
    :category="projectEntry.category"
    hide-icon
  />

  <FriendCard v-else-if="friendEntry" class="search-result__friend" :friend="friendEntry" />

  <article
    v-else-if="infraEntry"
    class="search-result-infra"
    :class="[statusClass(infraEntry.url), { 'is-clickable': infraEntry.url }]"
    :role="infraEntry.url ? 'link' : undefined"
    :tabindex="infraEntry.url ? 0 : undefined"
    @click="openExternal(infraEntry.url, $event)"
    @keydown.enter.prevent="openExternal(infraEntry.url, $event)"
    @keydown.space.prevent="openExternal(infraEntry.url, $event)"
  >
    <div class="search-result-infra__main">
      <div class="search-result-infra__info">
        <div class="search-result-infra__topline">
          <h2>{{ infraEntry.name }}</h2>
          <time v-if="infraEntry.date" class="search-result-infra__date" :datetime="infraEntry.date">
            <el-icon class="search-result-infra__date-icon"><Calendar /></el-icon>
            {{ formatDate(infraEntry.date) }}
          </time>
          <span v-if="statusLabel(infraEntry.url)" class="search-result-infra__status" :class="statusClass(infraEntry.url)">
            {{ statusLabel(infraEntry.url) }}
          </span>
        </div>
        <p v-if="!statusLabel(infraEntry.url)">Infrastructure endpoint</p>
      </div>
    </div>
    <a v-if="infraEntry.url" :href="infraEntry.url" target="_blank" rel="noopener noreferrer" @click.stop>Open</a>
  </article>

  <article
    v-else-if="capturePreview"
    class="search-result-capture"
    role="link"
    tabindex="0"
    @click="openInternal(capturePreview.url, $event)"
    @keydown.enter.prevent="openInternal(capturePreview.url, $event)"
    @keydown.space.prevent="openInternal(capturePreview.url, $event)"
  >
    <div class="search-result-capture__media" :class="`search-result-capture__media--${capturePreview.assets.length}`">
      <img
        v-for="asset in capturePreview.assets"
        :key="asset.id"
        :src="asset.image"
        :alt="asset.title || capturePreview.title"
        loading="lazy"
        decoding="async"
        @error="retryPublicAssetImage($event, asset.image)"
      />
    </div>
    <div class="search-result-capture__body">
      <h2>{{ capturePreview.title }}</h2>
      <MarkdownPreview
        v-if="capturePreview.description"
        class="search-result-capture__description"
        :source="capturePreview.description"
      />
      <div v-if="result.date || result.tags?.length" class="search-result-capture__meta-row">
        <time v-if="result.date" :datetime="result.date">
          <el-icon class="search-result-capture__meta-icon"><Calendar /></el-icon>
          {{ formatDate(result.date) }}
        </time>
        <RouterLink
          v-for="tag in result.tags"
          :key="tag"
          class="search-result-capture__tag"
          :to="`/tags/${encodeURIComponent(tag)}`"
          @click.stop
        >
          <el-icon class="search-result-capture__tag-icon"><PriceTag /></el-icon>
          {{ tag }}
        </RouterLink>
      </div>
    </div>
  </article>

  <FeedEntryCard v-else class="search-result__feed" :entry="feedEntry" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Calendar, PriceTag } from '@element-plus/icons-vue'
import type { FriendLink, InfraEntry, ProjectEntry, SearchDocument } from '../../types/content'
import { getProjectEntries, friends } from '../../data'
import { infra } from '../../data/site/infra'
import { getCaptureAssetById } from '../../data/capture'
import { formatTimelineDate } from '../../utils/date'
import { retryPublicAssetImage } from '../../utils/publicAssets'
import { useUrlStatus } from '../../composables/useUrlStatus'
import FeedEntryCard from '../content/FeedEntryCard.vue'
import FriendCard from '../content/FriendCard.vue'
import MarkdownPreview from '../content/MarkdownPreview.vue'
import ProjectListItem from '../project/ProjectListItem.vue'

const props = defineProps<{ result: SearchDocument }>()
const router = useRouter()
const { statusMap, checkUrl } = useUrlStatus()

const feedEntry = computed(() => ({
  title: props.result.title,
  description: props.result.description,
  date: props.result.date,
  tags: props.result.tags,
  updated: props.result.updated,
  wordCount: props.result.wordCount,
  readingMinutes: props.result.readingMinutes,
  url: props.result.url,
  external: isExternalUrl(props.result.url),
}))

const projectEntry = computed<ProjectEntry | null>(() => {
  if (props.result.type !== 'project') return null
  const projectId = props.result.id.replace(/^project:/, '')
  return getProjectEntries().find((item) => item.id === projectId) || null
})

const friendEntry = computed<FriendLink | null>(() => {
  if (props.result.type !== 'friend') return null
  const friendId = props.result.id.replace(/^friend:/, '')
  return friends.find((item) => item.id === friendId) || null
})

const infraEntry = computed<InfraEntry | null>(() => {
  if (props.result.type !== 'infra') return null
  const infraId = props.result.id.replace(/^infra:/, '')
  return (infra.value || []).find((item) => (item.key || item.name) === infraId) || null
})

watch(
  infraEntry,
  (entry) => {
    if (entry?.url) checkUrl(entry.url)
  },
  { immediate: true }
)

const capturePreview = computed(() => {
  if (props.result.type !== 'capture') return null
  const assetIds = props.result.captureAssetIds?.length
    ? props.result.captureAssetIds
    : [props.result.id.replace(/^capture:/, '')]
  const assets = assetIds
    .map((id) => getCaptureAssetById(id))
    .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset))
  if (!assets.length) return null
  const previewAssets = assets.slice(0, 4)

  return {
    title: props.result.title,
    description: props.result.description,
    assets: previewAssets,
    count: props.result.captureCount || assets.length,
    url: props.result.url,
  }
})

function formatDate(date: string) {
  if (props.result.type === 'capture') return formatCaptureDate(date)
  return formatTimelineDate(date)
}

function formatCaptureDate(date: string) {
  return formatTimelineDate(date).replace(/[ T]\d{2}:\d{2}(?::\d{2})?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?/g, '')
}

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url)
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('a, button'))
}

function openExternal(url: string | undefined, event?: MouseEvent | KeyboardEvent) {
  if (!url || isInteractiveTarget(event?.target || null)) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function openInternal(url: string, event?: MouseEvent | KeyboardEvent) {
  if (!url || isInteractiveTarget(event?.target || null)) return
  router.push(url)
}

function normalizedStatus(url: string | undefined) {
  if (!url) return ''
  const status = statusMap[url]
  if (!status || status.status === 'checking') return ''
  return status.status === 'online' ? 'online' : 'offline'
}

function statusLabel(url: string | undefined) {
  const status = normalizedStatus(url)
  if (!status) return ''
  return status === 'online' ? 'Online' : 'Offline'
}

function statusClass(url: string | undefined) {
  const status = normalizedStatus(url)
  return status ? `is-${status}` : ''
}
</script>

<style scoped>
.search-result__project,
.search-result__feed {
  border-top: 1px solid var(--site-border);
}

.search-result__friend {
  margin-top: 12px;
}

.search-result-infra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-top-color: var(--site-border);
  border-radius: 8px;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.search-result-infra.is-clickable {
  cursor: pointer;
}

.search-result-infra.is-clickable:hover,
.search-result-infra.is-clickable:focus-visible {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
  outline: none;
}

.search-result-infra__main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.search-result-infra__info {
  min-width: 0;
  flex: 1;
}

.search-result-infra__topline {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.search-result-infra h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  line-height: 1.2;
  transition: color 160ms ease;
}

.search-result-infra.is-clickable:hover h2,
.search-result-infra.is-clickable:focus-visible h2 {
  color: var(--site-accent);
}

.search-result-infra.is-clickable.is-offline:hover h2,
.search-result-infra.is-clickable.is-offline:focus-visible h2 {
  color: #ff7878;
}

.search-result-infra__date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 800;
}

.search-result-infra__date-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.search-result-infra__status {
  display: inline-flex;
  align-items: center;
  color: var(--site-accent);
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.search-result-infra__status.is-offline {
  color: #ff7878;
}

.search-result-infra p {
  margin: 4px 0 0;
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 900;
}

.search-result-infra > a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  font-weight: 800;
  text-decoration: none;
  transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.search-result-infra > a:hover,
.search-result-infra > a:focus-visible {
  color: var(--site-accent);
  border-color: rgba(31, 196, 31, 0.45);
  transform: translateY(-1px);
  text-decoration: none;
  outline: none;
}

.search-result-capture {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  gap: 16px;
  padding: 16px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-top-color: var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  text-decoration: none;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.search-result-capture:hover,
.search-result-capture:focus-visible {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
  text-decoration: none;
  outline: none;
}

.search-result-capture__media {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}

.search-result-capture__media--1 {
  display: block;
}

.search-result-capture__media--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.search-result-capture__media--3 img:first-child {
  grid-row: span 2;
}

.search-result-capture__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.search-result-capture__media img.is-image-failed {
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  object-fit: contain;
}

.search-result-capture:hover .search-result-capture__media img,
.search-result-capture:focus-visible .search-result-capture__media img {
  transform: scale(1.03);
}

.search-result-capture__body {
  min-width: 0;
  align-self: center;
}

.search-result-capture h2 {
  margin: 0;
  color: var(--site-text);
  font-size: 20px;
  line-height: 1.25;
  transition: color 160ms ease;
}

.search-result-capture:hover h2,
.search-result-capture:focus-visible h2 {
  color: var(--site-accent);
}

.search-result-capture__description {
  display: block;
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  --markdown-preview-lines: 2;
}

.search-result-capture__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 15px;
}

.search-result-capture__meta-row time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 800;
}

.search-result-capture__meta-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.search-result-capture__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.search-result-capture__tag:hover,
.search-result-capture__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.search-result-capture__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

@media (max-width: 640px) {
  .search-result__feed {
    padding: 20px 18px;
    margin: 0 -18px;
  }

  .search-result__project {
    padding: 14px 18px;
    margin: 0 -18px;
  }

  .search-result-infra {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 18px;
    margin: 0 -18px;
  }

  .search-result-capture {
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 12px;
    padding: 14px 18px;
    margin: 0 -18px;
  }

  .search-result-capture h2 {
    font-size: 18px;
  }
}
</style>
