<template>
  <div class="focus-view">
    <!-- Desktop: 3-column layout with elliptical card stagger -->
    <div class="focus-layout" :class="{ 'sphere-hovered': sphereHovered }">
      <!-- Left cards -->
      <div class="focus-col focus-left">
        <div
          v-for="(item, idx) in leftItems"
          :key="'l' + idx"
          class="focus-card"
          :class="'focus-card--l' + idx"
          :style="cardStyle(idx, leftItems.length, 'left')"
          @mouseenter="onCardEnter"
          @mouseleave="onCardLeave"
        >
          <!-- Connector dot -->
          <span class="focus-fd" :class="'focus-fd--l' + (idx % 3)"></span>
          <a
            class="focus-card__link"
            :href="getUrl(item)"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="openItem(item)"
          >
            <div class="focus-card__ico">
              <img :src="rings[idx % 6]" alt="" class="focus-card__ring" />
              <img :src="icons[idx % 6]" alt="" class="focus-card__icon" />
            </div>
            <div class="focus-card__text">
              <h3 class="focus-card__title">
                {{ item.displayName || item.name || item.tag_name || '—' }}
                <span
                  class="focus-status"
                  :class="statusClass(getUrl(item))"
                  v-if="statusLabel(getUrl(item))"
                >{{ statusLabel(getUrl(item)) }}</span>
              </h3>
              <p class="focus-card__desc">{{ getDescription(item) }}</p>
              <span class="focus-card__date" v-if="getDate(item)">
                <svg class="focus-card__date-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                {{ getDate(item) }}
              </span>
            </div>
          </a>
        </div>
      </div>

      <!-- Center sphere -->
      <div class="focus-center">
        <div class="focus-sphere" @mouseenter="sphereHovered = true" @mouseleave="sphereHovered = false">
          <img :src="yBgImg" alt="" class="focus-sphere__orbit" />
          <img :src="sphereImg" alt="" class="focus-sphere__ball" />
          <div class="focus-sphere__label">
            <h2 class="focus-section-title">{{ t('nav.' + section) }}</h2>
            <div class="focus-sphere__counts">
              <span class="focus-count focus-count--total">{{ t('common.totalFormat', { count: totalCount }) }}</span>
              <template v-if="accessibleCount">
                <span class="focus-count focus-count--online">{{ t('status.online') }}: {{ accessibleCount.online }}</span>
                <span class="focus-count focus-count--off">{{ t('status.offline') }}: {{ accessibleCount.unreachable }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Right cards (mirrored: text then icon) -->
      <div class="focus-col focus-right">
        <div
          v-for="(item, idx) in rightItems"
          :key="'r' + idx"
          class="focus-card"
          :class="'focus-card--r' + idx"
          :style="cardStyle(idx, rightItems.length, 'right')"
          @mouseenter="onCardEnter"
          @mouseleave="onCardLeave"
        >
          <!-- Connector dot -->
          <span class="focus-fd focus-fd--right" :class="'focus-fd--r' + (idx % 3)"></span>
          <a
            class="focus-card__link"
            :href="getUrl(item)"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="openItem(item)"
          >
            <div class="focus-card__text">
              <h3 class="focus-card__title">
                {{ item.displayName || item.name || item.tag_name || '—' }}
                <span
                  class="focus-status"
                  :class="statusClass(getUrl(item))"
                  v-if="statusLabel(getUrl(item))"
                >{{ statusLabel(getUrl(item)) }}</span>
              </h3>
              <p class="focus-card__desc">{{ getDescription(item) }}</p>
              <span class="focus-card__date" v-if="getDate(item)">
                <svg class="focus-card__date-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                {{ getDate(item) }}
              </span>
            </div>
            <div class="focus-card__ico">
              <img :src="rings[(leftItems.length + idx) % 6]" alt="" class="focus-card__ring" />
              <img :src="icons[(leftItems.length + idx) % 6]" alt="" class="focus-card__icon" />
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- Mobile: single column, NO sphere -->
    <div class="focus-mobile">
      <div
        v-for="(item, idx) in allItems"
        :key="'m' + idx"
        class="focus-card focus-card--m"
      >
        <a
          class="focus-card__link"
          :href="getUrl(item)"
          target="_blank"
          rel="noopener noreferrer"
          @click.prevent="openItem(item)"
        >
          <div class="focus-card__ico focus-card__ico--m">
            <img :src="rings[idx % 6]" alt="" class="focus-card__ring" />
            <img :src="icons[idx % 6]" alt="" class="focus-card__icon" />
          </div>
          <div class="focus-card__text">
            <h3 class="focus-card__title">
              {{ item.displayName || item.name || item.tag_name || '—' }}
              <span
                class="focus-status"
                :class="statusClass(getUrl(item))"
                v-if="statusLabel(getUrl(item))"
              >{{ statusLabel(getUrl(item)) }}</span>
            </h3>
            <p class="focus-card__desc">{{ getDescription(item) }}</p>
            <span class="focus-card__date" v-if="getDate(item)">
              <svg class="focus-card__date-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              {{ getDate(item) }}
            </span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useContent } from '../data/content'
