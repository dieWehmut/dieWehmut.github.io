<template>
  <a
    class="friend-card card-overflow-host"
    :class="{ 'has-overflow-badge': overflowCount > 0 }"
    :href="friend.url"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img v-if="friend.avatar" class="friend-card__avatar" :src="friend.avatar" alt="" />
    <div v-else class="friend-card__avatar friend-card__avatar--fallback">{{ initials }}</div>
    <div class="friend-card__body">
      <h2>{{ friend.name }}</h2>
      <MarkdownPreview class="friend-card__description" :source="friend.description" />
    </div>
    <span v-if="overflowCount > 0" class="card-overflow-badge" aria-hidden="true">
      +{{ overflowCount }}
    </span>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FriendLink } from '../../types/content'
import MarkdownPreview from './MarkdownPreview.vue'

const props = withDefaults(defineProps<{
  friend: FriendLink
  overflowCount?: number
}>(), {
  overflowCount: 0,
})
const initials = computed(() => props.friend.name.slice(0, 2).toUpperCase())
</script>

<style scoped>
.friend-card {
  display: flex;
  height: 96px;
  align-items: center;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  overflow: hidden;
  color: var(--site-text);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.friend-card:hover,
.friend-card:focus-visible {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
  text-decoration: none;
  outline: none;
}

.friend-card.has-overflow-badge .friend-card__body {
  padding-right: 76px;
}

.friend-card__avatar {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  object-fit: cover;
  object-position: center;
  background: #fff;
}

.friend-card__avatar--fallback {
  display: grid;
  place-items: center;
  color: #111;
  font-weight: 900;
  background: var(--site-accent);
}

.friend-card__body {
  min-width: 0;
  padding: 22px 24px;
}

h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
}

.friend-card__description {
  display: block;
  margin: 6px 0 0;
  color: var(--site-muted);
  font-size: 14px;
  line-height: 1.4;
  --markdown-preview-lines: 2;
}

@media (max-width: 560px) {
  .friend-card {
    height: 76px;
  }

  .friend-card__avatar {
    width: 76px;
    height: 76px;
  }

  .friend-card__body {
    padding: 14px 16px;
  }

  h2 {
    font-size: 19px;
  }
}
</style>
