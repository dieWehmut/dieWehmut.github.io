<template>
  <aside class="site-sidebar" aria-label="Site sidebar">
    <RouterLink class="site-sidebar__avatar-link" to="/" aria-label="Back to home" @click="$emit('navigate')">
      <img class="site-sidebar__avatar" :src="avatarUrl" alt="Avatar" />
    </RouterLink>

    <div class="site-sidebar__identity">
      <div class="site-sidebar__title">{{ siteProfile.title }}</div>
    </div>

    <NavMenu @navigate="$emit('navigate')" />
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import NavMenu from './NavMenu.vue'
import { useProfile } from '../../composables/useProfile'
import { siteProfile } from '../../data'

defineEmits(['navigate'])

const { avatarUrl } = useProfile()
</script>

<style scoped>
.site-sidebar {
  display: flex;
  flex-direction: column;
  width: var(--site-sidebar-width);
  min-height: 100vh;
  padding: 16px 18px 24px;
  color: var(--site-text);
  background: var(--site-sidebar-bg);
  border-right: 1px solid var(--site-border);
  overflow: hidden;
}

.site-sidebar__avatar-link {
  display: flex;
  justify-content: center;
  width: 152px;
  height: 152px;
  margin: 0 auto 14px;
  border-radius: 50%;
  text-decoration: none;
  cursor: pointer;
  outline: none;
}

.site-sidebar__avatar {
  width: 152px;
  height: 152px;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  transition: transform 220ms ease;
}

.site-sidebar__avatar-link:hover .site-sidebar__avatar,
.site-sidebar__avatar-link:focus-visible .site-sidebar__avatar {
  transform: scale(1.08);
}

.site-sidebar__identity {
  text-align: center;
}

.site-sidebar__title {
  color: var(--site-text);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}

@media (max-width: 900px) {
  .site-sidebar {
    width: min(56vw, 220px);
    min-height: 100%;
    padding: 26px 20px;
    border-right: 1px solid var(--site-border);
    overflow: hidden;
  }

  .site-sidebar__avatar {
    width: 128px;
    height: 128px;
  }

  .site-sidebar__avatar-link {
    width: 128px;
    height: 128px;
  }

  .site-sidebar__title {
    font-size: 20px;
  }
}
</style>