import { useUrlStatus } from '../composables/useUrlStatus'

import sphereImg from '../assets/focus/qiu.png'
import yBgImg from '../assets/focus/y-bg.png'
import c1 from '../assets/focus/c1.png'
import c2 from '../assets/focus/c2.png'
import c3 from '../assets/focus/c3.png'
import c4 from '../assets/focus/c4.png'
import c5 from '../assets/focus/c5.png'
import c6 from '../assets/focus/c6.png'
import ico1 from '../assets/focus/ico1.png'
import ico2 from '../assets/focus/ico2.png'
import ico3 from '../assets/focus/ico3.png'
import ico4 from '../assets/focus/ico4.png'
import ico5 from '../assets/focus/ico5.png'
import ico6 from '../assets/focus/ico6.png'

const rings = [c1, c2, c3, c4, c5, c6]
const icons = [ico1, ico2, ico3, ico4, ico5, ico6]

const sphereHovered = ref(false)

function onCardEnter(e) { e.currentTarget.classList.add('card-hovered') }
function onCardLeave(e) { e.currentTarget.classList.remove('card-hovered') }

const props = defineProps({
  section: { type: String, default: 'services' },
  query: { type: String, default: '' },
})

const { t } = useI18n()
const { services, pages, games, apps, files, tools } = useContent()
const { statusMap, checkUrls } = useUrlStatus()
const router = useRouter()
const route = useRoute()

const allSections = ['services', 'pages', 'games', 'apps', 'files', 'tools']

function listFor(section) {
  switch (section) {
    case 'services': return services.value || []
    case 'pages': return pages.value || []
    case 'games': return (games.value || []).flatMap(g => g.manualItems || [])
    case 'apps': return (apps.value || []).flatMap(a => a.manualItems || [])
    case 'files': return files.value || []
    case 'tools': return (tools.value || []).flatMap(t => t.manualItems || [])
  }
  return []
}

const normalizedQuery = computed(() => (props.query || '').trim().toLowerCase())

const allItems = computed(() => {
  const raw = listFor(props.section).slice()
  const arr = raw.map(i => ({
    ...i,
    date: i.date || i.lastModified || (i.versions && i.versions[0] && i.versions[0].date),
  }))
  arr.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))

  const q = normalizedQuery.value
  if (!q) return arr
  return arr.filter(item => {
    const name = (item.displayName || item.name || '').toLowerCase()
    const url = (item.url || item.repoUrl || '').toLowerCase()
    return name.includes(q) || url.includes(q)
  })
})

// ── Global search: auto-navigate to matching section ──
function checkSectionMatches(section, q) {
  const raw = listFor(section)
  return raw.some(item => {
    const name = (item.displayName || item.name || '').toLowerCase()
    const url = (item.url || item.repoUrl || '').toLowerCase()
    return name.includes(q) || url.includes(q)
  })
}

