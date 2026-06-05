<template>
  <section class="capture-view page-surface" :class="{ 'capture-view--detail': isDetailRoute }">
    <div class="capture-view__main">
      <template v-if="selectedGroup">
        <div class="capture-detail__topbar">
          <button
            class="capture-detail__back"
            type="button"
            aria-label="Back"
            title="Back"
            @click="backToCapture"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
        </div>

        <article class="capture-detail">
          <div class="capture-detail__grid">
            <figure
              v-for="asset in selectedGroup.assets"
              :key="asset.id"
              class="capture-detail__figure"
            >
              <button
                class="capture-detail__media"
                type="button"
                @click="openAsset(asset)"
              >
                <img
                  :src="asset.image"
                  :alt="asset.title || ''"
                  loading="eager"
                  decoding="async"
                />
              </button>
            </figure>
          </div>

          <div class="capture-detail__body">
            <div class="capture-detail__meta-row">
              <time v-if="selectedGroup.date" :datetime="selectedGroup.date">
                <el-icon class="capture-card__meta-icon"><Calendar /></el-icon>
                {{ formatDateOnly(selectedGroup.date) }}
              </time>
              <RouterLink
                v-for="tag in selectedGroup.tags"
                :key="tag"
                class="capture-card__tag"
                :to="`/tags/${encodeURIComponent(tag)}`"
              >
                <el-icon class="capture-card__tag-icon"><PriceTag /></el-icon>
                {{ tag }}
              </RouterLink>
            </div>

            <div v-if="selectedGroup.sources.length" class="capture-group__sources">
              <RouterLink
                v-for="source in selectedGroup.sources"
                :key="`${source.type}:${source.id}`"
                class="capture-group__source"
                :to="source.url"
              >
                {{ source.title }}
              </RouterLink>
            </div>

            <GiscusComments layout="inline" source="capture" :term="selectedCommentTerm" />
          </div>
        </article>
      </template>

      <template v-else-if="isDetailRoute">
        <div class="capture-detail__topbar">
          <button
            class="capture-detail__back"
            type="button"
            aria-label="Back"
            title="Back"
            @click="backToCapture"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
        </div>
        <PageHeading :title="t('capture.title')" :icon="Camera" />
        <div class="capture-empty">
          <span>{{ t('capture.empty') }}</span>
        </div>
      </template>

      <template v-else>
        <PageHeading
          :title="t('capture.title')"
          :icon="Camera"
        />
        <div v-if="canEdit" class="capture-editor">
          <div class="capture-editor__status">
            <span>{{ t('capture.editor') }}</span>
            <strong>{{ editorStatusText }}</strong>
          </div>
          <input
            ref="uploadInput"
            class="capture-editor__file"
            type="file"
            accept="image/*"
            @change="onUploadFileChange"
          />
        </div>

        <div v-if="yearGroups.length" class="capture-timeline">
          <section v-for="year in yearGroups" :key="year.id" class="capture-year">
            <h2 :id="year.id" class="capture-time-heading capture-time-heading--year">
              {{ year.label }}
            </h2>

            <section v-for="month in year.months" :key="month.id" class="capture-month">
              <h3 :id="month.id" class="capture-time-heading capture-time-heading--month">
                {{ month.label }}
              </h3>

              <div class="capture-groups">
                <article
                  v-for="group in month.groups"
                  :key="group.id"
                  class="capture-group"
                >
                  <div class="capture-grid">
                    <div
                      v-for="asset in group.assets"
                      :key="asset.id"
                      class="capture-card"
                    >
                      <button
                        class="capture-card__media"
                        type="button"
                        @click="openAsset(asset)"
                      >
                        <img
                          v-lazy-src="asset.image"
                          :src="placeholderImage"
                          :alt="asset.title || ''"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                      <button
                        v-if="canEdit"
                        class="capture-card__delete"
                        type="button"
                        :aria-label="t('capture.deleteImage')"
                        :title="t('capture.deleteImage')"
                        :disabled="editorBusy"
                        @click="deleteCapture(asset)"
                      >
                        <el-icon><Delete /></el-icon>
                      </button>
                    </div>
                    <button
                      v-if="canEdit"
                      class="capture-card capture-card--add"
                      type="button"
                      :aria-label="t('capture.uploadImage')"
                      :title="t('capture.uploadImage')"
                      :disabled="editorBusy"
                      @click="selectUploadGroup(group)"
                    >
                      <el-icon><Plus /></el-icon>
                    </button>
                  </div>

                  <div class="capture-group__body">
                    <div class="capture-card__meta-row">
                      <time v-if="group.date" :datetime="group.date">
                        <el-icon class="capture-card__meta-icon"><Calendar /></el-icon>
                        {{ formatDateOnly(group.date) }}
                      </time>
                      <RouterLink
                        v-for="tag in group.tags"
                        :key="tag"
                        class="capture-card__tag"
                        :to="`/tags/${encodeURIComponent(tag)}`"
                      >
                        <el-icon class="capture-card__tag-icon"><PriceTag /></el-icon>
                        {{ tag }}
                      </RouterLink>
                      <RouterLink
                        class="capture-card__comments"
                        :to="`/capture/${encodeURIComponent(group.id)}`"
                        aria-label="Comments"
                        title="Comments"
                        @click="saveCaptureScrollPosition"
                      >
                        <el-icon><ChatRound /></el-icon>
                      </RouterLink>
                    </div>

                    <div v-if="group.sources.length" class="capture-group__sources">
                      <RouterLink
                        v-for="source in group.sources"
                        :key="`${source.type}:${source.id}`"
                        class="capture-group__source"
                        :to="source.url"
                      >
                        {{ source.title }}
                      </RouterLink>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </section>
        </div>

        <div v-else class="capture-empty">
          <span>{{ t('capture.empty') }}</span>
          <button
            v-if="canEdit"
            class="capture-empty__upload"
            type="button"
            :aria-label="t('capture.uploadImage')"
            :title="t('capture.uploadImage')"
            :disabled="editorBusy"
            @click="selectEmptyUploadGroup"
          >
            <el-icon><Plus /></el-icon>
          </button>
        </div>
      </template>
    </div>

    <ScrollSpySidebar
      v-if="!isDetailRoute"
      :key="scrollSpyKey"
      root-selector=".capture-view__main"
      heading-selector=".capture-time-heading"
    />

    <Teleport to="body">
      <Transition name="capture-delete-dialog">
        <div
          v-if="deleteTarget"
          class="capture-delete-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="t('capture.deleteDialogTitle')"
          @click.self="cancelDeleteCapture"
        >
          <div class="capture-delete-dialog__panel">
            <h2>{{ t('capture.deleteDialogTitle') }}</h2>
            <p>{{ t('capture.confirmDelete', { title: deleteTargetLabel }) }}</p>
            <div class="capture-delete-dialog__actions">
              <button
                class="capture-delete-dialog__button capture-delete-dialog__button--ghost"
                type="button"
                :disabled="editorBusy"
                @click="cancelDeleteCapture"
              >
                {{ t('capture.cancelDelete') }}
              </button>
              <button
                class="capture-delete-dialog__button capture-delete-dialog__button--danger"
                type="button"
                :disabled="editorBusy"
                @click="confirmDeleteCapture"
              >
                {{ t('capture.confirmDeleteAction') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Directive } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Camera, ChatRound, Delete, Plus, PriceTag } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import GiscusComments from '../components/system/GiscusComments.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { getCaptureAssets, normalizeCaptureAssets } from '../data/capture'
