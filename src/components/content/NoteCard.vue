<template>
  <article class="note-card" :id="note.id">
    <time :datetime="note.date" class="note-card__date">
      <el-icon><Calendar /></el-icon>
      {{ formattedDate }}
    </time>
    <h2 v-if="note.title">{{ note.title }}</h2>
    <p>{{ note.body }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import type { NoteEntry } from '../../types/content'

const props = defineProps<{ note: NoteEntry }>()

const formattedDate = computed(() => {
  const date = new Date(props.note.date)
  if (Number.isNaN(date.valueOf())) return props.note.date
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.note-card {
  padding: 28px 0;
  border-bottom: 1px solid var(--site-border);
}

.note-card__date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 6px 14px;
  border-radius: 9px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.08);
  font-size: 18px;
  font-weight: 800;
}

h2 {
  margin: 0 0 12px;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
}

p {
  margin: 0;
  color: var(--site-muted);
  font-size: 21px;
  line-height: 1.75;
}
</style>
