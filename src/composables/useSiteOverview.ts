import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { getNotes, getPosts, getProjectEntries, getTagGroups } from '../data'
import { siteConfig } from '../data/site/config'
import { infra } from '../data/site/infra'
import {
  buildSiteFooterMeta,
  buildSiteOverviewStats,
  countUniqueProjects,
  formatSiteUptime,
} from '../utils/siteOverview'

const now = ref(Date.now())
const hostname = ref('')
const captureCount = ref<number | null>(null)
let capturePromise: Promise<number> | null = null
let clockTimer: number | null = null
let clockConsumers = 0

function startClock() {
  clockConsumers += 1
  now.value = Date.now()
  if (typeof window !== 'undefined') hostname.value = window.location?.hostname || ''
  if (clockTimer !== null || typeof window === 'undefined') return
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

function stopClock() {
  clockConsumers = Math.max(0, clockConsumers - 1)
  if (clockConsumers || clockTimer === null || typeof window === 'undefined') return
  window.clearInterval(clockTimer)
  clockTimer = null
}

function loadCaptureCount() {
  if (captureCount.value !== null) return Promise.resolve(captureCount.value)
  if (!capturePromise) {
    capturePromise = import('../data/capture')
      .then(({ getCaptureAssets }) => getCaptureAssets().length)
      .then((count) => {
        captureCount.value = count
        return count
      })
      .finally(() => {
        capturePromise = null
      })
  }
  return capturePromise
}

export function useSiteOverview() {
  const posts = computed(() => getPosts())
  const notes = computed(() => getNotes())
  const stats = computed(() => buildSiteOverviewStats(
    {
      posts: posts.value.length,
      notes: notes.value.length,
      infra: (infra.value || []).length,
      capture: captureCount.value,
      project: countUniqueProjects(getProjectEntries()),
      tags: getTagGroups().length,
    },
    {
      enableInfra: siteConfig.enableInfra,
      enableProject: siteConfig.enableProject,
    },
  ))

  const contentSummary = computed(() => {
    const entries = [...posts.value, ...notes.value]
    const totalWords = entries.reduce((sum, entry) => sum + Number(entry.wordCount || 0), 0)
    const readingMinutes = entries.reduce((sum, entry) => sum + Number(entry.readingMinutes || 0), 0)
    const latest = entries
      .map((entry) => entry.updated || entry.date || '')
      .filter(Boolean)
      .sort((a, b) => String(b).localeCompare(String(a)))[0] || ''

    return {
      entries: entries.length,
      totalWords,
      readingMinutes,
      latest,
    }
  })

  const footerMeta = computed(() => buildSiteFooterMeta(siteConfig, {
    hostname: hostname.value,
    now: new Date(now.value),
  }))
  const uptime = computed(() => formatSiteUptime(siteConfig.startedAt, now.value))
  const repositoryUrl = `https://github.com/${siteConfig.githubUser}/${siteConfig.githubRepo}`
  const githubProfileUrl = `https://github.com/${siteConfig.githubUser}`

  onMounted(() => {
    startClock()
    void loadCaptureCount()
  })
  onBeforeUnmount(stopClock)

  return {
    config: siteConfig,
    stats,
    contentSummary,
    captureCount: readonly(captureCount),
    footerMeta,
    uptime,
    repositoryUrl,
    githubProfileUrl,
    loadCaptureCount,
  }
}