watch(normalizedQuery, (q) => {
  if (!q) return
  // If current section already has matches, stay put
  if (allItems.value.length > 0) return
  // Check other sections for matches
  for (const sec of allSections) {
    if (sec === props.section) continue
    if (checkSectionMatches(sec, q)) {
      router.replace('/' + sec).catch(() => {})
      return
    }
  }
})

// ── URL status checking (only for services & pages) ──
watch(allItems, (items) => {
  if (props.section !== 'services' && props.section !== 'pages') return
  const urls = items.map(i => getUrl(i)).filter(u => u && u !== '#')
  if (urls.length) checkUrls(urls)
}, { immediate: true })

function statusLabel(url) {
  if (!url || url === '#') return ''
  const s = statusMap[url]
  if (!s || s.status === 'checking') return ''
  const label = t('status.' + s.status)
  if (s.latency != null) return `${label} (${s.latency} ms)`
  return label
}

function statusClass(url) {
  if (!url || url === '#') return ''
  const s = statusMap[url]
  return s ? 'st-' + s.status : ''
}

// ── Center counts ──
const totalCount = computed(() => allItems.value.length)

const accessibleCount = computed(() => {
  if (props.section !== 'services' && props.section !== 'pages') return null
  let online = 0
  let unreachable = 0
  for (const item of allItems.value) {
    const url = getUrl(item)
    if (!url || url === '#') continue
    const s = statusMap[url]
    if (!s || s.status === 'checking') continue
    if (s.status === 'online' || s.status === 'highLatency') online++
    else unreachable++
  }
  return { online, unreachable }
})

const leftItems = computed(() => {
  const half = Math.ceil(allItems.value.length / 2)
  return allItems.value.slice(0, half)
})

const rightItems = computed(() => {
  const half = Math.ceil(allItems.value.length / 2)
  return allItems.value.slice(half)
})

function cardStyle(idx, total, side) {
  if (total <= 1) return { '--card-idx': idx, '--delay': idx * 80 + 'ms', '--line-angle': '0deg' }
  const t = total === 1 ? 0.5 : idx / (total - 1)
  // Top cards pushed outward more, middle cards slightly inward — inverted ellipse feel
  const offset = Math.sin(t * Math.PI) * 30
  const ml = side === 'left' ? `${offset}px` : '0'
  const mr = side === 'right' ? `${offset}px` : '0'
  // Angle lines toward center: top cards angle down, bottom cards angle up
  const maxAngle = 35
  const angle = (t - 0.5) * maxAngle * (side === 'left' ? -1 : 1)
  return {
    '--card-idx': idx,
    '--delay': idx * 30 + 'ms',
    '--line-angle': `${angle.toFixed(1)}deg`,
    marginLeft: ml,
    marginRight: mr,
  }
}

function getUrl(item) {
  return item.url || item.repoUrl || item.html_url || item.repo_url || '#'
}

function getDescription(item) {
  if (item.description) return item.description
  return ''
}

function getDate(item) {
  const d = item.date || item.lastModified || (item.versions && item.versions[0] && item.versions[0].date)
  if (!d) return ''
  try {
    const dt = new Date(d)
    if (isNaN(dt.valueOf())) return ''
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  } catch { return '' }
}

function openItem(item) {
  const url = getUrl(item)
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener')
  }
}

// Scrolling is prevented via CSS overflow:hidden on html.view-mode body
// No JS wheel listener needed — removing it improves scroll performance
</script>

<style scoped>
/* ═══════════════════════════════════════════
   Desktop layout — fit in viewport, no scroll
   ═══════════════════════════════════════════ */
.focus-view {
  width: 100%;
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
}

.focus-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
}

.focus-mobile { display: none; }

