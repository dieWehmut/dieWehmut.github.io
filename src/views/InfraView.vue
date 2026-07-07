<template>
  <section class="infra-view page-surface" :class="{ 'has-outer-ring': hasOuterRing }">
    <PageHeading class="infra-heading" title="Infra" :icon="Cpu" />
      <div
        class="infra-orbit"
        :class="{ 'has-outer-ring': hasOuterRing }"
        :style="{
          '--node-count': String(servicePoints.length),
        }"
      >
        <div class="infra-core" aria-label="Infra status summary">
          <img class="infra-core__orbit" :src="orbitImg" alt="" />
          <img class="infra-core__sphere" :src="sphereImg" alt="" />
          <div class="infra-core__text">
            <p>{{ t('infra.summary.endpoints', { count: totalCount }) }}</p>
            <div class="infra-core__counts">
              <span>{{ t('infra.summary.online', { count: onlineCount }) }}</span>
              <span class="infra-core__counts--offline">{{ t('infra.summary.offline', { count: offlineCount }) }}</span>
            </div>
          </div>
        </div>

        <div class="infra-ring">
          <span
            v-for="point in servicePoints"
            :key="'line-' + (point.item.key || point.item.name)"
            class="infra-line"
            :class="`is-${point.ring}-ring`"
            :style="lineStyle(point)"
          />
          <component
            :is="point.item.url ? 'a' : 'span'"
            v-for="point in servicePoints"
            :key="point.item.key || point.item.name"
            class="infra-node"
            :class="[statusClass(point.item.url), `is-${point.ring}-ring`, { 'is-clickable': point.item.url }]"
            :style="point.style"
            :href="point.item.url || undefined"
            :target="point.item.url ? '_blank' : undefined"
            :rel="point.item.url ? 'noopener noreferrer' : undefined"
            :aria-disabled="point.item.url ? undefined : 'true'"
          >
            <span class="infra-node__inner">
              <span class="infra-node__orb">
                <img class="infra-node__orb-ring" :src="rings[point.index % rings.length]" alt="" />
                <span class="infra-node__icon-frame">
                  <img :src="infraIconSrc(point.item, point.index)" class="infra-node__icon-img" alt="" />
                </span>
              </span>
              <span class="infra-node__text">
                <strong>{{ point.item.name }}</strong>
                <time v-if="point.item.date" class="infra-node__date" :datetime="point.item.date">
                  <el-icon class="infra-node__date-icon"><Calendar /></el-icon>
                  {{ formatDate(point.item.date) }}
                </time>
                <em v-if="statusLabel(point.item.url)" :class="statusClass(point.item.url)">
                  {{ statusLabel(point.item.url) }}
                </em>
              </span>
            </span>
          </component>
        </div>
      </div>

      <div class="infra-mobile-list" aria-label="Infra endpoint list">
        <article
          v-for="item in serviceItems"
          :key="item.key || item.name"
          class="infra-mobile-item"
          :class="{ 'is-clickable': item.url }"
          :role="item.url ? 'link' : undefined"
          :tabindex="item.url ? 0 : undefined"
          @click="openInfra(item, $event)"
          @keydown.enter.prevent="openInfra(item, $event)"
          @keydown.space.prevent="openInfra(item, $event)"
        >
          <div class="infra-mobile-item__main">
            <span class="infra-mobile-item__icon">
              <span class="infra-mobile-item__icon-frame">
                <img :src="infraIconSrc(item)" class="infra-mobile-item__icon-img" alt="" />
              </span>
            </span>
            <div class="infra-mobile-item__info">
              <div class="infra-mobile-item__topline">
                <h2>{{ item.name }}</h2>
                <time v-if="item.date" class="infra-mobile-item__date" :datetime="item.date">
                  <el-icon class="infra-mobile-item__date-icon"><Calendar /></el-icon>
                  {{ formatDate(item.date) }}
                </time>
              </div>
              <p v-if="statusLabel(item.url)" :class="statusClass(item.url)">
                {{ statusLabel(item.url) }}
              </p>
            </div>
          </div>
          <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" @click.stop>Open</a>
        </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Cpu, Calendar } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { infra } from '../data/site/infra.ts'
