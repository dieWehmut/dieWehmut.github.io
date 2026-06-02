<template>
  <section class="page-surface">
    <PageHeading :title="tag" :icon="PriceTag" />

    <div class="tag-detail__count">
      {{ totalCount }} {{ totalCount === 1 ? 'entry' : 'entries' }}
    </div>

    <div v-if="captures.length" class="tag-detail__capture-section">
      <h2 class="tag-detail__section-title">Capture</h2>
      <div class="tag-detail__capture-grid">
        <CaptureAssetCard
          v-for="capture in captures"
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
          <p v-if="post.summary">{{ post.summary }}</p>
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
import PageHeading from '../components/content/PageHeading.vue'
import { getPosts, getNotes } from '../data'
import type { CaptureAsset, TagContentEntry } from '../types/content'
import { formatTimelineDate, getDateSortTimestamp } from '../utils/date'
import { openImagePreviewGallery } from '../utils/imagePreview'

const route = useRoute()
const tag = computed(() => decodeURIComponent(String(route.params.tag || '')))
const captures = ref<CaptureAsset[]>([])
const totalCount = computed(() => posts.value.length + captures.value.length)

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

.tag-detail__capture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
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

.tag-detail__item-body p {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
    grid-template-columns: 1fr;
    margin-inline: -18px;
    gap: 18px;
  }
}
</style>