import type { CaptureAsset, CaptureSourceRef } from '../types/content'
import { formatTimelineDate, parseTimelineDate } from '../utils/date'
import { openImagePreviewGallery } from '../utils/imagePreview'

const placeholderImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const isDev = import.meta.env.DEV
const captureScrollStorageKey = 'nexus:capture-scroll-y'

const allAssets = ref<CaptureAsset[]>(getCaptureAssets())
const captureGroups = computed(() => groupCaptureAssets(allAssets.value))
const yearGroups = computed(() => groupByYearAndMonth(captureGroups.value))
const route = useRoute()
const router = useRouter()
const selectedGroupId = computed(() => String(route.params.id || ''))
const isDetailRoute = computed(() => selectedGroupId.value.length > 0)
const selectedGroup = computed(() =>
  selectedGroupId.value ? findCaptureGroupByRouteId(decodeURIComponent(selectedGroupId.value)) : null
)
const selectedCommentTerm = computed(() => selectedGroup.value ? `capture-group:${selectedGroup.value.id}` : '')
const scrollSpyKey = computed(() =>
  yearGroups.value
    .map((year) => `${year.id}:${year.months.map((month) => `${month.id}:${month.groups.length}`).join(',')}`)
    .join('|')
)
const { locale, t } = useI18n()
const editorAuth = ref<CaptureEditorAuth | null>(null)
const editorBusy = ref(false)
const uploadInput = ref<HTMLInputElement | null>(null)
const pendingUploadGroup = ref<CaptureGroup | null>(null)
const deleteTarget = ref<CaptureAsset | null>(null)
const canEdit = computed(() => isDev && editorAuth.value?.authorized === true)
const deleteTargetLabel = computed(() => deleteTarget.value?.title || deleteTarget.value?.id || '')
const editorStatusText = computed(() => {
  if (!isDev) return t('capture.editorDisabled')
  if (!editorAuth.value) return t('status.checking')
  if (editorAuth.value.authorized) return editorAuth.value.login || t('capture.localDev')
  return t('capture.editorUnavailable')
})