import { useUrlStatus } from '../composables/useUrlStatus'
import { useKumaStatus } from '../composables/useKumaStatus'
const { t } = useI18n()
const infraIconModules = import.meta.glob(
  [
    '../assets/infra/coder.svg',
    '../assets/infra/codex-manager.png',
    '../assets/infra/coolify.svg',
    '../assets/infra/docker.svg',
    '../assets/infra/dsm.svg',
    '../assets/infra/gitea.svg',
    '../assets/infra/gitlab.svg',
    '../assets/infra/jenkins.svg',
    '../assets/infra/mirror.svg',
    '../assets/infra/navidrome.png',
    '../assets/infra/netdata.svg',
    '../assets/infra/netmaker.png',
    '../assets/infra/nextcloud.svg',
    '../assets/infra/nezha.svg',
    '../assets/infra/nginx-ui.png',
    '../assets/infra/nixos.svg',
    '../assets/infra/openlist.svg',
    '../assets/infra/openwrt.png',
    '../assets/infra/plex.svg',
    '../assets/infra/pve.svg',
    '../assets/infra/sandkasten.svg',
    '../assets/infra/sub2api.png',
    '../assets/infra/uptime-kuma.svg',
    '../assets/infra/vscode.png',
  ],
  {
    eager: true,
    import: 'default',
    query: '?url',
  }
)
const infraIconMap = Object.fromEntries(
  Object.entries(infraIconModules).map(([path, url]) => [path.split('/').pop(), url])
)
const infraAsset = (name) => `/capture-assets/infra/${name}`
const sphereImg = infraAsset('qiu.png')
const orbitImg = infraAsset('y-bg.png')
const c1 = infraAsset('c1.png')
const c2 = infraAsset('c2.png')
const c3 = infraAsset('c3.png')
const c4 = infraAsset('c4.png')
const c5 = infraAsset('c5.png')
const c6 = infraAsset('c6.png')
const rings = [c1, c2, c3, c4, c5, c6]
const STATUS_REFRESH_INTERVAL_MS = 60_000
const FULL_CIRCLE = Math.PI * 2
const INNER_RING_LIMIT = 8
const ORBIT_START_ANGLE = -Math.PI / 2
const INNER_RING_STEP = FULL_CIRCLE / INNER_RING_LIMIT
const OUTER_RING_GAP_OFFSET = INNER_RING_STEP / 2
const STACKED_INNER_RADIUS = 25
const OUTER_RING_RADIUS = 33
const OUTER_RING_HORIZONTAL_PUSH = 14
const OUTER_RING_VERTICAL_POLE_THRESHOLD = 0.98
let refreshTimer

const serviceItems = computed(() =>
  (infra.value || [])
    .slice()
    .sort((a, b) => (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0))
)

const kuma = useKumaStatus(serviceItems)
const fallback = useUrlStatus()
const mergedStatusMap = computed(() => {
  const out = {}
  for (const item of serviceItems.value) {
    const url = item.url
    if (!url) continue
    const fromKuma = kuma.statusMap[url]
    const fromFallback = fallback.statusMap[url]
    if (fromKuma) out[url] = fromKuma
    else if (fromFallback) out[url] = fromFallback
  }
  return out
})

const totalCount = computed(() => serviceItems.value.length)
const hasOuterRing = computed(() => totalCount.value > INNER_RING_LIMIT)

const servicePoints = computed(() => {
  const items = serviceItems.value
  const total = items.length
  const hasOuter = total > INNER_RING_LIMIT
  const innerCount = hasOuter ? INNER_RING_LIMIT : Math.max(total, 1)
  const innerRadius = hasOuter ? STACKED_INNER_RADIUS : total <= 6 ? 30 : 33
  const outerCount = Math.max(total - INNER_RING_LIMIT, 0)

  return items.map((item, index) => {
    const isOuter = hasOuter && index >= INNER_RING_LIMIT
    const ringIndex = isOuter ? index - INNER_RING_LIMIT : index
    const radius = isOuter ? OUTER_RING_RADIUS : innerRadius
    const angle = isOuter
      ? outerRingAngle(ringIndex, outerCount)
      : ORBIT_START_ANGLE + (ringIndex * FULL_CIRCLE) / innerCount
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const isVerticalOuterPoint = isOuter && Math.abs(sin) > OUTER_RING_VERTICAL_POLE_THRESHOLD
    const horizontalPush = isOuter && !isVerticalOuterPoint
      ? Math.sign(cos) * OUTER_RING_HORIZONTAL_PUSH
      : 0
    const dx = cos * radius + horizontalPush
    const dy = sin * radius
    const x = 50 + dx
    const y = 50 + dy
    return {
      item,
      index,
      ring: isOuter ? 'outer' : 'inner',
      angle: Math.atan2(dy, dx),
      radius: Math.sqrt(dx * dx + dy * dy),
      style: {
        left: `${x}%`,
        top: `${y}%`,
      },
    }
  })
})

function outerRingAngle(ringIndex, outerCount) {
  return ORBIT_START_ANGLE + OUTER_RING_GAP_OFFSET + (ringIndex * FULL_CIRCLE) / Math.max(outerCount, 1)
}

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
    kuma.refresh()
  }, STATUS_REFRESH_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})

