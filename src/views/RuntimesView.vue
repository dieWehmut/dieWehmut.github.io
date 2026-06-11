<template>
  <section class="runtimes-view page-surface">
    <PageHeading title="Runtimes" :icon="Cpu" />

    <div class="runtimes-toolbar">
      <div class="runtimes-toolbar__summary">
        <strong>{{ activeCount }}</strong>
        <span>/</span>
        <span>{{ runtimes.length }}</span>
      </div>
      <button class="runtimes-refresh" type="button" :disabled="loading" @click="loadRuntimes">
        <el-icon><Refresh /></el-icon>
        <span>{{ loading ? 'Refreshing' : 'Refresh' }}</span>
      </button>
    </div>

    <div v-if="errorMessage" class="runtimes-state runtimes-state--error">
      {{ errorMessage }}
    </div>
    <div v-else-if="loading && !runtimes.length" class="runtimes-state">
      Loading
    </div>
    <div v-else-if="!runtimes.length" class="runtimes-state">
      Empty
    </div>

    <div v-else class="runtimes-grid">
      <article
        v-for="runtime in runtimes"
        :key="runtime.language"
        class="runtime-card"
        :class="`is-${statusClass(runtime.status)}`"
      >
        <header class="runtime-card__header">
          <div>
            <h2>{{ runtime.language }}</h2>
            <p>{{ runtime.version || 'system' }}</p>
          </div>
          <span class="runtime-card__status">{{ runtime.status || 'unknown' }}</span>
        </header>

        <dl class="runtime-meta">
          <div>
            <dt>entry</dt>
            <dd>{{ runtime.default_entrypoint || '-' }}</dd>
          </div>
          <div>
            <dt>aliases</dt>
            <dd>{{ aliases(runtime) }}</dd>
          </div>
        </dl>

        <div class="runtime-command">
          <span>compile</span>
          <code>{{ commandText(runtime.compile_phase) }}</code>
        </div>
        <div class="runtime-command">
          <span>run</span>
          <code>{{ commandText(runtime.run_phase) }}</code>
        </div>

        <dl class="runtime-limits">
          <div>
            <dt>compile</dt>
            <dd>{{ formatMs(runtime.default_limits?.compile_timeout_ms) }}</dd>
          </div>
          <div>
            <dt>run</dt>
            <dd>{{ formatMs(runtime.default_limits?.run_timeout_ms) }}</dd>
          </div>
          <div>
            <dt>memory</dt>
            <dd>{{ formatBytes(runtime.default_limits?.memory_limit_bytes) }}</dd>
          </div>
          <div>
            <dt>cpu</dt>
            <dd>{{ runtime.default_limits?.cpu_millis ?? '-' }} ms</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Cpu, Refresh } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { siteConfig } from '../data/site/config'

type RuntimePhase = {
  command?: string[]
  enabled?: boolean
}

type RuntimeLimits = {
  compile_timeout_ms?: number
  run_timeout_ms?: number
  memory_limit_bytes?: number
  cpu_millis?: number
}

type RuntimeManifest = {
  language: string
  version?: string
  aliases?: string[]
  status?: string
  default_entrypoint?: string
  compile_phase?: RuntimePhase
  run_phase?: RuntimePhase
  default_limits?: RuntimeLimits
}

const runtimes = ref<RuntimeManifest[]>([])
const loading = ref(false)
const errorMessage = ref('')

const activeCount = computed(() => runtimes.value.filter((runtime) => runtime.status === 'active').length)

function apiBaseUrl(): string {
  return (siteConfig.codeRunner.backendApiUrl || '').replace(/\/+$/, '')
}

function requestHeaders(): HeadersInit {
  if (!siteConfig.codeRunner.backendToken) return {}
  return { authorization: `Bearer ${siteConfig.codeRunner.backendToken}` }
}

async function loadRuntimes() {
  const apiUrl = apiBaseUrl()
  if (!apiUrl) {
    errorMessage.value = 'Sandkasten API is not configured.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetch(`${apiUrl}/v1/runtimes`, {
      headers: requestHeaders(),
      cache: 'no-store',
    })
    const body = await response.json().catch(() => null) as { runtimes?: RuntimeManifest[] } | null
    if (!response.ok) {
      throw new Error(`Sandkasten API returned ${response.status}.`)
    }
    runtimes.value = (body?.runtimes || []).slice().sort((left, right) => left.language.localeCompare(right.language))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

function statusClass(status: string | undefined): string {
  return (status || 'unknown').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}

function aliases(runtime: RuntimeManifest): string {
  return runtime.aliases?.length ? runtime.aliases.join(', ') : '-'
}

function commandText(phase: RuntimePhase | undefined): string {
  if (!phase?.enabled || !phase.command?.length) return '-'
  return phase.command.join(' ')
}

function formatMs(value: number | undefined): string {
  if (!value) return '-'
  if (value >= 1000 && value % 1000 === 0) return `${value / 1000}s`
  return `${value} ms`
}

function formatBytes(value: number | undefined): string {
  if (!value) return '-'
  const mib = value / 1024 / 1024
  if (mib >= 1) return `${Math.round(mib)} MiB`
  return `${value} B`
}

onMounted(loadRuntimes)
</script>

<style scoped>
.runtimes-view {
  min-height: calc(100vh - var(--site-route-path-height));
}

.runtimes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 18px;
}

.runtimes-toolbar__summary {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--site-muted);
  font-size: 14px;
}

.runtimes-toolbar__summary strong {
  color: var(--site-text);
  font-size: 24px;
}

.runtimes-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
  font: inherit;
  font-weight: 760;
  cursor: pointer;
}

.runtimes-refresh:disabled {
  opacity: 0.55;
  cursor: wait;
}

.runtimes-state {
  padding: 18px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-muted);
  background: rgba(255, 255, 255, 0.025);
}

.runtimes-state--error {
  color: #ffb4a8;
  border-color: color-mix(in srgb, #ff6b5f 38%, var(--site-border));
}

.runtimes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.runtime-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
}

.runtime-card.is-active {
  border-color: color-mix(in srgb, #48d597 30%, var(--site-border));
}

.runtime-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.runtime-card h2 {
  margin: 0;
  color: var(--site-text);
  font-size: 22px;
  line-height: 1.1;
}

.runtime-card p {
  margin: 4px 0 0;
  color: var(--site-muted);
  font-size: 13px;
}

.runtime-card__status {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  color: #baf4cf;
  background: color-mix(in srgb, #48d597 16%, transparent);
  font-size: 12px;
  font-weight: 800;
}

.runtime-meta,
.runtime-limits {
  display: grid;
  gap: 8px;
  margin: 0;
}

.runtime-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.runtime-limits {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-top: 2px;
}

.runtime-meta div,
.runtime-limits div {
  min-width: 0;
}

.runtime-meta dt,
.runtime-limits dt,
.runtime-command span {
  color: var(--site-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.runtime-meta dd,
.runtime-limits dd {
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--site-text);
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-command {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.runtime-command code {
  display: block;
  overflow: auto;
  padding: 8px 10px;
  border: 1px solid var(--site-border);
  border-radius: 6px;
  color: var(--site-text);
  background: rgba(0, 0, 0, 0.18);
  font-size: 12px;
  line-height: 1.45;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .runtimes-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .runtimes-refresh {
    width: 100%;
  }

  .runtime-meta,
  .runtime-limits {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
