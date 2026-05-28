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
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import {
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

defineEmits(['navigate'])

const navItems = [
  { name: 'home', label: 'Home', to: '/', icon: House },
  { name: 'archive', label: 'Archive', to: '/archive', icon: Collection },
  { name: 'notes', label: 'Notes', to: '/notes', icon: Notebook },
  { name: 'infra', label: 'Infra', to: '/infra', icon: Cpu },
  { name: 'project', label: 'Project', to: '/project', icon: FolderOpened },
  { name: 'tags', label: 'Tags', to: '/tags', icon: PriceTag },
  { name: 'about', label: 'About', to: '/about', icon: User },
  { name: 'friends', label: 'Friends', to: '/friends', icon: Connection },
  { name: 'search', label: 'Search', to: '/search', icon: Search },
]
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
  gap: 7px;
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 0;
  color: var(--site-muted);
  font-size: 14px;
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
  outline: none;
}

.nav-menu__item.router-link-exact-active {
  color: var(--site-accent);
}

.nav-menu__item--bottom {
  margin-top: auto;
}

.nav-menu__icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
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