const onlineCount = computed(() => {
  return serviceItems.value.filter((item) => normalizedStatus(item.url) === 'online').length
})

const offlineCount = computed(() => {
  return serviceItems.value.filter((item) => normalizedStatus(item.url) === 'offline').length
})

function infraIconSrc(item, index = 0) {
  return infraIconMap[item.icon] || infraIconMap[`${item.key}.svg`] || infraIconMap[`${item.key}.png`] || rings[index % rings.length]
}

function refreshStatuses(items, force = false) {
  const urls = items
    .map((item) => item.url)
    .filter((url) => url && !kuma.coveredUrls.has(url))
  if (urls.length) fallback.checkUrls(urls, { force })
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

function normalizedStatus(url) {
  if (!url) return ''
  const status = mergedStatusMap.value[url]?.status
  if (!status || status === 'checking') return ''
  return status === 'online' ? 'online' : 'offline'
}

function statusLabel(url) {
  const status = normalizedStatus(url)
  if (!status) return ''
  return status === 'online' ? 'Online' : 'Offline'
}

function statusClass(url) {
  const status = normalizedStatus(url)
  return status ? `is-${status}` : ''
}

function isInteractiveTarget(target) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button'))
}

function openInfra(item, event) {
  if (!item?.url || isInteractiveTarget(event?.target || null)) return
  window.open(item.url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.infra-view {
  min-height: auto;
  padding: 0 0 8px;
  margin: -18px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.infra-view.has-outer-ring {
  padding-bottom: 16px;
  margin-top: -18px;
}

.infra-orbit {
  --infra-scale: 0.84;
  --infra-core-size: calc(280px * var(--infra-scale));
  --infra-core-shadow: calc(24px * var(--infra-scale));
  --infra-core-text-size: calc(16px * var(--infra-scale));
  --infra-count-gap: calc(8px * var(--infra-scale));
  --infra-count-margin: calc(14px * var(--infra-scale));
  --infra-count-padding-y: calc(5px * var(--infra-scale));
  --infra-count-padding-x: calc(10px * var(--infra-scale));
  --infra-count-size: calc(12px * var(--infra-scale));
  --infra-node-size: calc(50px * var(--infra-scale));
  --infra-node-icon-size: calc(38px * var(--infra-scale));
  --infra-node-gap: calc(9px * var(--infra-scale));
  --infra-outer-node-gap: calc(7px * var(--infra-scale));
  --infra-title-size: calc(14px * var(--infra-scale));
  --infra-date-size: calc(12px * var(--infra-scale));
  --infra-date-icon-size: calc(12px * var(--infra-scale));
  --infra-status-size: calc(11px * var(--infra-scale));
  --infra-status-gap: calc(4px * var(--infra-scale));
  --infra-hover-shadow: calc(18px * var(--infra-scale));
  position: relative;
  width: min(calc(760px * var(--infra-scale)), 100%);
  aspect-ratio: 1;
  margin: 0 auto;
}

.infra-orbit.has-outer-ring {
  width: min(calc(840px * var(--infra-scale)), 100%);
}

.infra-core {
  position: absolute;
  inset: 50% auto auto 50%;
  width: var(--infra-core-size);
  height: var(--infra-core-size);
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
  filter: drop-shadow(0 0 var(--infra-core-shadow) rgba(31, 196, 31, 0.24));
  animation: core-sphere-spin 35s linear infinite;
}

.infra-core__text {
  position: relative;
  z-index: 1;
  text-align: center;
}

.infra-core__text p {
  margin: 0;
  color: var(--site-accent);
  font-size: var(--infra-core-text-size);
  font-weight: 800;
}

.infra-core__counts {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--infra-count-gap);
  margin-top: var(--infra-count-margin);
}

.infra-core__counts span {
  padding: var(--infra-count-padding-y) var(--infra-count-padding-x);
  border-radius: 999px;
  color: var(--site-accent);
  background: rgba(31, 196, 31, 0.1);
  font-size: var(--infra-count-size);
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
  display: block;
  width: 0;
  height: 0;
  overflow: visible;
  color: var(--site-text);
  text-decoration: none;
}

.infra-node.is-clickable {
  cursor: pointer;
}

.infra-node__inner {
  position: absolute;
  top: 0;
  left: calc(var(--infra-node-size) * -0.5);
  display: inline-flex;
  align-items: center;
  gap: var(--infra-node-gap);
  animation: orbit-spin-reverse 1200s linear infinite;
  transform: translateY(-50%) scale(var(--infra-node-scale, 1));
  transform-origin: calc(var(--infra-node-size) / 2) 50%;
}

.infra-node.is-outer-ring .infra-node__inner {
  gap: var(--infra-outer-node-gap);
}

.infra-node.is-clickable:hover .infra-node__inner,
.infra-node.is-clickable:focus-visible .infra-node__inner {
  color: var(--site-accent);
  filter: drop-shadow(0 0 var(--infra-hover-shadow) rgba(31, 196, 31, 0.25));
  --infra-node-scale: 1.05;
  outline: none;
}

.infra-node.is-clickable.is-offline:hover .infra-node__inner,
.infra-node.is-clickable.is-offline:focus-visible .infra-node__inner {
  color: #ff7878;
  filter: drop-shadow(0 0 var(--infra-hover-shadow) rgba(255, 120, 120, 0.35));
}

.infra-node__orb {
  position: relative;
  flex: 0 0 var(--infra-node-size);
  width: var(--infra-node-size);
  height: var(--infra-node-size);
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
  filter: drop-shadow(0 0 var(--infra-core-shadow) rgba(31, 196, 31, 0.24)) invert(1);
}

:root[data-theme="light"] .infra-line {
  background: linear-gradient(to right, rgba(26, 158, 26, 0.7), rgba(26, 158, 26, 0.15));
}

.infra-node__icon-frame {
  position: relative;
  z-index: 1;
  width: var(--infra-node-icon-size);
  height: var(--infra-node-icon-size);
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(3, 8, 10, 0.42);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

:root[data-theme="light"] .infra-node__icon-frame {
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.infra-node__icon-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.45));
  transition: transform 350ms ease;
}

:root[data-theme="light"] .infra-node__icon-img {
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.28));
}

