<template>
  <section class="page-surface">
    <PageHeading :title="tag" :icon="PriceTag" />

    <div class="tag-detail__count">
      {{ totalCount }} {{ totalCount === 1 ? 'entry' : 'entries' }}
    </div>

    <div v-if="captures.length" class="tag-detail__capture-section">
      <h2 class="tag-detail__section-title">Capture</h2>

      <div v-if="standaloneCaptureGroups.length" class="tag-detail__capture-groups">
        <article
          v-for="group in standaloneCaptureGroups"
          :key="group.id"
          class="tag-detail__capture-group"
        >
          <div class="tag-detail__capture-grid">
            <button
              v-for="capture in group.assets"
              :key="capture.id"
              class="tag-detail__capture-media"
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
            </button>
          </div>

          <div class="tag-detail__capture-body">
            <div class="tag-detail__capture-meta-row">
              <time v-if="group.date" :datetime="group.date">
                <el-icon class="tag-detail__date-icon"><Calendar /></el-icon>
                {{ formattedDate(group.date) }}
              </time>
              <RouterLink
                v-for="captureTag in group.tags"
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
      </div>

      <div v-if="linkedCaptures.length" class="tag-detail__linked-capture-grid">
        <CaptureAssetCard
          v-for="capture in linkedCaptures"
          :key="capture.id"
          :asset="capture"
          @preview="openCapture(capture)"
        />
      </div>
    </div>

    <div v-if="posts.length" class="tag-detail__list">
      <article v-for="post in posts" :key="post.id" class="tag-detail__item">
        <div class="tag-detail__item-body">
          <h2>
            <RouterLink :to="postUrl(post)">{{ post.title }}</RouterLink>
          </h2>
          <MarkdownPreview
            v-if="post.summary"
            class="tag-detail__summary"
            :source="post.summary"
          />
          <div v-if="post.date || post.tags?.length" class="tag-detail__meta-row">
            <time v-if="post.date" class="tag-detail__date" :datetime="post.date"><el-icon class="tag-detail__date-icon"><Calendar /></el-icon>{{ formattedDate(post.date) }}</time>
            <RouterLink v-for="t in post.tags" :key="t" class="tag-detail__tag" :to="`/tags/${encodeURIComponent(t)}`"><el-icon class="tag-detail__tag-icon"><PriceTag /></el-icon>{{ t }}</RouterLink>
          </div>
        </div>
      </article>
    </div>

    <div v-if="!totalCount" class="tag-detail__empty">
      No entries found for this tag.
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { PriceTag, Calendar } from '@element-plus/icons-vue'
import CaptureAssetCard from '../components/capture/CaptureAssetCard.vue'
import MarkdownPreview from '../components/content/MarkdownPreview.vue'
import PageHeading from '../components/content/PageHeading.vue'
import { getPosts, getNotes } from '../data'
import type { CaptureAsset, TagContentEntry } from '../types/content'
import { formatTimelineDate, getDateSortTimestamp } from '../utils/date'
import { openImagePreviewGallery } from '../utils/imagePreview'
import { retryPublicAssetImage } from '../utils/publicAssets'

const route = useRoute()
const tag = computed(() => decodeURIComponent(String(route.params.tag || '')))
const captures = ref<CaptureAsset[]>([])
const totalCount = computed(() => posts.value.length + captures.value.length)
const standaloneCaptures = computed(() =>
  captures.value.filter((asset) => asset.standalone || !asset.sourceRefs.length)
)
const linkedCaptures = computed(() =>
  captures.value.filter((asset) => !asset.standalone && asset.sourceRefs.length)
)
const standaloneCaptureGroups = computed(() => groupStandaloneCaptures(standaloneCaptures.value))

type StandaloneCaptureGroup = {
  id: string
  date?: string
  timestamp: number
  tags: string[]
  assets: CaptureAsset[]
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

function groupStandaloneCaptures(assets: CaptureAsset[]): StandaloneCaptureGroup[] {
  const groups = new Map<string, StandaloneCaptureGroup>()

  for (const asset of assets) {
    const key = asset.date || 'undated'
    const group = groups.get(key) || {
      id: `capture-${slugFromDate(key)}`,
      date: asset.date,
      timestamp: getDateSortTimestamp(asset.date),
      tags: [],
      assets: [],
    }

    group.tags = mergeUnique(group.tags, asset.tags || [])
    group.assets.push(asset)
    groups.set(key, group)
  }

  return Array.from(groups.values()).sort((a, b) => b.timestamp - a.timestamp)
}

function mergeUnique(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming]))
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
.tag-detail__count {
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 24px;
}

.tag-detail__list {
  border-top: 1px solid var(--site-border);
}

.tag-detail__capture-section {
  margin-bottom: 34px;
}

.tag-detail__section-title {
  margin: 0 0 14px;
  color: var(--site-text);
  font-size: 18px;
  font-weight: 900;
}

.tag-detail__capture-groups {
  display: grid;
  gap: 20px;
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
  padding: 12px 14px 14px;
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

.tag-detail__linked-capture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.tag-detail__capture-groups + .tag-detail__linked-capture-grid {
  margin-top: 24px;
}

.tag-detail__item {
  padding: 20px 0;
  border-bottom: 1px solid var(--site-border);
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
  --markdown-preview-lines: 2;
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
  .tag-detail__capture-grid {
    grid-template-columns: repeat(3, calc(100vw / 3));
  }

  .tag-detail__capture-media {
    width: calc(100vw / 3);
  }

  .tag-detail__capture-groups {
    margin-inline: -18px;
    gap: 20px;
  }

  .tag-detail__capture-group {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .tag-detail__linked-capture-grid {
    grid-template-columns: 1fr;
    margin-inline: -18px;
    gap: 18px;
  }
}
</style>