let imageObserver: IntersectionObserver | undefined
let captureAssetRefreshTimer: number | undefined
let captureAssetRefreshInFlight = false

type CaptureEditorAuth = {
  enabled: boolean
  authenticated: boolean
  authorized: boolean
  login: string
  owner: string
  localDev?: boolean
}

type CaptureAssetsResponse = {
  ok: boolean
  assets?: CaptureAsset[]
  error?: string
}

const vLazySrc: Directive<HTMLImageElement, string> = {
  mounted(el, binding) {
    observeImage(el, binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) observeImage(el, binding.value)
  },
  beforeUnmount(el) {
    imageObserver?.unobserve(el)
  },
}

type CaptureGroup = {
  id: string
  date?: string
  heading: string
  timestamp: number
  tags: string[]
  sources: CaptureSourceRef[]
  assets: CaptureAsset[]
}

type MonthGroup = {
  id: string
  label: string
  timestamp: number
  groups: CaptureGroup[]
}

type YearGroup = {
  id: string
  label: string
  timestamp: number
  months: MonthGroup[]
}

function formatDate(date?: string) {
  return formatTimelineDate(date)
}

function formatDateOnly(date?: string) {
  const { start, end } = parseTimelineDate(date)
  if (start && end) return `${formatDateOnlyValue(start)} - ${formatDateOnlyValue(end)}`
  if (start) return formatDateOnlyValue(start)
  return date?.replace(/[ T]\d{2}:\d{2}(?::\d{2})?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?$/, '') || ''
}

