<template>
  <section class="infra-view page-surface">
    <PageHeading class="infra-heading" title="Infra" description="Service endpoints monitoring and status overview." :icon="Cpu" />
      <div class="infra-orbit" :style="{ '--node-count': String(servicePoints.length) }">
        <div class="infra-core" aria-label="Infra status summary">
          <img class="infra-core__orbit" :src="orbitImg" alt="" />
          <img class="infra-core__sphere" :src="sphereImg" alt="" />
          <div class="infra-core__text">
            <p>{{ totalCount }} service endpoints</p>
            <div class="infra-core__counts">
              <span>{{ onlineCount }} online</span>
              <span class="infra-core__counts--offline">{{ offlineCount }} offline</span>
            </div>
          </div>
        </div>

        <div class="infra-ring">
          <span
            v-for="point in servicePoints"
            :key="'line-' + (point.item.key || point.item.name)"
            class="infra-line"
            :style="lineStyle(point)"
          />
          <a
            v-for="point in servicePoints"
            :key="point.item.key || point.item.name"
            class="infra-node"
            :class="statusClass(point.item.url)"
            :style="point.style"
            :href="point.item.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="infra-node__inner">
              <span class="infra-node__orb">
                <img class="infra-node__orb-ring" :src="rings[point.index % rings.length]" alt="" />
                <img :src="icoSrc(point.index)" class="infra-node__icon-img" alt="" />
              </span>
              <span class="infra-node__text">
                <strong>{{ point.item.name }}</strong>
                <small>{{ formatDate(point.item.date) }}</small>
                <em v-if="statusLabel(point.item.url)" :class="statusClass(point.item.url)">
                  {{ statusLabel(point.item.url) }}
                </em>
              </span>
            </span>
          </a>
        </div>
      </div>

      <div class="infra-mobile-list" aria-label="Infra endpoint list">
        <article v-for="item in serviceItems" :key="item.key || item.name" class="infra-mobile-item">
          <div class="infra-mobile-item__main">
            <el-icon class="infra-mobile-item__icon"><Link /></el-icon>
            <div class="infra-mobile-item__info">
              <div class="infra-mobile-item__topline">
                <h2>{{ item.name }}</h2>
                <time v-if="item.date" :datetime="item.date">{{ formatDate(item.date) }}</time>
              </div>
              <p v-if="statusLabel(item.url)" :class="statusClass(item.url)">
                {{ statusLabel(item.url) }}
              </p>
            </div>
          </div>
          <a :href="item.url" target="_blank" rel="noopener noreferrer">Open</a>
        </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { Link, Cpu } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { infra } from '../data/site/infra.ts'
import { useUrlStatus } from '../composables/useUrlStatus'
import sphereImg from '../assets/infra/qiu.png'
import orbitImg from '../assets/infra/y-bg.png'
import c1 from '../assets/infra/c1.png'
import c2 from '../assets/infra/c2.png'
import c3 from '../assets/infra/c3.png'
import c4 from '../assets/infra/c4.png'
import c5 from '../assets/infra/c5.png'
import c6 from '../assets/infra/c6.png'
import ico1 from '../assets/infra/ico1.png'
import ico2 from '../assets/infra/ico2.png'
import ico3 from '../assets/infra/ico3.png'
import ico4 from '../assets/infra/ico4.png'
import ico5 from '../assets/infra/ico5.png'
import ico6 from '../assets/infra/ico6.png'
const rings = [c1, c2, c3, c4, c5, c6]
const icons = [ico1, ico2, ico3, ico4, ico5, ico6]
const { statusMap, checkUrls } = useUrlStatus()
const STATUS_REFRESH_INTERVAL_MS = 60_000
let refreshTimer

const serviceItems = computed(() =>
  (infra.value || [])
    .slice()
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
)

const totalCount = computed(() => serviceItems.value.length)

const servicePoints = computed(() => {
  const items = serviceItems.value
  const count = Math.max(items.length, 1)
  const radius = count <= 6 ? 30 : count <= 10 ? 33 : 35

  return items.map((item, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return {
      item,
      index,
      angle,
      radius,
      style: {
        left: `${x}%`,
        top: `${y}%`,
      },
    }
  })
})

