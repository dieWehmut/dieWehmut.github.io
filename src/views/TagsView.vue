<template>
  <section class="page-surface tag-view">
    <PageHeading title="Tags" :icon="PriceTag" />

    <div class="tag-cloud" aria-label="Tag cloud">
      <RouterLink
        v-for="tag in cloudTags"
        :key="tag.group.tag"
        class="tag-cloud__tag"
        :class="{ 'is-vertical': tag.vertical }"
        :to="`/tags/${encodeURIComponent(tag.group.tag)}`"
        :style="{
          '--x': `${tag.x}%`,
          '--y': `${tag.y}%`,
          '--size': `${tag.size}px`,
          '--mobile-size': `${tag.mobileSize}px`,
          '--color': tag.color,
          '--rotation': `${tag.rotation}deg`,
        }"
      >
        {{ tag.group.tag }}
      </RouterLink>
    </div>

    <div class="tag-grid">
      <article
        v-for="group in tagGroups"
        :key="group.tag"
        class="tag-card"
        role="link"
        tabindex="0"
        @click="openTag($event, group.tag)"
        @keydown.enter="openTag($event, group.tag)"
        @keydown.space="openTag($event, group.tag)"
      >
        <div class="tag-card__heading">
          <h2 :id="tagHeadingId(group.tag)">
            <RouterLink class="tag-card__link" :to="tagUrl(group.tag)" @click.stop>
              <el-icon><PriceTag /></el-icon>
              <span class="tag-card__link-text">{{ group.tag }}</span>
            </RouterLink>
          </h2>
          <span class="tag-card__count">x {{ group.count }}</span>
        </div>
        <div v-if="group.captures?.length" class="tag-card__captures">
          <RouterLink
            v-for="capture in group.captures.slice(0, 1)"
            :key="capture.id"
            class="tag-card__capture-link"
            :to="captureUrl(capture)"
            :aria-label="`Open ${capture.title || capture.id}`"
            @click.stop
          >
            <img
              :src="capture.image"
              :alt="capture.title || ''"
              loading="lazy"
              decoding="async"
              @error="retryPublicAssetImage($event, capture.image)"
            />
          </RouterLink>
        </div>
        <ul v-if="group.posts.length">
          <li v-for="post in group.posts.slice(0, visiblePostLimit(group))" :key="post.id">
            <RouterLink :to="postUrl(post)" @click.stop>{{ post.title }}</RouterLink>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { PriceTag } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { getTagGroups } from '../data'
import { retryPublicAssetImage } from '../utils/publicAssets'

const captureTagCounts = ref(new Map())
const captureTagPreviews = ref(new Map())
const router = useRouter()

const tagGroups = computed(() => mergeCaptureTags(getTagGroups()))
const cloudPalette = [
  '#2dd4bf',
  '#ff5f8a',
  '#ff8a34',
  '#38bdf8',
  '#a855f7',
  '#22c55e',
  '#f59e0b',
  '#fb7185',
  '#60a5fa',
  '#34d399',
  '#f97316',
  '#c084fc',
  '#e11d48',
  '#84cc16',
  '#0ea5e9',
  '#d946ef',
  '#10b981',
  '#f43f5e',
  '#7c3aed',
  '#22d3ee',
]

const CLOUD_TAG_LIMIT = 24

