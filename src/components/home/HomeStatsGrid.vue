<template>
  <div class="home-view__grid">
    <RouterLink
      v-for="stat in stats"
      :key="stat.key"
      class="home-view__panel"
      :to="stat.path"
    >
      <span>{{ stat.label }}</span>
      <strong>{{ stat.value ?? '...' }}</strong>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useSiteOverview } from '../../composables/useSiteOverview'

const { stats } = useSiteOverview()
</script>

<style scoped>
.home-view__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 8px 0 36px;
}

.home-view__panel {
  padding: 16px 18px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.home-view__panel:hover,
.home-view__panel:focus-visible {
  border-color: rgb(var(--site-accent-rgb) / 0.42);
  background: rgb(var(--site-accent-rgb) / 0.04);
  transform: translateY(-2px);
  text-decoration: none;
  outline: none;
}

.home-view__panel span {
  display: block;
  color: var(--site-muted);
  font-weight: 800;
  font-size: 13px;
}

.home-view__panel strong {
  display: block;
  margin: 8px 0 0;
  color: var(--site-accent);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
  line-height: 1;
}

@media (max-width: 760px) {
  .home-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

