<template>
  <section class="page-surface">
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
      <article v-for="group in tagGroups" :key="group.tag" class="tag-card">
        <div class="tag-card__heading">
          <h2>
            <RouterLink class="tag-card__link" :to="`/tags/${encodeURIComponent(group.tag)}`">
              <el-icon><PriceTag /></el-icon>
              {{ group.tag }}
            </RouterLink>
          </h2>
          <span>x {{ group.count }}</span>
        </div>
        <ul>
          <li v-for="post in group.posts.slice(0, 5)" :key="post.id">
            <RouterLink :to="`/archive#${post.id}`">{{ post.title }}</RouterLink>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { PriceTag } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { getTagGroups } from '../data'

const tagGroups = computed(() => getTagGroups())
const cloudPalette = [
  '#0b4f8a',
  '#d36b08',
  '#e51a2e',
  '#0067a6',
  '#5a18c8',
  '#13e66d',
  '#5f198f',
  '#84570d',
  '#007664',
  '#1caa1c',
  '#c1003f',
  '#8920d9',
  '#17a6a6',
  '#9be315',
  '#004aa8',
  '#4b18aa',
  '#006b28',
  '#d018d8',
  '#d38b12',
  '#960064',
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
</script>

<style scoped>
.tag-cloud {
  position: relative;
  width: 100%;
  max-width: 1040px;
  min-height: clamp(360px, 34vw, 440px);
  margin: 0 auto 30px;
  overflow: hidden;
}

.tag-cloud__tag {
  position: absolute;
  left: var(--x);
  top: var(--y);
  color: var(--color);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--size);
  font-weight: 700;
  line-height: 1.02;
  white-space: nowrap;
  text-decoration: none;
  text-shadow: 0 0 1px rgba(0, 0, 0, .15);
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
  text-decoration-color: var(--site-accent);
  text-underline-offset: 4px;
  outline: none;
  opacity: .92;
  transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1.06);
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 38px 50px;
}

.tag-card {
  min-width: 0;
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
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

.tag-card__link:hover,
.tag-card__link:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 4px;
  outline: none;
}

h2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
}

.tag-card__heading span {
  flex: 0 0 auto;
  padding: 2px 14px 4px;
  border-radius: 999px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, .12);
  font-weight: 800;
}

ul {
  margin: 14px 0 0;
  padding-left: 22px;
  color: var(--site-muted);
  line-height: 1.7;
  font-size: 17px;
}

li::marker {
  color: var(--site-accent);
}

@media (max-width: 900px) {
  .tag-grid {
    grid-template-columns: 1fr;
  }

  .tag-cloud {
    min-height: 390px;
    margin-top: 4px;
  }

  .tag-cloud__tag {
    font-size: var(--mobile-size);
  }
}
</style>
