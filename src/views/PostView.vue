<template>
  <section class="post-view page-surface">
    <div class="post-view__main">
      <div v-if="post" class="post-view__card">
          <h1 class="post-view__title">{{ post.title }}</h1>
          <div v-if="post.updated" class="post-view__updated"><el-icon class="post-view__updated-icon"><Edit /></el-icon>最后更新: {{ post.updated }}</div>
          <div v-if="post.wordCount || post.readingMinutes" class="post-view__stats">
            <ContentStats :word-count="post.wordCount" :reading-minutes="post.readingMinutes" />
          </div>
          <div v-if="isLoading" class="post-view__loading" role="status">Loading post...</div>
          <div v-else-if="loadError" class="post-view__loading" role="alert">{{ loadError }}</div>
          <MarkdownContent
            v-else-if="post.body"
            class="post-view__body markdown-body"
            :source="post.body"
            :doc-id="post.id"
            :code-runner="post.codeRunner"
          />
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
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Calendar, PriceTag, Edit } from '@element-plus/icons-vue'
import ContentStats from '../components/content/ContentStats.vue'
import MarkdownContent from '../components/content/MarkdownContent.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getPosts, loadDoc, docContentVersion } from '../data'
import { formatTimelineDate } from '../utils/date'
import type { ArchivePost } from '../types/content'

const route = useRoute()
const body = ref('')
const isLoading = ref(false)
const loadError = ref('')
let latestLoadToken: symbol | null = null

const post = computed(() => {
  const id = route.params.id as string
  const meta = getPosts().find((p) => p.id === id) || null
  if (!meta) return null
  return {
    ...meta,
    body: body.value,
  } satisfies ArchivePost
})

const formattedDate = computed(() => {
  if (!post.value) return ''
  return formatTimelineDate(post.value.date)
})

watch(
  [() => route.params.id, docContentVersion],
  async ([rawId], oldValues) => {
    const id = String(rawId || '')
    const prevId = oldValues ? String(oldValues[0] || '') : ''
    const isHmr = Boolean(oldValues) && prevId === id && body.value !== ''
    if (!isHmr) {
      body.value = ''
      loadError.value = ''
    }

    if (!id || !getPosts().some((item) => item.id === id)) {
      isLoading.value = false
      return
    }

    if (!isHmr) isLoading.value = true
    const token = Symbol(id)
    latestLoadToken = token

    try {
      const loaded = await loadDoc('post', id)
      if (latestLoadToken !== token) return
      body.value = loaded?.body || ''
      if (!loaded) loadError.value = 'Post not found.'
    } catch (error) {
      if (latestLoadToken !== token) return
      loadError.value = error instanceof Error ? error.message : String(error)
    } finally {
      if (latestLoadToken === token) isLoading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.post-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.post-view__main {
  flex: 1;
  min-width: 0;
}

.post-view__card {
  padding: 20px 24px;
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
  color: var(--site-tag-color);
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

.post-view__updated {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
}

.post-view__updated-icon {
  font-size: 14px;
}

.post-view__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
}

.post-view__body {
  margin-top: 18px;
  color: var(--site-text);
  font-size: 15px;
  line-height: 1.75;
}

.post-view__loading {
  margin-top: 18px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 700;
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
  background: var(--md-inline-code-bg);
  color: var(--md-inline-code-text);
  font-size: 14px;
  font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
}

.post-view__body :deep(pre) {
  margin: 16px 0;
  padding: 16px 20px;
  border-radius: 8px;
  background: var(--md-code-bg);
  border: 1px solid var(--md-pre-border);
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

.post-view__body :deep(.md-code-block) {
  margin: 16px 0;
}

.post-view__body :deep(.md-code-block pre) {
  margin: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.post-view__body :deep(pre code) {
  padding: 0;
  background: none;
  border-radius: 0;
  border: none;
  color: var(--md-code-text);
  font-size: inherit;
}

.post-view__body :deep(strong) {
  font-weight: 700;
}

.post-view__body :deep(em) {
  font-style: italic;
}

.post-view__body :deep(h1),
.post-view__body :deep(h2),
.post-view__body :deep(h3),
.post-view__body :deep(h4) {
  margin: 24px 0 12px;
  color: var(--site-text);
  font-weight: 700;
  line-height: 1.4;
}

.post-view__body :deep(h1) { font-size: 22px; }
.post-view__body :deep(h2) { font-size: 19px; }
.post-view__body :deep(h3) { font-size: 16px; }
.post-view__body :deep(h4) { font-size: 15px; }

.post-view__body :deep(ul),
.post-view__body :deep(ol) {
  margin: 10px 0;
  padding-left: 24px;
}

.post-view__body :deep(li) {
  margin: 4px 0;
}

.post-view__body :deep(blockquote) {
  margin: 12px 0;
  padding: 4px 16px;
  border-left: 3px solid var(--site-accent);
  color: var(--site-muted);
}

.post-view__body :deep(blockquote p) {
  margin: 4px 0;
}

.post-view__body :deep(table) {
  margin: 14px 0;
  border-collapse: collapse;
  width: 100%;
}

.post-view__body :deep(th),
.post-view__body :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--site-border);
  text-align: left;
  font-size: 14px;
}

.post-view__body :deep(th) {
  background: var(--md-inline-code-bg);
  font-weight: 700;
}

.post-view__body :deep(hr) {
  margin: 24px 0;
  border: none;
  border-top: 1px solid var(--site-border);
}

.post-view__body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

.post-view__body :deep(details) {
  margin: 12px 0;
}

.post-view__body :deep(summary) {
  cursor: pointer;
  color: var(--site-text);
  font-weight: 700;
  padding: 6px 0;
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
    padding: 16px;
  }

  .post-view__title {
    font-size: 18px;
  }

  .post-view__body {
    font-size: 15px;
  }
}
</style>