watch(
  serviceItems,
  (items) => {
    refreshStatuses(items, true)
  },
  { immediate: true }
)

onMounted(() => {
  refreshTimer = window.setInterval(() => {
    refreshStatuses(serviceItems.value, true)
  }, STATUS_REFRESH_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})

const onlineCount = computed(() => {
  return serviceItems.value.filter((item) => {
    const status = statusMap[item.url]?.status
    return status === 'online' || status === 'highLatency'
  }).length
})

const offlineCount = computed(() => {
  return serviceItems.value.filter((item) => {
    const status = statusMap[item.url]?.status
    return status && status !== 'checking' && status !== 'online' && status !== 'highLatency'
  }).length
})

function icoSrc(index) {
  return icons[index % icons.length]
}

function refreshStatuses(items, force = false) {
  const urls = items.map((item) => item.url).filter(Boolean)
  if (urls.length) checkUrls(urls, { force })
}

function lineStyle(point) {
  const ringGap = 3
  const ringEdge = 17 + ringGap
  const dist = point.radius - ringEdge
  return {
    left: point.style.left,
    top: point.style.top,
    width: `${Math.max(dist, 1)}%`,
    transform: `rotate(${point.angle + Math.PI}rad)`,
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function statusLabel(url) {
  const status = statusMap[url]
  if (!status || status.status === 'checking') return ''
  const label = status.status === 'highLatency' ? 'online' : status.status
  return status.latency != null ? `${label} ${status.latency}ms` : label
}

function statusClass(url) {
  const status = statusMap[url]?.status
  return status ? `is-${status}` : ''
}
</script>

<style scoped>
.infra-view {
  min-height: auto;
  padding: 0 0 8px;
  margin: -100px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.infra-orbit {
  position: relative;
  width: min(760px, 100%);
  aspect-ratio: 1;
  margin: 0 auto;
}

.infra-core {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 320px;
  height: 320px;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%);
}

.infra-core__orbit,
.infra-core__sphere {
  position: absolute;
  object-fit: contain;
  pointer-events: none;
}

.infra-core__orbit {
  width: 100%;
  height: 100%;
  opacity: 0.7;
  animation: core-orbit-spin 25s linear infinite;
}

.infra-core__sphere {
  width: 82%;
  height: 82%;
  filter: drop-shadow(0 0 24px rgba(31, 196, 31, 0.24));
  animation: core-sphere-spin 35s linear infinite;
}

.infra-core__text {
  position: relative;
  z-index: 1;
  text-align: center;
}

.infra-core__text p {
  margin: 0;
  color: var(--site-muted);
  font-weight: 800;
}

.infra-core__counts {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.infra-core__counts span {
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.1);
  font-size: 12px;
  font-weight: 800;
}

.infra-core__counts--offline {
  color: #ff7878 !important;
  background: rgba(255, 120, 120, 0.12) !important;
}

.infra-ring {
  position: absolute;
  inset: 0;
  animation: orbit-spin 1200s linear infinite;
}

.infra-line {
  position: absolute;
  height: 1px;
  pointer-events: none;
  transform-origin: 0 50%;
  background: linear-gradient(to right, rgba(31, 196, 31, 0.55), rgba(31, 196, 31, 0.12));
}

.infra-node {
  position: absolute;
  display: inline-flex;
  align-items: center;
  color: var(--site-text);
  text-decoration: none;
  transform: translate(-50%, -50%);
}

.infra-node__inner {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  animation: orbit-spin-reverse 1200s linear infinite;
}

.infra-node:hover .infra-node__inner,
.infra-node:focus-visible .infra-node__inner {
  color: var(--site-accent);
  filter: drop-shadow(0 0 18px rgba(31, 196, 31, 0.25));
  transform: scale(1.05);
  outline: none;
}

.infra-node.is-offline:hover .infra-node__inner,
.infra-node.is-offline:focus-visible .infra-node__inner,
.infra-node.is-error:hover .infra-node__inner,
.infra-node.is-error:focus-visible .infra-node__inner {
  color: #ff7878;
  filter: drop-shadow(0 0 18px rgba(255, 120, 120, 0.35));
}

.infra-node.is-timeout:hover .infra-node__inner,
.infra-node.is-timeout:focus-visible .infra-node__inner {
  color: #f0c040;
  filter: drop-shadow(0 0 18px rgba(240, 192, 64, 0.35));
}

.infra-node__orb {
  position: relative;
  flex: 0 0 50px;
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
}

.infra-node__orb-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: orb-spin 14s linear infinite;
}

:root[data-theme="light"] .infra-node__orb-ring {
  filter: invert(1);
}

:root[data-theme="light"] .infra-core__orbit {
  filter: invert(1);
  opacity: 0.3;
}

:root[data-theme="light"] .infra-core__sphere {
  filter: drop-shadow(0 0 24px rgba(31, 196, 31, 0.24)) invert(1);
}

:root[data-theme="light"] .infra-node__icon-img {
  filter: invert(25%) sepia(85%) saturate(2500%) hue-rotate(200deg) brightness(92%) contrast(95%);
}

:root[data-theme="light"] .infra-line {
  background: linear-gradient(to right, rgba(26, 158, 26, 0.7), rgba(26, 158, 26, 0.15));
}

.infra-node__icon-img {
  position: relative;
  width: 22px;
  height: 22px;
  object-fit: contain;
  transition: transform 350ms ease;
}

.infra-node:hover .infra-node__orb-ring {
  animation: orb-spin 2.5s linear infinite;
}

.infra-node:hover .infra-node__icon-img {
  transform: rotateY(180deg);
}

.infra-node__text {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.infra-node__text strong {
  font-size: 14px;
  line-height: 1.15;
  white-space: nowrap;
}

.infra-node__text small {
  color: var(--site-muted);
  font-size: 10px;
  white-space: nowrap;
}

.infra-node__text em {
  color: var(--site-accent);
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.infra-node__text em.is-offline,
.infra-node__text em.is-error {
  color: #ff7878;
}

.infra-node__text em.is-timeout {
  color: #f0c040;
}

@keyframes orb-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbit-spin-reverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes core-orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes core-sphere-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@media (max-width: 1180px) {
  .infra-orbit {
    width: min(690px, 100%);
  }

  .infra-node__inner {
    gap: 5px;
  }
}

.infra-heading {
  display: none;
}

.infra-mobile-list {
  display: none;
}

@media (max-width: 760px) {
  .infra-view {
    min-height: auto;
    margin: 0;
    padding: 0 0 40px;
    display: block;
  }

  .infra-heading {
    display: block;
  }

  .infra-orbit {
    display: none;
  }

  .infra-mobile-list {
    display: block;
    border-top: 1px solid var(--site-border);
  }
}

.infra-mobile-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  margin: 0 -22px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: default;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.infra-mobile-item:hover {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
}

.infra-mobile-item__main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.infra-mobile-item__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 3px;
  font-size: 20px;
  color: var(--site-muted);
}

.infra-mobile-item__info {
  min-width: 0;
  flex: 1;
}

.infra-mobile-item__topline {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.infra-mobile-item h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  line-height: 1.2;
  transition: color 160ms ease;
}

.infra-mobile-item:hover h2,
.infra-mobile-item:focus-within h2 {
  color: var(--site-accent);
}

.infra-mobile-item time {
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 800;
}

.infra-mobile-item p {
  margin: 4px 0 0;
  color: var(--site-accent);
  font-size: 13px;
  font-weight: 900;
}

.infra-mobile-item p.is-offline,
.infra-mobile-item p.is-error {
  color: #ff7878;
}

.infra-mobile-item p.is-timeout {
  color: #f0c040;
}

.infra-mobile-item > a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  font-weight: 800;
  text-decoration: none;
  transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.infra-mobile-item > a:hover,
.infra-mobile-item > a:focus-visible {
  color: var(--site-accent);
  border-color: rgba(31, 196, 31, 0.45);
  transform: translateY(-1px);
  text-decoration: none;
  outline: none;
}
</style>
