<script>
import { showCenteredToast } from '../utils/centerToast'

export function formatListDate(dateValue, { pad = false } = {}) {
  if (!dateValue) {
    return ''
  }

  try {
    const date = new Date(dateValue)
    if (Number.isNaN(date.valueOf())) {
      return dateValue
    }

    const month = pad ? String(date.getMonth() + 1).padStart(2, '0') : date.getMonth() + 1
    const day = pad ? String(date.getDate()).padStart(2, '0') : date.getDate()
    return `${date.getFullYear()}-${month}-${day}`
  } catch {
    return dateValue
  }
}

export async function copyTextWithToast(text, copiedState, options = {}) {
  const {
    copiedKey = text,
    duration = 3000,
    successMessage = 'action.copied',
    errorMessage = 'action.copy_failed',
  } = options

  const normalizedText = typeof text === 'string' ? text : String(text ?? '')

  if (!normalizedText.trim()) {
    showCenteredToast(errorMessage, { duration, type: 'error' })
    return false
  }

  try {
    await navigator.clipboard.writeText(normalizedText)

    if (copiedState && copiedKey != null) {
      copiedState[copiedKey] = true
      window.setTimeout(() => {
        delete copiedState[copiedKey]
      }, duration)
    }

    showCenteredToast(successMessage, { duration, type: 'success' })
    return true
  } catch {
    showCenteredToast(errorMessage, { duration, type: 'error' })
    return false
  }
}

export function parseGitHubRepo(url) {
  if (!url) {
    return null
  }

  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) {
    return null
  }

  return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
}

export async function enrichItemsWithLatestDate(items, options) {
  const {
    fetchCommit,
    getRepoUrl,
    hasDate = (item) => !!item?.date,
    assignDate = (item, value) => {
      item.date = value
    },
  } = options

  await Promise.all(
    items.map(async (item) => {
      if (hasDate(item)) {
        return
      }

      const repo = parseGitHubRepo(getRepoUrl(item))
      if (!repo) {
        return
      }

      try {
        const commit = await fetchCommit(repo)
        if (commit?.commit) {
          assignDate(item, commit?.commit?.committer?.date || commit?.commit?.author?.date || null)
        }
      } catch {
      }
    }),
  )
}
</script>

