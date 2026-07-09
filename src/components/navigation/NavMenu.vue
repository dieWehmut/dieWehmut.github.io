<template>
  <nav class="nav-menu" aria-label="Primary navigation">
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      class="nav-menu__item"
      :to="item.to"
      @pointerenter="preloadNavItem(item.to)"
      @focus="preloadNavItem(item.to)"
      @click="handleNavigate(item.to)"
    >
      <el-icon class="nav-menu__icon">
        <component :is="item.icon" />
      </el-icon>
      <span>{{ labelFor(item.labelKey, item.fallbackLabel) }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import {
  Camera,
  Collection,
  Connection,
  Cpu,
  FolderOpened,
  House,
  Notebook,
  PriceTag,
  Search,
  User,
} from '@element-plus/icons-vue'
import { siteConfig } from '../../data/site/config'
import { preloadPrimaryRoutes, preloadRouteByPath } from '../../router'

const emit = defineEmits(['navigate'])

const { t } = useI18n()

const allNavItems = [
  { name: 'home', labelKey: 'nav.home', fallbackLabel: 'Home', to: '/', icon: House },
  { name: 'archive', labelKey: 'nav.archive', fallbackLabel: 'Archive', to: '/archive', icon: Collection },
  { name: 'notes', labelKey: 'nav.notes', fallbackLabel: 'Notes', to: '/notes', icon: Notebook },
  { name: 'infra', labelKey: 'nav.infra', fallbackLabel: 'Infra', to: '/infra', icon: Cpu, enabled: siteConfig.enableInfra },
  { name: 'capture', labelKey: 'nav.capture', fallbackLabel: 'Capture', to: '/capture', icon: Camera },
  { name: 'project', labelKey: 'nav.project', fallbackLabel: 'Project', to: '/project', icon: FolderOpened, enabled: siteConfig.enableProject },
  { name: 'tags', labelKey: 'nav.tags', fallbackLabel: 'Tags', to: '/tags', icon: PriceTag },
  { name: 'about', labelKey: 'nav.about', fallbackLabel: 'About', to: '/about', icon: User },
  { name: 'friends', labelKey: 'nav.friends', fallbackLabel: 'Friends', to: '/friends', icon: Connection },
  { name: 'search', labelKey: 'nav.search', fallbackLabel: 'Search', to: '/search', icon: Search },
]

const navItems = computed(() => allNavItems.filter((item) => item.enabled !== false))

function labelFor(key, fallbackLabel) {
  const value = t(key)
  return value === key ? fallbackLabel : value
}

function preloadNavItem(to) {
  preloadRouteByPath(to)
}

function handleNavigate(to) {
  preloadRouteByPath(to)
  emit('navigate')
}

onMounted(preloadPrimaryRoutes)
</script>

<style scoped>
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
  margin-top: 10px;
  flex: 1;
}

.nav-menu__item {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 8px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 760;
  line-height: 1.35;
  text-decoration: none;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.nav-menu__item::after {
  position: absolute;
  inset: 0 auto 0 -44%;
  width: 32%;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--site-accent) 16%, transparent),
    transparent
  );
  content: "";
  pointer-events: none;
  transform: skewX(-10deg);
  transition: transform 260ms ease;
}

.nav-menu__item:hover,
.nav-menu__item:focus-visible,
.nav-menu__item.router-link-exact-active {
  color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 10%, transparent);
  text-decoration: none;
  outline: none;
}

.nav-menu__item:hover::after,
.nav-menu__item:focus-visible::after,
.nav-menu__item.router-link-exact-active::after {
  transform: translateX(430%) skewX(-10deg);
}

.nav-menu__item--bottom {
  margin-top: auto;
}

.nav-menu__icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
}

@media (max-width: 900px) {
  .nav-menu {
    gap: 3px;
    margin-top: 14px;
  }

  .nav-menu__item {
    justify-content: center;
    min-height: 40px;
    padding: 0 10px;
    font-size: 14px;
  }

  .nav-menu__icon {
    width: 19px;
    height: 19px;
    font-size: 19px;
  }
}
</style>