/* ── Columns ── */
.focus-col {
  flex: 0 0 34%;
  max-width: 34%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Center sphere with orbit overlay ── */
.focus-center {
  flex: 0 0 32%;
  max-width: 32%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

.focus-sphere {
  width: 100%;
  max-width: 300px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 8, 22, 0.5);
  border-radius: 50%;
  aspect-ratio: 1 / 1;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(40, 255, 252, 0.4);
  box-shadow:
    0 0 40px rgba(40, 255, 252, 0.2),
    0 0 80px rgba(40, 255, 252, 0.12),
    0 0 120px rgba(167, 139, 250, 0.1),
    inset 0 0 60px rgba(40, 255, 252, 0.08);
  transform: scale(1.06);
  transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease, border-color 0.35s ease;
}

.focus-sphere:hover {
  transform: scale(1.12);
  border-color: rgba(16, 230, 120, 0.8);
  box-shadow:
    0 0 30px rgba(16, 230, 120, 0.45),
    0 0 70px rgba(16, 230, 120, 0.3),
    0 0 120px rgba(16, 230, 120, 0.18),
    0 0 200px rgba(40, 255, 252, 0.12),
    inset 0 0 80px rgba(16, 230, 120, 0.15);
}

.focus-sphere:hover .focus-sphere__orbit {
  filter: drop-shadow(0 0 20px rgba(16, 230, 120, 0.65));
}

.focus-sphere:hover .focus-sphere__ball {
  filter: drop-shadow(0 0 100px rgba(16, 230, 120, 0.9)) drop-shadow(0 0 40px rgba(16, 230, 120, 0.6));
}

/* ── When hovering center sphere, all connector dots light up instantly ── */
.focus-layout.sphere-hovered .focus-fd {
  box-shadow: 0 0 16px currentColor, 0 0 32px currentColor;
  transition: box-shadow 0.15s ease-out;
}
.focus-layout.sphere-hovered .focus-fd::before {
  opacity: 0.9;
  width: 260px;
  transition: opacity 0.15s ease-out, width 0.15s ease-out;
}
.focus-layout.sphere-hovered .focus-fd::after {
  opacity: 0.9;
  animation-duration: 1s;
}

.focus-sphere__ball {
  width: 70%;
  height: auto;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 80px rgba(40, 255, 252, 0.7)) drop-shadow(0 0 30px rgba(40, 255, 252, 0.5));
  animation: sphereSpin 20s linear infinite;
  transition: filter 0.35s ease;
}

.focus-sphere__orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  object-fit: contain;
  animation: orbitSpin 25s linear infinite;
  z-index: 0;
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(40, 255, 252, 0.3));
  transition: opacity 0.4s ease, filter 0.4s ease;
}

@keyframes sphereSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbitSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.focus-sphere__label {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.focus-section-title {
  margin: 0;
  font-size: 32px;
  font-weight: 950;
  letter-spacing: 5px;
  text-align: center;
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff, #c8f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 16px rgba(40, 255, 252, 0.8)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
  text-shadow: none;
}

.focus-sphere__counts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.focus-count {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
}

.focus-count--total {
  color: rgba(255, 255, 255, 0.9);
}

.focus-count--online {
  color: #4ade80;
}

.focus-count--off {
  color: #f87171;
}

/* ═══════════════════════════════════════════
   Connector dots (fd elements from sample)
   ═══════════════════════════════════════════ */
.focus-fd {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(40, 255, 252);
  z-index: 2;
  pointer-events: none;
}

/* Connector line from dot toward center sphere */
.focus-fd::before {
  content: '';
  position: absolute;
  top: 50%;
  height: 1px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
}

/* Left side connectors: line angles from dot toward center ring */
.focus-left .focus-fd::before {
  left: 100%;
  top: 50%;
  width: 220px;
  height: 1px;
  transform-origin: 0% 50%;
  transform: translateY(-50%) rotate(var(--line-angle, 0deg));
  background: linear-gradient(to right, currentColor, currentColor 70%, rgba(40, 255, 252, 0.3) 90%, transparent);
  transition: opacity 0.3s ease, width 0.3s ease, transform 0.3s ease;
}

/* Right side connectors: line angles from dot toward center ring */
.focus-right .focus-fd::before {
  right: 100%;
  top: 50%;
  width: 220px;
  height: 1px;
  transform-origin: 100% 50%;
  transform: translateY(-50%) rotate(var(--line-angle, 0deg));
  background: linear-gradient(to left, currentColor, currentColor 70%, rgba(40, 255, 252, 0.3) 90%, transparent);
  transition: opacity 0.3s ease, width 0.3s ease, transform 0.3s ease;
}

/* Hover: connector line deepens, brightens, and stretches */
.focus-card.card-hovered .focus-fd::before {
  opacity: 0.9;
  width: 260px;
}
.focus-card.card-hovered .focus-fd {
  box-shadow: 0 0 16px currentColor, 0 0 32px currentColor;
}
.focus-card.card-hovered .focus-fd::after {
  opacity: 0.9;
  animation-duration: 1.2s;
}

.focus-fd::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  margin: -8px 0 0 -8px;
  opacity: 0.5;
  background: rgb(40, 255, 252);
  animation: fdPulse 3s ease-in-out infinite;
  z-index: 1;
}