function formatDateOnlyValue(date: Date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function groupCaptureAssets(assets: CaptureAsset[]): CaptureGroup[] {
  const groups = new Map<string, CaptureGroup>()

  for (const asset of assets) {
    const key = asset.date || 'undated'
    const group = groups.get(key) || {
      id: `capture-${slugFromDate(key)}`,
      date: asset.date,
      heading: formatDate(asset.date) || 'Undated',
      timestamp: getStartSortTimestamp(asset.date),
      tags: [],
      sources: [],
      assets: [],
    }

    group.tags = mergeUnique(group.tags, asset.tags || [])
    group.sources = mergeSources(group.sources, asset.sourceRefs || [])
    group.assets.push(asset)
    groups.set(key, group)
  }

  return Array.from(groups.values()).sort((a, b) => b.timestamp - a.timestamp)
}

function findCaptureGroupByRouteId(routeId: string) {
  return captureGroups.value.find(
    (group) => group.id === routeId || group.assets.some((asset) => asset.id === routeId)
  ) || null
}

function groupByYearAndMonth(groups: CaptureGroup[]): YearGroup[] {
  const years = new Map<string, YearGroup>()

  for (const group of groups) {
    const start = getStartDate(group.date)
    const yearKey = start ? String(start.getFullYear()) : 'undated'
    const monthKey = start ? `${yearKey}-${String(start.getMonth() + 1).padStart(2, '0')}` : 'undated'
    const year = years.get(yearKey) || {
      id: `capture-year-${yearKey}`,
      label: start ? formatYearLabel(start) : 'Undated',
      timestamp: start?.getTime() || 0,
      months: [],
    }

    let month = year.months.find((item) => item.id === `capture-month-${monthKey}`)
    if (!month) {
      month = {
        id: `capture-month-${monthKey}`,
        label: start ? formatMonthLabel(start) : 'Undated',
        timestamp: start?.getTime() || 0,
        groups: [],
      }
      year.months.push(month)
    }

    year.timestamp = Math.max(year.timestamp, group.timestamp)
    month.timestamp = Math.max(month.timestamp, group.timestamp)
    month.groups.push(group)
    years.set(yearKey, year)
  }

  return Array.from(years.values())
    .map((year) => ({
      ...year,
      months: year.months
        .map((month) => ({
          ...month,
          groups: month.groups.slice().sort((a, b) => b.timestamp - a.timestamp),
        }))
        .sort((a, b) => b.timestamp - a.timestamp),
    }))
    .sort((a, b) => b.timestamp - a.timestamp)
}

function openAsset(asset: CaptureAsset) {
  openImagePreviewGallery(
    allAssets.value.map((item) => ({ src: item.image, alt: item.title || '' })),
    allAssets.value.findIndex((item) => item.id === asset.id)
  )
}

function backToCapture() {
  if (window.sessionStorage.getItem(captureScrollStorageKey)) {
    router.back()
    return
  }
  router.push('/capture')
}

function saveCaptureScrollPosition() {
  window.sessionStorage.setItem(captureScrollStorageKey, String(window.scrollY))
}

function restoreCaptureScrollPosition() {
  if (isDetailRoute.value) return
  const savedScrollY = window.sessionStorage.getItem(captureScrollStorageKey)
  if (!savedScrollY) return
  window.sessionStorage.removeItem(captureScrollStorageKey)

  const top = Number(savedScrollY)
  if (!Number.isFinite(top)) return

  window.requestAnimationFrame(() => {
    window.scrollTo({ top, behavior: 'auto' })
  })
}

async function refreshEditorAuth() {
  if (!isDev) return
  try {
    const response = await fetch('/api/capture/auth')
    if (!response.ok) throw new Error('Capture editor auth failed.')
    editorAuth.value = await response.json()
  } catch {
    editorAuth.value = {
      enabled: true,
      authenticated: false,
      authorized: true,
      login: '',
      owner: '',
      localDev: true,
    }
  }
}

async function refreshCaptureAssets() {
  if (!canUseLocalCaptureAssetApi() || captureAssetRefreshInFlight) return
  captureAssetRefreshInFlight = true
  try {
    const response = await fetch(`/api/capture/assets?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return
    const result = await response.json() as CaptureAssetsResponse
    if (!result.ok || !Array.isArray(result.assets)) return
    syncCaptureAssets(result.assets)
  } catch {
    // The API only exists on local Vite dev/preview servers.
  } finally {
    captureAssetRefreshInFlight = false
  }
}

function syncCaptureAssets(assets: CaptureAsset[]) {
  const nextAssets = sortCaptureAssetList(normalizeCaptureAssets(assets))
  if (JSON.stringify(nextAssets) === JSON.stringify(allAssets.value)) return
  allAssets.value = nextAssets
  if (deleteTarget.value && !nextAssets.some((asset) => asset.id === deleteTarget.value?.id)) {
    deleteTarget.value = null
  }
}

function canUseLocalCaptureAssetApi() {
  if (typeof window === 'undefined') return false
  if (import.meta.env.DEV) return true
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Unable to read file.'))
    reader.readAsDataURL(file)
  })
}

function selectUploadGroup(group: CaptureGroup) {
  if (!canEdit.value || editorBusy.value) return
  pendingUploadGroup.value = group
  if (uploadInput.value) {
    uploadInput.value.value = ''
    uploadInput.value.click()
  }
}

function selectEmptyUploadGroup() {
  const today = new Date().toISOString().slice(0, 10)
  selectUploadGroup({
    id: `capture-${slugFromDate(today)}`,
    date: today,
    heading: formatDate(today),
    timestamp: getStartSortTimestamp(today),
    tags: [],
    sources: [],
    assets: [],
  })
}

async function onUploadFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const group = pendingUploadGroup.value
  input.value = ''
  pendingUploadGroup.value = null
  if (!file || !group || !canEdit.value) return
  await uploadCaptureToGroup(file, group)
}

async function uploadCaptureToGroup(file: File, group: CaptureGroup) {
  if (!canEdit.value) return
  editorBusy.value = true
  try {
    const imageData = await readFileAsDataUrl(file)
    const response = await fetch('/api/capture/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData,
        title: file.name.replace(/\.[^.]+$/, ''),
        date: group.date || new Date().toISOString().slice(0, 10),
        tags: group.tags,
      }),
    })
    const result = await response.json()
    if (!response.ok || !result.ok) throw new Error(result.error || t('capture.uploadFailed'))
    if (result.asset) upsertCaptureAsset(result.asset)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error))
  } finally {
    editorBusy.value = false
  }
}

function deleteCapture(asset: CaptureAsset) {
  if (!canEdit.value || editorBusy.value) return
  deleteTarget.value = asset
}

function cancelDeleteCapture() {
  if (editorBusy.value) return
  deleteTarget.value = null
}

async function confirmDeleteCapture() {
  const asset = deleteTarget.value
  if (!asset || !canEdit.value || editorBusy.value) return
  editorBusy.value = true
  try {
    const response = await fetch('/api/capture/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: asset.id }),
    })
    const result = await response.json()
    if (!response.ok || !result.ok) throw new Error(result.error || t('capture.deleteFailed'))
    removeCaptureAsset(asset.id)
    deleteTarget.value = null
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error))
  } finally {
    editorBusy.value = false
  }
}

function upsertCaptureAsset(asset: CaptureAsset) {
  allAssets.value = sortCaptureAssetList([
    asset,
    ...allAssets.value.filter((item) => item.id !== asset.id),
  ])
}

function removeCaptureAsset(id: string) {
  allAssets.value = allAssets.value.filter((asset) => asset.id !== id)
  if (selectedGroupId.value && !selectedGroup.value) {
    backToCapture()
  }
}

function sortCaptureAssetList(assets: CaptureAsset[]) {
  return assets.slice().sort((a, b) => getStartSortTimestamp(b.date) - getStartSortTimestamp(a.date))
}

function mergeUnique(existing: string[], incoming: string[]) {
  return Array.from(new Set([...existing, ...incoming]))
}

function mergeSources(existing: CaptureSourceRef[], incoming: CaptureSourceRef[]) {
  const byKey = new Map(existing.map((source) => [`${source.type}:${source.id}`, source]))
  for (const source of incoming) {
    byKey.set(`${source.type}:${source.id}`, source)
  }
  return Array.from(byKey.values()).sort((a, b) => a.title.localeCompare(b.title))
}

function getStartDate(date?: string) {
  const { start } = parseTimelineDate(date)
  return start
}

function getStartSortTimestamp(date?: string) {
  return getStartDate(date)?.getTime() || Date.parse(date || '') || 0
}

function formatYearLabel(date: Date) {
  return new Intl.DateTimeFormat(locale.value.replace('_', '-'), { year: 'numeric' }).format(date)
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat(locale.value.replace('_', '-'), { month: 'numeric' }).format(date)
}

function observeImage(el: HTMLImageElement, src?: string) {
  const imageSrc = String(src || '').trim()
  if (!imageSrc) return
  el.dataset.src = imageSrc

  const observer = getImageObserver()
  if (!observer) {
    loadImage(el)
    return
  }

  observer.observe(el)
}

function getImageObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined
  if (!imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) loadImage(entry.target as HTMLImageElement)
        }
      },
      { rootMargin: '360px 0px', threshold: 0.01 }
    )
  }
  return imageObserver
}

function loadImage(el: HTMLImageElement) {
  const src = el.dataset.src
  if (!src) return
  if (el.getAttribute('src') !== src) el.setAttribute('src', src)
  imageObserver?.unobserve(el)
  delete el.dataset.src
}

function slugFromDate(date: string) {
  return date
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'undated'
}

onMounted(() => {
  refreshEditorAuth()
  refreshCaptureAssets()
  restoreCaptureScrollPosition()
  if (canUseLocalCaptureAssetApi()) {
    captureAssetRefreshTimer = window.setInterval(refreshCaptureAssets, 1500)
  }
})

onBeforeUnmount(() => {
  if (captureAssetRefreshTimer) window.clearInterval(captureAssetRefreshTimer)
  imageObserver?.disconnect()
  imageObserver = undefined
})

watch(isDetailRoute, (detail) => {
  if (!detail) restoreCaptureScrollPosition()
}, { flush: 'post' })
</script>

<style scoped>
.capture-view {
  display: flex;
  align-items: flex-start;
  gap: var(--site-view-aside-gap);
}

.capture-view__main {
  flex: 1;
  min-width: 0;
}

.capture-view--detail {
  display: block;
}

.capture-detail__topbar {
  display: flex;
  margin-bottom: 18px;
}

.capture-detail__back {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  font-size: 18px;
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.capture-detail__back:hover,
.capture-detail__back:focus-visible {
  color: var(--site-accent);
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

.capture-detail {
  display: grid;
  gap: 22px;
}

.capture-detail__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.capture-detail__figure {
  overflow: hidden;
  margin: 0;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.capture-detail__media {
  appearance: none;
  display: grid;
  place-items: center;
  width: 100%;
  max-height: 76vh;
  padding: 0;
  border: 0;
  background: rgba(255, 255, 255, 0.03);
  cursor: zoom-in;
}

.capture-detail__media img {
  display: block;
  width: 100%;
  max-height: 76vh;
  object-fit: contain;
}

.capture-detail__media:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: -2px;
}

.capture-detail__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 14px;
  font-size: 14px;
}

.capture-detail__meta-row time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.capture-detail__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.capture-editor {
  display: grid;
  margin: 0 0 18px;
  padding: 10px 12px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.capture-editor__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 800;
}

.capture-editor__status strong {
  color: var(--site-text);
  font-size: 13px;
}

.capture-editor__file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

.capture-timeline,
.capture-year,
.capture-month,
.capture-groups {
  display: grid;
  gap: 24px;
}

.capture-time-heading {
  margin: 0;
  scroll-margin-top: 28px;
}

.capture-time-heading--year {
  color: var(--site-text);
  font-size: 28px;
  line-height: 1.1;
  font-weight: 900;
}

.capture-time-heading--month {
  color: var(--site-muted);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
}

.capture-group {
  overflow: hidden;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.capture-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.capture-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.capture-card__media {
  appearance: none;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  cursor: zoom-in;
}

.capture-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.capture-card__media:hover img,
.capture-card__media:focus-visible img {
  transform: scale(1.03);
}

.capture-card__media:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--site-accent);
  outline-offset: -2px;
}

.capture-card__delete {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 6px;
  color: #fff;
  background: rgba(150, 20, 36, 0.88);
  font-size: 15px;
  cursor: pointer;
  opacity: 1;
  transition: background-color 160ms ease, transform 160ms ease;
}

.capture-card__delete:hover,
.capture-card__delete:focus-visible {
  background: rgba(190, 18, 60, 0.96);
  outline: none;
  transform: translateY(-1px);
}

.capture-card__delete:disabled,
.capture-card--add:disabled {
  cursor: progress;
  opacity: .56;
}

.capture-card--add {
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: 0;
  color: var(--site-muted);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
    rgba(255, 255, 255, 0.03);
  cursor: pointer;
  font-size: 32px;
  transition: color 160ms ease, background-color 160ms ease;
}

.capture-card--add:hover,
.capture-card--add:focus-visible {
  color: var(--site-text);
  background-color: rgba(31, 196, 31, 0.08);
  outline: 2px solid rgba(31, 196, 31, 0.46);
  outline-offset: -2px;
}

.capture-group__body {
  display: grid;
  gap: 10px;
  padding: 12px 14px 14px;
}

.capture-group__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.capture-group__source {
  color: var(--site-text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.capture-group__source:hover,
.capture-group__source:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.capture-card__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-height: 22px;
  font-size: 14px;
  min-width: 0;
}

.capture-card__meta-row time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-muted);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.capture-card__meta-icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
}

.capture-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--site-tag-color);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.capture-card__tag:hover,
.capture-card__tag:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.capture-card__tag-icon {
  width: 13px;
  height: 13px;
  font-size: 13px;
}

.capture-card__comments {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
  font-size: 15px;
  margin-left: auto;
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.capture-card__comments:hover,
.capture-card__comments:focus-visible {
  color: var(--site-accent);
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.06);
  outline: none;
  transform: translateY(-1px);
}

.capture-empty {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 54px 0;
  color: var(--site-muted);
  text-align: center;
  font-size: 16px;
  font-weight: 800;
}

.capture-empty__upload {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  aspect-ratio: 1;
  border: 1px dashed var(--site-border);
  border-radius: 8px;
  color: var(--site-muted);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  font-size: 30px;
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.capture-empty__upload:hover,
.capture-empty__upload:focus-visible {
  color: var(--site-text);
  border-color: rgba(31, 196, 31, 0.46);
  background: rgba(31, 196, 31, 0.08);
  outline: none;
}

.capture-delete-dialog {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.54);
}

.capture-delete-dialog__panel {
  width: min(360px, 100%);
  padding: 20px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.34);
}

.capture-delete-dialog__panel h2 {
  margin: 0 0 8px;
  color: var(--site-text);
  font-size: 18px;
  line-height: 1.3;
  font-weight: 900;
}

.capture-delete-dialog__panel p {
  margin: 0;
  color: var(--site-muted);
  font-size: 14px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.capture-delete-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.capture-delete-dialog__button {
  min-width: 72px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--site-border);
  border-radius: 6px;
  color: var(--site-text);
  background: rgba(255, 255, 255, 0.04);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.capture-delete-dialog__button--danger {
  border-color: rgba(190, 18, 60, 0.68);
  color: #fff;
  background: rgba(150, 20, 36, 0.9);
}

.capture-delete-dialog__button:hover,
.capture-delete-dialog__button:focus-visible {
  border-color: rgba(255, 255, 255, 0.42);
  outline: none;
}

.capture-delete-dialog__button--danger:hover,
.capture-delete-dialog__button--danger:focus-visible {
  background: rgba(190, 18, 60, 0.98);
}

.capture-delete-dialog__button:disabled {
  cursor: progress;
  opacity: .58;
}

.capture-delete-dialog-enter-active,
.capture-delete-dialog-leave-active {
  transition: opacity 160ms ease;
}

.capture-delete-dialog-enter-from,
.capture-delete-dialog-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .capture-editor {
    margin-inline: -18px;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .capture-timeline,
  .capture-year,
  .capture-month {
    gap: 20px;
  }

  .capture-groups {
    margin-inline: -18px;
    gap: 20px;
  }

  .capture-group {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .capture-grid {
    grid-template-columns: repeat(3, calc(100vw / 3));
  }

  .capture-card__media {
    width: calc(100vw / 3);
  }

  .capture-card {
    width: calc(100vw / 3);
  }

  .capture-card__meta-row {
    flex: 1 1 auto;
    gap: 5px;
  }

  .capture-card__comments {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
  }

  .capture-card--add {
    width: calc(100vw / 3);
  }

  .capture-detail,
  .capture-detail__grid,
  .capture-detail__body {
    margin-inline: -18px;
  }

  .capture-detail__topbar {
    display: none;
  }

  .capture-detail__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
  }

  .capture-detail__figure,
  .capture-detail__body {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}

</style>
