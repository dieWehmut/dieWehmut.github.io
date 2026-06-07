<template>
  <article class="capture-asset-card">
    <button
      class="capture-asset-card__media"
      type="button"
      @click="$emit('preview', asset)"
    >
      <img
        :src="asset.image"
        :alt="asset.title || ''"
        loading="lazy"
        decoding="async"
        @error="retryPublicAssetImage($event, asset.image)"
      />
    </button>

    <div class="capture-asset-card__body">
      <div v-if="asset.sourceRefs.length" class="capture-asset-card__sources">
        <RouterLink
          v-for="source in asset.sourceRefs"
          :key="`${source.type}:${source.id}`"
          class="capture-asset-card__source"
          :to="source.url"
        >
          {{ source.title }}
        </RouterLink>
      </div>

      <div class="capture-asset-card__meta-row">
        <time v-if="asset.date" :datetime="asset.date">
          <el-icon class="capture-asset-card__meta-icon"><Calendar /></el-icon>
          {{ formattedDate }}
        </time>
        <RouterLink
          v-for="tag in asset.tags"
          :key="tag"
          class="capture-asset-card__tag"
          :to="`/tags/${encodeURIComponent(tag)}`"
        >
          <el-icon class="capture-asset-card__tag-icon"><PriceTag /></el-icon>
          {{ tag }}
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, PriceTag } from '@element-plus/icons-vue'
import type { CaptureAsset } from '../../types/content'
import { formatTimelineDate } from '../../utils/date'
import { retryPublicAssetImage } from '../../utils/publicAssets'

const props = defineProps<{
  asset: CaptureAsset
}>()

defineEmits<{
  preview: [asset: CaptureAsset]
}>()

const formattedDate = computed(() => formatTimelineDate(props.asset.date))
</script>

<style scoped>
.capture-asset-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.capture-asset-card__media {
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

.capture-asset-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.capture-asset-card__media img.is-image-failed {
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  object-fit: contain;
}

.capture-asset-card__media:hover img,
.capture-asset-card__media:focus-visible img {
  transform: scale(1.03);
}

.capture-asset-card__media:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--site-accent);
  outline-offset: -2px;
}

.capture-asset-card__body {
  padding: 12px 14px 14px;
}

.capture-asset-card__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 8px;
}

.capture-asset-card__source {
  color: var(--site-text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.capture-asset-card__source:hover,
.capture-asset-card__source:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.capture-asset-card__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  font-size: 14px;
}

.capture-asset-card__meta-row time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.capture-asset-card__meta-icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
}

.capture-asset-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.capture-asset-card__tag:hover,
.capture-asset-card__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.capture-asset-card__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .capture-asset-card {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}
</style>