/* Left side connector dots — positioned to the right of the card */
.focus-fd--l0 { right: -16px; top: 50%; background: rgb(40, 255, 252); }
.focus-fd--l0::after { background: rgb(40, 255, 252); }
.focus-fd--l1 { right: -20px; top: 40%; background: rgb(176, 115, 241); }
.focus-fd--l1::after { background: rgb(176, 115, 241); }
.focus-fd--l2 { right: -18px; top: 55%; background: rgb(170, 233, 157); }
.focus-fd--l2::after { background: rgb(170, 233, 157); }

/* Right side connector dots — positioned to the left of the card */
.focus-fd--right { left: -16px; right: auto; }
.focus-fd--r0 { left: -16px; top: 50%; background: rgb(38, 205, 154); }
.focus-fd--r0::after { background: rgb(38, 205, 154); }
.focus-fd--r1 { left: -20px; top: 40%; background: rgb(92, 190, 236); }
.focus-fd--r1::after { background: rgb(92, 190, 236); }
.focus-fd--r2 { left: -18px; top: 55%; background: rgb(248, 196, 128); }
.focus-fd--r2::after { background: rgb(248, 196, 128); }

@keyframes fdPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.6); opacity: 0.15; }
}

/* ═══════════════════════════════════════════
   Card — tight glass cards with ring/icon combo
   ═══════════════════════════════════════════ */
.focus-card {
  position: relative;
  padding: 3px 0;
  animation: cardSlideIn 0.28s ease both;
  animation-delay: var(--delay, 0ms);
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.focus-card__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  background: rgba(4, 8, 22, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.focus-card__link:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 0 24px rgba(40, 255, 252, 0.15),
    0 12px 36px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  background: rgba(4, 8, 22, 0.96);
  border-color: rgba(40, 255, 252, 0.3);
}

/* ── Icon: ring + content icon layered ── */
.focus-card__ico {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 600px;
}

.focus-card__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: ringSpin 14s linear infinite;
  animation-delay: calc(var(--card-idx, 0) * -2s);
  transition: animation-duration 0.5s ease;
}

/* Hover: ring spins faster (like sample's play2 animation) */
.focus-card__link:hover .focus-card__ring {
  animation-duration: 4s;
}

.focus-card__icon {
  position: relative;
  width: 40px;
  height: 40px;
  object-fit: contain;
  z-index: 1;
  filter: drop-shadow(0 0 6px rgba(40, 255, 252, 0.3));
  transition: transform 0.5s ease;
}

/* Hover flip animation (like sample's rotateY(360deg)) */
.focus-card__link:hover .focus-card__icon {
  transform: rotateY(360deg);
}

@keyframes ringSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── Text — brighter colors ── */
.focus-card__text {
  flex: 1;
  min-width: 0;
}