const cloudSlots = [
  { x: 19, y: 30, rotation: -2 },
  { x: 50, y: 23, rotation: 1 },
  { x: 78, y: 34, rotation: -1 },
  { x: 33, y: 49, rotation: 0 },
  { x: 62, y: 52, rotation: 2 },
  { x: 20, y: 68, rotation: 1 },
  { x: 48, y: 74, rotation: -2 },
  { x: 80, y: 68, rotation: 0 },
  { x: 34, y: 86, rotation: 0 },
  { x: 67, y: 84, rotation: 1 },
  { x: 54, y: 37, rotation: -1 },
  { x: 85, y: 50, rotation: 2 },
  { x: 14, y: 49, rotation: -1 },
  { x: 43, y: 61, rotation: 1 },
  { x: 69, y: 19, rotation: -2 },
  { x: 16, y: 84, rotation: 2 },
  { x: 90, y: 82, rotation: -1 },
  { x: 27, y: 18, rotation: 1 },
  { x: 58, y: 91, rotation: -2 },
  { x: 73, y: 58, rotation: 0 },
  { x: 38, y: 33, rotation: 2 },
  { x: 88, y: 25, rotation: -2 },
  { x: 24, y: 56, rotation: 0 },
  { x: 57, y: 14, rotation: 1 },
]

const cloudTags = computed(() => {
  const groups = tagGroups.value.slice(0, CLOUD_TAG_LIMIT)
  const counts = groups.map((group) => group.count)
  const maxCount = Math.max(...counts, 1)
  const densityScale = Math.max(.74, 1 - Math.max(groups.length - 14, 0) * .018)

  return groups.map((group, index) => {
    const slot = cloudSlots[index % cloudSlots.length]
    const countScale = maxCount === 1 ? .54 : Math.log2(group.count + 1) / Math.log2(maxCount + 1)
    const rankScale = 1 - index / Math.max(groups.length - 1, 1)
    const lengthPenalty = Math.min(Math.max(group.tag.length - 8, 0) * 1.4, 14)
    const size = (31 + countScale * 25 + rankScale * 9 - lengthPenalty) * densityScale

    return {
      group,
      x: slot.x,
      y: slot.y,
      rotation: slot.rotation,
      vertical: slot.vertical,
      size: Number(Math.min(72, Math.max(22, size)).toFixed(2)),
      mobileSize: Number(Math.min(42, Math.max(18, size * .7)).toFixed(2)),
      color: cloudPalette[index % cloudPalette.length],
    }
  })
})

function mergeCaptureTags(baseGroups) {
  const byTag = new Map(baseGroups.map((group) => [group.tag, {
    ...group,
    postCount: group.count,
    captureCount: 0,
    captures: captureTagPreviews.value.get(group.tag) || [],
  }]))

  for (const [tag, count] of captureTagCounts.value.entries()) {
    const group = byTag.get(tag) || {
      tag,
      posts: [],
      count: 0,
      postCount: 0,
      captureCount: 0,
      captures: [],
    }
    group.captureCount = count
    group.captures = captureTagPreviews.value.get(tag) || []
    group.count = (group.postCount || group.posts.length) + count
    byTag.set(tag, group)
  }

  return Array.from(byTag.values()).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

function captureUrl(capture) {
  return `/capture/${encodeURIComponent(capture.id)}`
}

function postUrl(post) {
  return `/${post._isNote ? 'note' : 'post'}/${encodeURIComponent(post.id)}`
}

function visiblePostLimit(group) {
  return group.captures?.length ? 2 : 3
}

function tagUrl(tag) {
  return `/tags/${encodeURIComponent(tag)}`
}

function isInteractiveTarget(target) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button'))
}

function openTag(event, tag) {
  if (isInteractiveTarget(event.target)) return
  if (event instanceof KeyboardEvent) event.preventDefault()
  router.push(tagUrl(tag))
}

function tagHeadingId(tag) {
  const slug = encodeURIComponent(tag).replace(/%/g, '').replace(/[^a-zA-Z0-9_-]/g, '-')
  return `tag-card-${slug || 'untitled'}`
}

onMounted(async () => {
  const { getCaptureTagCounts, getCaptureTagPreviews } = await import('../data/capture')
  captureTagCounts.value = getCaptureTagCounts()
  captureTagPreviews.value = getCaptureTagPreviews(1)
})
</script>

<style scoped>
.tag-view {
  --tag-accent: var(--site-accent);
  --tag-accent-soft: rgba(31, 196, 31, 0.18);
  --tag-accent-muted: rgba(31, 196, 31, 0.08);
  --tag-border: rgba(255, 255, 255, 0.08);
}