<template>
  <div class="space-y-3 max-[640px]:space-y-2">
    <div
      v-if="loading"
      class="rounded-[26px] border border-white/34 bg-white/[0.24] px-3 py-3 backdrop-blur-[2px] max-[640px]:rounded-2xl max-[640px]:px-2 max-[640px]:py-2.5"
    >
      <div class="flex flex-col gap-3 rounded-[22px] border border-white/24 bg-white/[0.12] px-3 py-3 max-[640px]:gap-2 max-[640px]:rounded-[18px] max-[640px]:px-2 max-[640px]:py-2">
        <div class="flex items-center gap-3 max-[640px]:gap-2">
          <span class="skeleton-block skeleton-icon max-[640px]:h-8 max-[640px]:w-8" />

          <div class="min-w-0 flex-1 space-y-2">
            <span class="skeleton-block skeleton-line skeleton-line--title" />
            <span class="skeleton-block skeleton-line skeleton-line--description" />
          </div>

          <span class="skeleton-block skeleton-badge max-[640px]:hidden" />
        </div>

        <div class="flex items-center gap-2 max-[640px]:gap-1.5">
          <span class="skeleton-block skeleton-action max-[640px]:grow" />
          <span class="skeleton-block skeleton-action max-[640px]:grow" />
        </div>
      </div>

      <p class="mt-2 px-1 text-center text-xs text-[#3b4cb8]/50">{{ loadingText }}</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-3xl border border-[#3b4cb8]/20 bg-[#3b4cb8]/8 px-5 py-8 text-center text-sm text-[#3b4cb8] backdrop-blur-sm max-[640px]:rounded-2xl max-[640px]:px-3 max-[640px]:py-5 max-[640px]:text-xs"
    >
      {{ error }}
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-3xl border border-white/38 bg-white/[0.34] px-5 py-8 text-center text-sm text-[#3b4cb8]/50 backdrop-blur-sm max-[640px]:rounded-2xl max-[640px]:px-3 max-[640px]:py-5 max-[640px]:text-xs"
    >
      {{ emptyText }}
    </div>

    <div v-else class="space-y-3 max-[640px]:space-y-2">
      <article
        v-for="item in items"
        :key="item.key"
        class="item-card rounded-3xl border border-white/38 bg-white/[0.38] shadow-[0_8px_32px_rgba(180,160,220,0.1)] backdrop-blur-sm max-[640px]:rounded-2xl"
      >
        <div
          class="item-row flex flex-col gap-4 rounded-[inherit] p-3 sm:flex-row sm:items-center sm:justify-between max-[640px]:gap-2 max-[640px]:p-2"
          :class="hasRowAction(item) ? 'cursor-pointer' : ''"
          :tabindex="hasRowAction(item) ? 0 : undefined"
          :role="hasRowAction(item) ? 'button' : undefined"
          @click="activateItem(item)"
          @keydown.enter.prevent="activateItem(item)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-start gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 text-[#3b4cb8] max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                <component :is="resolveIcon(item.icon)" class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-base font-semibold tracking-wide text-[#3b4cb8] max-[640px]:text-sm">
                    {{ item.title }}
                  </h3>

                  <span
                    v-for="badge in item.badges || []"
                    :key="`${item.key}-${badge}`"
                    class="inline-flex items-center rounded-full border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#3b4cb8]/65 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-[10px]"
                  >
                    {{ badge }}
                  </span>
                </div>

                <p v-if="item.description" class="mt-1 text-sm text-[#3b4cb8]/55">
                  {{ item.description }}
                </p>

                <div v-if="item.date || item.meta" class="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#3b4cb8]/55">
                  <span v-if="item.date" class="inline-flex items-center gap-1.5">
                    <Calendar class="h-4 w-4" />
                    {{ item.date }}
                  </span>

                  <span v-if="item.meta" class="text-[#3b4cb8]/45">
                    {{ item.meta }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="item.actions?.length" class="flex flex-wrap items-center gap-1.5 max-[640px]:w-full max-[640px]:gap-1 sm:justify-end">
            <component
              :is="action.href ? 'a' : 'button'"
              v-for="action in item.actions"
              :key="getActionRenderKey(item.key, action)"
              v-bind="getActionAttrs(action)"
              :class="getActionClass(action, 'inline-flex min-h-9 min-w-[100px] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border px-2.5 py-1.5 text-sm font-medium transition max-[640px]:min-h-7 max-[640px]:min-w-0 max-[640px]:basis-0 max-[640px]:grow max-[640px]:gap-1 max-[640px]:rounded-xl max-[640px]:px-1 max-[640px]:py-0.5 max-[640px]:text-xs')"
              @click="handleActionClick(action, $event)"
              @pointerdown.stop
              @mousedown.stop
            >
              <component :is="resolveIcon(action.icon)" class="h-4 w-4 shrink-0 max-[640px]:h-3.5 max-[640px]:w-3.5" />
              <span class="truncate">{{ action.label }}</span>
            </component>
          </div>
        </div>

        <div v-if="item.children?.length" class="border-t border-white/30 px-3 pb-3 pt-2.5 max-[640px]:px-1 max-[640px]:pb-2.5 max-[640px]:pt-2">
          <div class="ml-1.5 space-y-2 border-l border-white/30 pl-3 sm:ml-3 sm:pl-4 max-[640px]:ml-0.5 max-[640px]:pl-1.5">
            <div
              v-for="child in item.children"
              :key="child.key"
              class="child-row flex flex-col gap-3 rounded-2xl border border-white/30 bg-white/35 px-2.5 py-2.5 sm:flex-row sm:items-center sm:justify-between max-[640px]:gap-2 max-[640px]:px-1.5 max-[640px]:py-2"
              :class="hasRowAction(child) ? 'cursor-pointer' : ''"
              :tabindex="hasRowAction(child) ? 0 : undefined"
              :role="hasRowAction(child) ? 'button' : undefined"
              @click="activateItem(child)"
              @keydown.enter.prevent="activateItem(child)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3b4cb8]/12 bg-[#3b4cb8]/8 text-[#3b4cb8]/80">
                    <component :is="resolveIcon(child.icon)" class="h-4 w-4" />
                  </span>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="truncate text-sm font-medium text-[#3b4cb8]/90">
                        {{ child.title }}
                      </h4>

                      <span
                        v-for="badge in child.badges || []"
                        :key="`${child.key}-${badge}`"
                        class="inline-flex items-center rounded-full border border-[#3b4cb8]/12 bg-[#3b4cb8]/6 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#3b4cb8]/60"
                      >
                        {{ badge }}
                      </span>
                    </div>

                    <p v-if="child.description" class="mt-1 text-xs text-[#3b4cb8]/50">
                      {{ child.description }}
                    </p>

                    <div v-if="child.date || child.meta" class="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#3b4cb8]/50">
                      <span v-if="child.date" class="inline-flex items-center gap-1.5">
                        <Calendar class="h-3.5 w-3.5" />
                        {{ child.date }}
                      </span>

                      <span v-if="child.meta">{{ child.meta }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="child.actions?.length" class="flex flex-wrap items-center gap-1.5 max-[640px]:w-full max-[640px]:gap-1 sm:justify-end">
                <component
                  :is="action.href ? 'a' : 'button'"
                  v-for="action in child.actions"
                  :key="getActionRenderKey(child.key, action)"
                  v-bind="getActionAttrs(action)"
                  :class="getActionClass(action, 'inline-flex min-h-9 min-w-[92px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-xs font-medium transition max-[640px]:min-h-7 max-[640px]:min-w-0 max-[640px]:basis-0 max-[640px]:grow max-[640px]:gap-1 max-[640px]:px-1 max-[640px]:py-0.5')"
                  @click="handleActionClick(action, $event)"
                  @pointerdown.stop
                  @mousedown.stop
                >
                  <component :is="resolveIcon(action.icon)" class="h-3.5 w-3.5 shrink-0 max-[640px]:h-3 max-[640px]:w-3" />
                  <span class="truncate">{{ action.label }}</span>
                </component>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Collection,
  CopyDocument,
  Cpu,
  Document,
  Download,
  Flag,
  FolderOpened,
  Link,
  Monitor,
  Promotion,
  View,
} from '@element-plus/icons-vue'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  emptyText: {
    type: String,
    default: 'Nothing here yet.',
  },
  loadingText: {
    type: String,
    default: 'Loading...',
  },
})

const iconMap = {
  app: Monitor,
  collapse: ArrowUp,
  copy: CopyDocument,
  download: Download,
  expand: ArrowDown,
  file: Document,
  folder: FolderOpened,
  game: Flag,
  open: Promotion,
  page: Collection,
  repo: Link,
  tool: Cpu,
  view: View,
}

function resolveIcon(icon) {
  return iconMap[icon] || Document
}

function hasRowAction(item) {
  return typeof item?.onClick === 'function' || !!item?.href
}

function activateItem(item) {
  if (typeof item?.onClick === 'function') {
    item.onClick()
    return
  }

  if (item?.href) {
    window.open(item.href, item.target || '_blank', 'noopener')
  }
}

function getActionAttrs(action) {
  if (action?.href) {
    return {
      href: action.href,
      rel: 'noopener',
      target: action.target || '_blank',
    }
  }

  return {
    type: 'button',
  }
}

function getActionRenderKey(parentKey, action) {
  return `${parentKey}-${action?.key || 'action'}-${action?.href || action?.label || 'inline'}`
}

function handleActionClick(action, event) {
  event?.stopPropagation?.()

  if (typeof action?.onClick === 'function') {
    action.onClick(event)
  }
}

function getActionClass(action, baseClass) {
  if (action?.active) {
    return `${baseClass} border-emerald-300/40 bg-emerald-500/85 text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 hover:border-emerald-200/60 hover:bg-emerald-400/90`
  }

  return `${baseClass} border-[#3b4cb8]/12 bg-[#3b4cb8]/6 text-[#3b4cb8]/80 hover:-translate-y-0.5 hover:border-[#7c3aed]/20 hover:bg-[#7c3aed]/12`
}
</script>

<style scoped>
.item-card,
.item-row,
.child-row {
  transition: border-color 220ms ease, background-color 220ms ease, box-shadow 220ms ease, transform 220ms cubic-bezier(.2,.9,.2,1);
}

.item-card {
  contain: layout paint style;
  content-visibility: auto;
  contain-intrinsic-size: auto 164px;
}

.skeleton-block {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(59, 76, 184, 0.12);
}

.skeleton-block::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 10%, rgba(255, 255, 255, 0.58) 48%, transparent 88%);
  transform: translateX(-140%);
  animation: skeleton-sweep 1.35s ease-in-out infinite;
}

