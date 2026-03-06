<template>
  <div class="space-y-3 max-[640px]:space-y-2">
    <div
      v-if="loading"
      class="rounded-3xl border border-white/10 bg-black/25 px-5 py-8 text-center text-sm text-white/70 backdrop-blur-sm max-[640px]:rounded-2xl max-[640px]:px-3 max-[640px]:py-5 max-[640px]:text-xs"
    >
      {{ loadingText }}
    </div>

    <div
      v-else-if="error"
      class="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-8 text-center text-sm text-rose-100 backdrop-blur-sm max-[640px]:rounded-2xl max-[640px]:px-3 max-[640px]:py-5 max-[640px]:text-xs"
    >
      {{ error }}
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-3xl border border-white/10 bg-black/25 px-5 py-8 text-center text-sm text-white/60 backdrop-blur-sm max-[640px]:rounded-2xl max-[640px]:px-3 max-[640px]:py-5 max-[640px]:text-xs"
    >
      {{ emptyText }}
    </div>

    <div v-else class="space-y-3 max-[640px]:space-y-2">
      <article
        v-for="item in items"
        :key="item.key"
        class="rounded-3xl border border-white/10 bg-black/30 shadow-[0_18px_48px_rgba(0,0,0,0.2)] backdrop-blur-sm max-[640px]:rounded-2xl"
      >
        <div
          class="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between max-[640px]:gap-2 max-[640px]:p-2"
          :class="hasRowAction(item) ? 'cursor-pointer' : ''"
          :tabindex="hasRowAction(item) ? 0 : undefined"
          :role="hasRowAction(item) ? 'button' : undefined"
          @click="activateItem(item)"
          @keydown.enter.prevent="activateItem(item)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-start gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white max-[640px]:h-8 max-[640px]:w-8 max-[640px]:rounded-xl">
                <component :is="resolveIcon(item.icon)" class="h-5 w-5 max-[640px]:h-4 max-[640px]:w-4" />
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-base font-semibold tracking-wide text-white max-[640px]:text-sm">
                    {{ item.title }}
                  </h3>

                  <span
                    v-for="badge in item.badges || []"
                    :key="`${item.key}-${badge}`"
                    class="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 max-[640px]:px-1.5 max-[640px]:py-0.5 max-[640px]:text-[10px]"
                  >
                    {{ badge }}
                  </span>
                </div>

                <p v-if="item.description" class="mt-1 text-sm text-white/65">
                  {{ item.description }}
                </p>

                <div v-if="item.date || item.meta" class="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/65">
                  <span v-if="item.date" class="inline-flex items-center gap-1.5">
                    <Calendar class="h-4 w-4" />
                    {{ item.date }}
                  </span>

                  <span v-if="item.meta" class="text-white/55">
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
              :key="`${item.key}-${action.key}`"
              v-bind="getActionAttrs(action)"
              class="inline-flex min-h-9 min-w-[100px] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-white/10 bg-white/8 px-2.5 py-1.5 text-sm font-medium text-white/85 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/14 max-[640px]:min-h-7 max-[640px]:min-w-0 max-[640px]:basis-0 max-[640px]:grow max-[640px]:gap-1 max-[640px]:rounded-xl max-[640px]:px-1 max-[640px]:py-0.5 max-[640px]:text-xs"
              @click.stop="handleActionClick(action)"
            >
              <component :is="resolveIcon(action.icon)" class="h-4 w-4 shrink-0 max-[640px]:h-3.5 max-[640px]:w-3.5" />
              <span class="truncate">{{ action.label }}</span>
            </component>
          </div>
        </div>

        <div v-if="item.children?.length" class="border-t border-white/10 px-3 pb-3 pt-2.5 max-[640px]:px-1 max-[640px]:pb-2.5 max-[640px]:pt-2">
          <div class="ml-1.5 space-y-2 border-l border-white/10 pl-3 sm:ml-3 sm:pl-4 max-[640px]:ml-0.5 max-[640px]:pl-1.5">
            <div
              v-for="child in item.children"
              :key="child.key"
              class="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 px-2.5 py-2.5 sm:flex-row sm:items-center sm:justify-between max-[640px]:gap-2 max-[640px]:px-1.5 max-[640px]:py-2"
              :class="hasRowAction(child) ? 'cursor-pointer' : ''"
              :tabindex="hasRowAction(child) ? 0 : undefined"
              :role="hasRowAction(child) ? 'button' : undefined"
              @click="activateItem(child)"
              @keydown.enter.prevent="activateItem(child)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-white/80">
                    <component :is="resolveIcon(child.icon)" class="h-4 w-4" />
                  </span>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="truncate text-sm font-medium text-white/90">
                        {{ child.title }}
                      </h4>

                      <span
                        v-for="badge in child.badges || []"
                        :key="`${child.key}-${badge}`"
                        class="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/65"
                      >
                        {{ badge }}
                      </span>
                    </div>

                    <p v-if="child.description" class="mt-1 text-xs text-white/55">
                      {{ child.description }}
                    </p>

                    <div v-if="child.date || child.meta" class="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/55">
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
                  :key="`${child.key}-${action.key}`"
                  v-bind="getActionAttrs(action)"
                  class="inline-flex min-h-9 min-w-[92px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/8 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/14 max-[640px]:min-h-7 max-[640px]:min-w-0 max-[640px]:basis-0 max-[640px]:grow max-[640px]:gap-1 max-[640px]:px-1 max-[640px]:py-0.5"
                  @click.stop="handleActionClick(action)"
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

function handleActionClick(action) {
  if (typeof action?.onClick === 'function') {
    action.onClick()
  }
}
</script>