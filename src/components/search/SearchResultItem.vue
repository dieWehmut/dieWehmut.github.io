<template>
  <a class="search-result" :href="result.url" :target="external ? '_blank' : undefined" :rel="external ? 'noopener noreferrer' : undefined">
    <el-icon class="search-result__icon">
      <component :is="icon" />
    </el-icon>
    <div class="search-result__body">
      <div class="search-result__meta">
        <span>{{ result.type }}</span>
        <time v-if="result.date" :datetime="result.date">{{ result.date }}</time>
      </div>
      <h2>{{ result.title }}</h2>
      <p>{{ result.description }}</p>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Camera, Connection, Cpu, Document, FolderOpened, Memo } from '@element-plus/icons-vue'
import type { SearchDocument } from '../../types/content'

const props = defineProps<{ result: SearchDocument }>()

const icon = computed(() => {
  if (props.result.type === 'note') return Memo
  if (props.result.type === 'capture') return Camera
  if (props.result.type === 'friend') return Connection
  if (props.result.type === 'project') return FolderOpened
  if (props.result.type === 'infra') return Cpu
  return Document
})

const external = computed(() => /^https?:\/\//.test(props.result.url))
</script>

<style scoped>
.search-result {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 20px;
  padding: 21px 0;
  color: var(--site-text);
  text-decoration: none;
}

.search-result + .search-result {
  border-top: 1px solid var(--site-border);
}

.search-result:hover h2,
.search-result:focus-visible h2 {
  color: var(--site-accent);
}

.search-result:focus-visible {
  outline: 2px solid rgba(31, 196, 31, 0.45);
  outline-offset: 4px;
}

.search-result__icon {
  margin-top: 3px;
  color: var(--site-muted);
  font-size: 22px;
}

.search-result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 2px;
  color: var(--site-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  transition: color 160ms ease;
}

p {
  margin: 4px 0 0;
  color: var(--site-muted);
  font-size: 15px;
  line-height: 1.55;
}
</style>
