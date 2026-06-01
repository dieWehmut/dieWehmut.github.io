<template>
  <section class="capture-view page-surface">
    <div class="capture-view__main">
      <PageHeading
        title="Capture"
        :icon="Camera"
      />

      <div v-if="allAssets.length" class="capture-grid">
        <article v-for="asset in allAssets" :key="asset.id" class="capture-card">
          <a class="capture-card__media" :href="asset.image" target="_blank" rel="noopener noreferrer">
            <img :src="asset.image" :alt="asset.title" loading="lazy" />
          </a>

          <div class="capture-card__body">
            <div class="capture-card__topline">
              <h2>{{ asset.title }}</h2>
              <time v-if="asset.date" :datetime="asset.date">{{ formatDate(asset.date) }}</time>
            </div>

            <p v-if="asset.summary" class="capture-card__summary">{{ asset.summary }}</p>

            <div v-if="asset.tags.length" class="capture-card__tags">
              <RouterLink
                v-for="tag in asset.tags"
                :key="tag"
                class="capture-card__tag"
                :to="`/tags/${encodeURIComponent(tag)}`"
              >
                {{ tag }}
              </RouterLink>
            </div>

            <div class="capture-card__sources">
              <span class="capture-card__kind" :class="{ 'is-standalone': asset.standalone }">
                {{ asset.standalone ? 'standalone' : sourceKindLabel(asset) }}
              </span>

              <div v-if="asset.sourceRefs.length" class="capture-card__links">
                <RouterLink
                  v-for="source in asset.sourceRefs"
                  :key="`${source.type}:${source.id}`"
                  class="capture-card__link"
                  :to="source.url"
                >
                  {{ source.title }}
                </RouterLink>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="capture-empty">
        No capture assets found.
      </div>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Camera } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getCaptureAssets } from '../data'
import type { CaptureAsset } from '../types/content'
import { formatTimelineDate } from '../utils/date'

const allAssets = computed(() => getCaptureAssets())

function formatDate(date?: string) {
  return formatTimelineDate(date)
}

function sourceKindLabel(asset: CaptureAsset) {
  const kinds = new Set(asset.sourceRefs.map((item) => item.type))
  if (kinds.size > 1) return 'note + post'
  return kinds.has('note') ? 'note' : 'post'
}
</script>

<style scoped>
.capture-view {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.capture-view__main {
  flex: 1;
  min-width: 0;
}

.capture-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.capture-card {
  overflow: hidden;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.capture-card__media {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.capture-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.capture-card__media:hover img,
.capture-card__media:focus-visible img {
  transform: scale(1.03);
}

.capture-card__body {
  padding: 16px;
}

.capture-card__topline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.capture-card__topline h2 {
  margin: 0;
  color: var(--site-text);
  font-size: 18px;
  line-height: 1.3;
}

.capture-card__topline time {
  color: var(--site-muted);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.capture-card__summary {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 14px;
  line-height: 1.6;
}

.capture-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.capture-card__tag {
  color: var(--site-tag-color);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.capture-card__tag:hover,
.capture-card__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}

.capture-card__sources {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.capture-card__kind {
  display: inline-flex;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(31, 196, 31, 0.08);
  color: var(--site-accent);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.capture-card__kind.is-standalone {
  color: #e0b15a;
  background: rgba(224, 177, 90, 0.12);
}

.capture-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.capture-card__link {
  color: var(--site-text);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.capture-card__link:hover,
.capture-card__link:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}

.capture-empty {
  padding: 54px 0;
  color: var(--site-muted);
  text-align: center;
  font-size: 16px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .capture-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

</style>
