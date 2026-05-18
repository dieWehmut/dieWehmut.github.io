<template>
  <div class="nav-buttons">
    <button
      v-for="item in navItems"
      :key="item.name"
      class="nav-btn"
      :class="{ active: isActive(item.name) }"
      @click="go(item.name)"
    >
      {{ t('nav.' + item.name) }}
    </button>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const navItems = [
  { name: 'services' },
  { name: 'pages' },
  { name: 'games' },
  { name: 'apps' },
  { name: 'files' },
  { name: 'tools' },
]

function isActive(name) {
  return route.path === '/' + name
}

function go(name) {
  router.push('/' + name).catch(() => {})
}
</script>

<style scoped>
.nav-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}
.nav-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.96);
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: visible;
  transition: background 180ms ease, color 180ms ease;
}
.nav-btn:active {
  transform: translateY(1px);
}
.nav-btn.active {
  background: linear-gradient(135deg, rgba(78,168,255,0.85), rgba(102,150,255,0.85));
  color: #fff;
}

/* pink glow for nav buttons on hover */
.nav-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  width: 160%;
  height: 120%;
  pointer-events: none;
  border-radius: 10px;
  background: radial-gradient(40% 40% at 20% 20%, rgba(255,160,200,0.18), transparent 20%), radial-gradient(30% 30% at 80% 80%, rgba(255,120,190,0.08), transparent 20%);
  filter: blur(10px) saturate(150%);
  opacity: 0;
  transition: opacity 220ms ease, transform 220ms ease;
}
.nav-btn:hover::after {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.04);
}
</style>
