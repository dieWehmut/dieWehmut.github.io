<template>
  <section class="page-surface">
    <PageHeading :title="tag" :icon="PriceTag" />

    <div class="tag-detail__count">{{ posts.length }} {{ posts.length === 1 ? 'post' : 'posts' }}</div>

    <div class="tag-detail__list">
      <article v-for="post in posts" :key="post.id" class="tag-detail__item">
        <h2>
          <RouterLink :to="`/archive#${post.id}`">{{ post.title }}</RouterLink>
        </h2>
        <time :datetime="post.date">{{ formattedDate(post.date) }}</time>
        <p>{{ post.summary }}</p>
      </article>
    </div>

    <div v-if="!posts.length" class="tag-detail__empty">
      No posts found for this tag.
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { PriceTag } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { getPosts } from '../data'

const route = useRoute()
const tag = computed(() => decodeURIComponent(String(route.params.tag || '')))

const posts = computed(() =>
  getPosts().filter((post) => (post.tags || []).some((t) => t.toLowerCase() === tag.value.toLowerCase()))
)

function formattedDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.valueOf())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
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

.tag-detail__item {
  padding: 18px 0;
  border-bottom: 1px solid var(--site-border);
}

.tag-detail__item h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  line-height: 1.2;
}

.tag-detail__item a {
  color: var(--site-text);
  text-decoration: none;
  transition: color 160ms ease;
}

.tag-detail__item a:hover,
.tag-detail__item a:focus-visible {
  color: var(--site-accent);
  outline: none;
}

.tag-detail__item time {
  display: inline-block;
  margin-top: 6px;
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 700;
}

.tag-detail__item p {
  margin: 8px 0 0;
  color: var(--site-muted);
  font-size: 15px;
  line-height: 1.6;
}

.tag-detail__empty {
  padding: 40px 0;
  color: var(--site-muted);
  text-align: center;
}
</style>
