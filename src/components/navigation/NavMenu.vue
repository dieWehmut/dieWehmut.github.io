<template>
  <nav class="nav-menu" aria-label="Primary navigation">
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      class="nav-menu__item"
      :to="item.to"
      @click="$emit('navigate')"
    >
      <el-icon class="nav-menu__icon">
        <component :is="item.icon" />
      </el-icon>
      <span>{{ labelFor(item.labelKey, item.fallbackLabel) }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
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

defineEmits(['navigate'])

const { t } = useI18n()

const allNavItems = [
  { name: 'home', labelKey: 'nav.home', fallbackLabel: 'Home', to: '/', icon: House },
  { name: 'archive', labelKey: 'nav.archive', fallbackLabel: 'Archive', to: '/archive', icon: Collection },
  { name: 'notes', labelKey: 'nav.notes', fallbackLabel: 'Notes', to: '/notes', icon: Notebook },
  { name: 'capture', labelKey: 'nav.capture', fallbackLabel: 'Capture', to: '/capture', icon: Camera },
  { name: 'infra', labelKey: 'nav.infra', fallbackLabel: 'Infra', to: '/infra', icon: Cpu, enabled: siteConfig.enableInfra },
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
</script>

<style scoped>
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0px;
  align-items: stretch;
  margin-top: 10px;
  flex: 1;
}

.nav-menu__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 0;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition:
    color 160ms ease,
    transform 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.nav-menu__item:hover,
.nav-menu__item:focus-visible {
  color: var(--site-text);
  background: rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035);
  text-decoration: none;
  outline: none;
}

.nav-menu__item.router-link-exact-active {
  color: var(--site-accent);
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
    gap: 2px;
    margin-top: 14px;
  }

  .nav-menu__item {
    justify-content: center;
    min-height: 36px;
    padding: 0 8px;
    font-size: 13px;
  }
}
</style>