:global([data-theme="light"]) .tag-view {
  --tag-accent: var(--site-accent);
  --tag-accent-soft: rgba(31, 196, 31, 0.14);
  --tag-accent-muted: rgba(31, 196, 31, 0.06);
  --tag-border: rgba(0, 0, 0, 0.1);
}

.tag-cloud {
  position: relative;
  width: 100%;
  max-width: 1080px;
  min-height: clamp(340px, 34vw, 460px);
  margin: 0 auto 36px;
  padding: 14px 12px;
  overflow: hidden;
}

.tag-cloud__tag {
  position: absolute;
  left: var(--x);
  top: var(--y);
  color: var(--color);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--size);
  font-weight: 600;
  line-height: 1.02;
  white-space: nowrap;
  text-decoration: none;
  text-shadow: none;
  transform: translate(-50%, -50%) rotate(var(--rotation));
  transform-origin: center;
  transition: color 180ms ease, opacity 180ms ease, transform 180ms ease;
  will-change: transform;
}

.tag-cloud__tag.is-vertical {
  letter-spacing: .02em;
}

.tag-cloud__tag:hover,
.tag-cloud__tag:focus-visible {
  color: var(--site-text);
  text-decoration: underline;
  text-decoration-color: var(--tag-accent);
  text-underline-offset: 4px;
  outline: none;
  opacity: .92;
  transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1.06);
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 248px);
  justify-content: start;
  align-items: stretch;
  gap: 24px;
}

.tag-card {
  display: flex;
  flex-direction: column;
  width: 248px;
  height: 100%;
  min-height: 56px;
  min-width: 0;
  padding: 14px;
  overflow: hidden;
  border: 1px solid var(--tag-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.tag-card:hover,
.tag-card:focus-visible {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  outline: none;
  transform: translateY(-1px);
}

.tag-card__heading {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.tag-card__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

.tag-card__link .el-icon {
  flex: 0 0 auto;
}

.tag-card__link-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-card__link:hover,
.tag-card__link:focus-visible {
  color: var(--tag-accent);
  text-decoration: underline;
  text-underline-offset: 4px;
  outline: none;
}

h2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
}

.tag-card__count {
  flex: 0 0 auto;
  color: var(--site-muted);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: .02em;
}

ul {
  margin: 12px 0 0;
  padding: 0;
  max-height: 86px;
  overflow: hidden;
  color: var(--site-muted);
  line-height: 1.65;
  font-size: 16px;
  list-style: none;
}

.tag-card__captures {
  display: grid;
  gap: 12px;
  flex: 0 0 118px;
  margin-top: 12px;
  min-height: 0;
  overflow: hidden;
}

.tag-card__capture-link {
  display: block;
  height: 118px;
  overflow: hidden;
  border: 1px solid var(--tag-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  text-decoration: none;
}

.tag-card__capture-link img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.tag-card__capture-link img.is-image-failed {
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  object-fit: contain;
}

.tag-card__capture-link:hover img,
.tag-card__capture-link:focus-visible img {
  transform: scale(1.03);
}

.tag-card__capture-link:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: -2px;
}

li {
  position: relative;
  margin: 6px 0;
  padding-left: 14px;
}

li::before {
  content: '•';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--tag-accent);
}

li a {
  display: inline-block;
  max-width: 100%;
  color: var(--site-muted);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 160ms ease;
}

li a:hover,
li a:focus-visible {
  color: var(--site-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

@media (max-width: 900px) {
  .tag-grid {
    grid-template-columns: repeat(auto-fill, 248px);
    align-items: start;
    gap: 20px;
  }

  .tag-cloud {
    min-height: 320px;
    margin-top: 4px;
  }

  .tag-cloud__tag {
    font-size: var(--mobile-size);
  }

  h2 {
    font-size: 18px;
  }

  ul {
    font-size: 15px;
  }
}

</style>
