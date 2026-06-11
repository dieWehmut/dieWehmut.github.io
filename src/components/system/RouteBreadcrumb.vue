<template>
  <nav class="route-breadcrumb" :class="`route-breadcrumb--${variant}`" aria-label="Current page path">
    <template v-for="(crumb, index) in crumbs" :key="`${crumb.label}:${index}`">
      <span v-if="index > 0" class="route-breadcrumb__separator" aria-hidden="true">&gt;</span>
      <RouterLink
        v-if="crumb.to && index < crumbs.length - 1"
        class="route-breadcrumb__item"
        :to="crumb.to"
      >
        {{ crumb.label }}
      </RouterLink>
      <span
        v-else
        class="route-breadcrumb__item route-breadcrumb__item--current"
        aria-current="page"
      >
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getNotes, getPosts, siteProfile } from '../../data'
import { getCaptureAssetById } from '../../data/capture'

type Crumb = {
  label: string
  to?: string
}

const route = useRoute()

defineProps({
  variant: { type: String, default: 'bar' },
})

const staticPages: Record<string, Crumb> = {
  home: { label: 'Home', to: '/' },
  archive: { label: 'Archive', to: '/archive' },
  notes: { label: 'Notes', to: '/notes' },
  capture: { label: 'Capture', to: '/capture' },
  infra: { label: 'Infra', to: '/infra' },
  project: { label: 'Project', to: '/project' },
  tags: { label: 'Tags', to: '/tags' },
  about: { label: 'About', to: '/about' },
  friends: { label: 'Friends', to: '/friends' },
  search: { label: 'Search', to: '/search' },
}

function decodeParam(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function detailTitle() {
  const name = String(route.name || '')
  if (name === 'post-detail') {
    const id = String(route.params.id || '')
    return getPosts().find((post) => post.id === id)?.title || id
  }

  if (name === 'note-detail') {
    const id = String(route.params.id || '')
    return getNotes().find((note) => note.id === id)?.title || id
  }

  if (name === 'capture-detail') {
    const id = decodeParam(route.params.id)
    return getCaptureAssetById(id)?.title || id || 'Detail'
  }

  if (name === 'tag-detail') return decodeParam(route.params.tag) || 'Detail'
  return ''
}

const crumbs = computed<Crumb[]>(() => {
  const siteCrumb = { label: siteProfile.title || 'Nexus', to: '/' }
  const name = String(route.name || '')

  if (name === 'post-detail') return [{ label: 'Archive', to: '/archive' }, { label: detailTitle() }]
  if (name === 'note-detail') return [{ label: 'Notes', to: '/notes' }, { label: detailTitle() }]
  if (name === 'capture-detail') return [{ label: 'Capture', to: '/capture' }, { label: detailTitle() }]
  if (name === 'tag-detail') return [{ label: 'Tags', to: '/tags' }, { label: detailTitle() }]
  if (name === 'not-found') return [siteCrumb, { label: 'Not Found' }]

  const page = staticPages[name]
  if (page) return [siteCrumb, { label: page.label, to: page.to }]
  return [siteCrumb, { label: route.path || 'View' }]
})
</script>

<style scoped>
.route-breadcrumb {
  position: fixed;
  top: 0;
  left: var(--site-sidebar-width);
  right: calc(var(--site-right-rail-offset) + var(--site-scroll-spy-width) + var(--site-view-aside-gap));
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 3px;
  height: var(--site-route-path-height);
  min-width: 0;
  padding: 3px 12px 0;
  border-bottom: 1px solid var(--site-border);
  background: var(--site-sidebar-bg);
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 760;
  backdrop-filter: blur(14px);
  animation: routePathSlide 220ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

.route-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  min-height: 28px;
  padding: 0 4px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.route-breadcrumb__item:hover,
.route-breadcrumb__item:focus-visible {
  background: color-mix(in srgb, var(--site-accent) 10%, transparent);
  color: var(--site-accent);
  text-decoration: none;
  outline: none;
}

.route-breadcrumb__item--current {
  color: var(--site-text);
}

.route-breadcrumb__separator {
  flex: 0 0 auto;
  color: var(--site-accent);
  font-weight: 900;
}

@media (min-width: 901px) and (max-width: 1080px) {
  .route-breadcrumb {
    right: 16px;
  }
}

@media (max-width: 900px) {
  .route-breadcrumb {
    position: sticky;
    top: var(--site-mobile-header-height);
    right: auto;
    left: auto;
    z-index: 29;
    width: 100%;
    padding-inline: 18px;
  }
}

.route-breadcrumb.route-breadcrumb--inline {
  position: static;
  top: auto;
  right: auto;
  left: auto;
  z-index: auto;
  flex: 1 1 auto;
  width: auto;
  height: 40px;
  min-width: 0;
  padding: 0;
  border-bottom: 0;
  background: transparent;
  backdrop-filter: none;
  animation: none;
  gap: 2px;
}

.route-breadcrumb.route-breadcrumb--inline .route-breadcrumb__item {
  padding-inline: 2px;
}

@keyframes routePathSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