.skeleton-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
}

.skeleton-line {
  height: 10px;
}

.skeleton-line--title {
  width: min(280px, 70%);
  height: 14px;
}

.skeleton-line--description {
  width: min(420px, 88%);
}

.skeleton-badge {
  width: 74px;
  height: 26px;
  border-radius: 999px;
}

.skeleton-action {
  min-width: 88px;
  height: 30px;
  border-radius: 12px;
}

.item-row:focus-visible,
.child-row:focus-visible {
  outline: none;
}

@media (hover: hover) {
  .item-card:hover,
  .item-card:focus-within {
    border-color: rgba(124, 58, 237, 0.22);
    background: rgba(255, 255, 255, 0.58);
    box-shadow: 0 12px 40px rgba(180, 160, 220, 0.18), 0 0 0 1px rgba(124, 58, 237, 0.06);
    transform: translateY(-2px);
  }

  .item-card:hover .item-row,
  .item-card:focus-within .item-row {
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(124, 58, 237, 0.01));
  }

  .child-row:hover,
  .child-row:focus-visible {
    border-color: rgba(124, 58, 237, 0.18);
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(255, 255, 255, 0.5));
    box-shadow: 0 8px 24px rgba(180, 160, 220, 0.12);
    transform: translateY(-1px);
  }
}

@keyframes skeleton-sweep {
  from {
    transform: translateX(-140%);
  }

  to {
    transform: translateX(140%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block::after {
    animation: none;
  }
}
</style>