.infra-node.is-clickable:hover .infra-node__orb-ring {
  animation: orb-spin 2.5s linear infinite;
}

.infra-node.is-clickable:hover .infra-node__icon-img {
  transform: rotateY(180deg);
}

.infra-node__text {
  min-width: 0;
  display: grid;
  gap: calc(3px * var(--infra-scale));
}

.infra-node__text strong {
  font-size: var(--infra-title-size);
  line-height: 1.15;
  white-space: nowrap;
}

.infra-node__date {
  display: inline-flex;
  align-items: center;
  gap: var(--infra-status-gap);
  color: var(--site-muted);
  font-size: var(--infra-date-size);
  font-weight: 800;
  white-space: nowrap;
}

.infra-node__date-icon {
  width: var(--infra-date-icon-size);
  height: var(--infra-date-icon-size);
  font-size: var(--infra-date-icon-size);
}

.infra-node__text em {
  color: var(--site-accent);
  font-size: var(--infra-status-size);
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.infra-node__text em.is-offline,
.infra-node__text em.is-error {
  color: #ff7878;
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
  from { transform: translateY(-50%) rotate(0deg) scale(var(--infra-node-scale, 1)); }
  to { transform: translateY(-50%) rotate(-360deg) scale(var(--infra-node-scale, 1)); }
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
    width: min(calc(690px * var(--infra-scale)), 100%);
  }

  .infra-orbit.has-outer-ring {
    width: min(calc(760px * var(--infra-scale)), 100%);
  }

  .infra-node__inner {
    gap: calc(5px * var(--infra-scale));
  }
}

@media (min-width: 761px) and (max-width: 980px) {
  .infra-orbit.has-outer-ring {
    --infra-node-size: calc(44px * var(--infra-scale));
    --infra-title-size: calc(13px * var(--infra-scale));
    --infra-date-size: calc(11px * var(--infra-scale));
    width: min(calc(680px * var(--infra-scale)), 100%);
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

  .infra-view.has-outer-ring {
    margin: 0;
    padding: 0 0 40px;
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
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.infra-mobile-item.is-clickable {
  cursor: pointer;
}

.infra-mobile-item.is-clickable:hover,
.infra-mobile-item.is-clickable:focus-visible {
  border-color: rgba(31, 196, 31, 0.45);
  background: rgba(31, 196, 31, 0.04);
  transform: translateY(-2px);
  outline: none;
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
  width: 32px;
  height: 32px;
  margin-top: 3px;
  display: grid;
  place-items: center;
}

.infra-mobile-item__icon-frame {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(3, 8, 10, 0.42);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

:root[data-theme="light"] .infra-mobile-item__icon-frame {
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.infra-mobile-item__icon-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.45));
}

:root[data-theme="light"] .infra-mobile-item__icon-img {
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.28));
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

.infra-mobile-item.is-clickable:hover h2,
.infra-mobile-item.is-clickable:focus-within h2 {
  color: var(--site-accent);
}

.infra-mobile-item__date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 800;
}

.infra-mobile-item__date-icon {
  width: 15px;
  height: 15px;
  font-size: 15px;
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