.focus-card__title {
  font-size: 20px;
  font-weight: 950;
  margin: 0 0 3px 0;
  line-height: 1.3;
  background: linear-gradient(135deg, #e0e0e0, #5df0d0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba(40, 200, 200, 0.5));
}

.focus-card__desc {
  font-size: 15px;
  font-weight: 700;
  color: #d0d0d0 !important;
  text-shadow: 0 0 8px rgba(200, 200, 200, 0.3), 0 1px 3px rgba(0, 0, 0, 0.5);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.focus-card__date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 13px;
  color: rgba(200, 200, 200, 0.9);
  font-weight: 700;
}

.focus-card__date-icon {
  flex-shrink: 0;
  opacity: 0.75;
}

/* ── Left column: icon LEFT, text RIGHT ── */
.focus-left .focus-card__link {
  flex-direction: row;
}
.focus-left .focus-card__text {
  text-align: left;
}

/* ── Right column: text LEFT, icon RIGHT ── */
.focus-right .focus-card__link {
  flex-direction: row;
}
.focus-right .focus-card__text {
  text-align: right;
}
.focus-right .focus-card__title {
  background: linear-gradient(135deg, #e0e0e0, #f0a0c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.5));
}

/* ═══════════════════════════════════════════
   Mobile (< 1000px) — no sphere, proper layout
   ═══════════════════════════════════════════ */
@media (max-width: 1000px) {
  .focus-view {
    min-height: auto;
    padding: 8px 0;
    align-items: flex-start;
    overflow: auto;
  }
  .focus-layout { display: none; }

  .focus-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0 12px;
    gap: 4px;
  }

  .focus-card--m {
    width: 100%;
    padding: 2px 0;
    animation: none;
  }

  .focus-card--m .focus-card__link {
    flex-direction: row !important;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(4, 8, 22, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .focus-card__ico--m {
    width: 48px;
    height: 48px;
  }
  .focus-card__ico--m .focus-card__icon {
    width: 28px;
    height: 28px;
  }

  .focus-card--m .focus-card__text {
    text-align: left !important;
  }
  .focus-card--m .focus-card__title {
    font-size: 17px;
    font-weight: 950;
    background: linear-gradient(135deg, #e0e0e0, #5df0d0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 6px rgba(40, 200, 200, 0.5));
  }
  .focus-card--m .focus-card__desc {
    font-size: 14px;
    font-weight: 700;
    color: #d0d0d0 !important;
    text-shadow: 0 0 6px rgba(200, 200, 200, 0.25);
    -webkit-line-clamp: 2;
  }

  /* Hide connector dots on mobile */
  .focus-fd { display: none; }
}

/* ═══════════════════════════════════════════
   URL Status badges
   ═══════════════════════════════════════════ */
.focus-status {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
  vertical-align: middle;
  line-height: 1.6;
  white-space: nowrap;
  -webkit-text-fill-color: currentColor;
}

/* Online — green */
.st-online {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.25);
}

/* High latency — yellow/amber */
.st-highLatency {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.25);
}

/* Timeout — orange */
.st-timeout {
  color: #fb923c;
  background: rgba(251, 146, 60, 0.12);
  border: 1px solid rgba(251, 146, 60, 0.25);
}

/* Unreachable — red */
.st-unreachable {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.25);
}

/* Offline — gray/red */
.st-offline {
  color: #9ca3af;
  background: rgba(156, 163, 175, 0.12);
  border: 1px solid rgba(156, 163, 175, 0.25);
}

@media (max-width: 1000px) {
  .focus-status {
    font-size: 9px;
    padding: 1px 5px;
    margin-left: 4px;
  }
}

/* Tablet tweaks */
@media (min-width: 1001px) and (max-width: 1300px) {
  .focus-card__ico {
    width: 60px;
    height: 60px;
  }
  .focus-card__icon {
    width: 34px;
    height: 34px;
  }
  .focus-card__title {
    font-size: 15px;
  }
  .focus-card__desc {
    font-size: 12px;
    -webkit-line-clamp: 2;
  }
  .focus-card__link {
    padding: 8px 10px;
    gap: 8px;
  }
  .focus-card {
    padding: 2px 0;
  }
}
</style>
