<template>
  <header class="page-heading">
    <div class="page-heading__title-row">
      <el-icon v-if="icon" class="page-heading__icon">
        <component :is="icon" />
      </el-icon>
      <h1>{{ title }}</h1>
      <slot name="title-extra" />
    </div>
    <MarkdownPreview v-if="description" class="page-heading__description" :source="description" />
  </header>
</template>

<script setup>
import MarkdownPreview from './MarkdownPreview.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
})
</script>

<style scoped>
.page-heading {
  margin-bottom: 34px;
}

.page-heading__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.page-heading__icon {
  font-size: clamp(20px, 2.5vw, 30px);
  color: var(--site-muted);
}

h1 {
  min-width: 0;
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 800;
  line-height: 1;
  overflow-wrap: anywhere;
}

.page-heading__description {
  display: block;
  margin: 16px 0 0;
  max-width: 760px;
  color: var(--site-muted);
  font-size: 17px;
  line-height: 1.6;
  --markdown-preview-lines: 3;
}

@media (max-width: 640px) {
  .page-heading {
    margin-bottom: 24px;
  }

  .page-heading__description {
    font-size: 16px;
  }
}
</style>
