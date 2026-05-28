<template>
  <section class="post-view page-surface">
    <div class="post-view__main">
      <div v-if="post" class="post-view__card">
          <h1 class="post-view__title">{{ post.title }}</h1>
          <p v-if="post.summary" class="post-view__summary">{{ post.summary }}</p>
          <div v-if="post.body" class="post-view__body" v-html="renderedBody" />
          <div v-if="post.date || post.tags?.length" class="post-view__meta-row">
            <time v-if="post.date" class="post-view__meta-date" :datetime="post.date"><el-icon class="post-view__meta-icon"><Calendar /></el-icon>{{ formattedDate }}</time>
            <RouterLink
              v-for="tag in post.tags"
              :key="tag"
              class="post-view__meta-tag"
              :to="`/tags/${encodeURIComponent(tag)}`"
            ><el-icon class="post-view__meta-icon--tag"><PriceTag /></el-icon>{{ tag }}</RouterLink>
        </div>
      </div>
      <div v-else class="post-view__not-found">
        <p>Post not found.</p>
        <RouterLink to="/archive">Back to Archive</RouterLink>
      </div>
    </div>

    <ScrollSpySidebar root-selector=".page-surface" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Calendar, PriceTag } from '@element-plus/icons-vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getPosts } from '../data'

const route = useRoute()

const post = computed(() => {
  const id = route.params.id as string
  return getPosts().find((p) => p.id === id) || null
})

const formattedDate = computed(() => {
  if (!post.value) return ''
  const d = new Date(post.value.date)
  if (Number.isNaN(d.valueOf())) return post.value.date
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
})

function simpleMarkdown(text: string) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]*)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
}

const renderedBody = computed(() => {
  if (!post.value?.body) return ''
  return `<p>${simpleMarkdown(post.value.body)}</p>`
})
</script>

<style scoped>
.post-view {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.post-view__main {
  flex: 1;
  min-width: 0;
}

.post-view__card {
  padding: 32px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035);
}

.post-view__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
  font-size: 15px;
}

.post-view__meta-date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-weight: 800;
}

.post-view__meta-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
}

.post-view__meta-icon--tag {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

.post-view__meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(190, 190, 190, 0.82);
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.post-view__meta-tag:hover,
.post-view__meta-tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.post-view__title {
  margin: 0;
  color: var(--site-text);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}

.post-view__summary {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 15px;
  line-height: 1.6;
}

.post-view__body {
  margin-top: 18px;
  color: var(--site-text);
  font-size: 15px;
  line-height: 1.75;
}

.post-view__body :deep(p) {
  margin: 0;
}

.post-view__body :deep(p + p) {
  margin-top: 16px;
}

.post-view__body :deep(a) {
  color: var(--site-accent);
  text-decoration: none;
  transition: text-decoration 160ms ease;
}

.post-view__body :deep(a:hover) {
  text-decoration: underline;
}

.post-view__body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 15px;
}

.post-view__body :deep(strong) {
  font-weight: 700;
}

.post-view__not-found {
  padding: 64px 32px;
  text-align: center;
  color: var(--site-muted);
}

.post-view__not-found p {
  font-size: 18px;
  margin: 0 0 18px;
}

.post-view__not-found a {
  color: var(--site-accent);
  font-weight: 700;
  text-decoration: none;
}

.post-view__not-found a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .post-view__card {
    padding: 22px;
  }

  .post-view__title {
    font-size: 18px;
  }

  .post-view__body {
    font-size: 15px;
  }
}
</style>

