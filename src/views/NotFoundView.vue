<template>
  <section class="not-found page-surface">
    <PageHeading title="Not Found" :icon="Warning" />
    <RouterLink class="not-found__link" to="/">Return home</RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
</script>

<style scoped>
.not-found__link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 16px;
  border: 1px solid rgb(var(--site-accent-rgb) / 0.4);
  border-radius: 8px;
  color: var(--site-accent);
  font-weight: 800;
  text-decoration: none;
}
</style>
