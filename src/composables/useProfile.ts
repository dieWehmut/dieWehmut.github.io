import { ref } from 'vue'
import { fetchWithCache } from '../utils/apiCache'
import { getGitHubHeaders } from '../utils/github'

const avatarUrl = ref('https://github.com/dieWehmut.png')
const displayName = ref('dieWehmut')
const lastUpdated = ref('2026-03-14')
const githubUrl = ref('https://github.com/dieWehmut')
let initialized = false

function formatDate(d: string) {
  try {
    const dt = new Date(d)
    if (isNaN(dt.valueOf())) return d || ''
    const Y = dt.getFullYear()
    const M = String(dt.getMonth() + 1).padStart(2, '0')
    const D = String(dt.getDate()).padStart(2, '0')
    return `${Y}-${M}-${D}`
  } catch {
    return d || ''
  }
}

async function loadProfile() {
  try {
    const data = await fetchWithCache(
      'https://api.github.com/users/dieWehmut',
      { headers: getGitHubHeaders() },
      1000 * 60 * 60
    )
    if (data?.avatar_url) avatarUrl.value = data.avatar_url
    const name = data?.name || data?.login
    if (name) displayName.value = name
    if (data?.html_url) githubUrl.value = data.html_url
  } catch (e) {}
}

async function loadLatestCommit() {
  try {
    const commits = await fetchWithCache(
      'https://api.github.com/repos/dieWehmut/dieWehmut.github.io/commits?per_page=1',
      { headers: getGitHubHeaders() },
      1000 * 60 * 60
    )
    if (Array.isArray(commits) && commits.length > 0) {
      const c = commits[0]
      const dateStr = c?.commit?.committer?.date || c?.commit?.author?.date
      if (dateStr) lastUpdated.value = formatDate(dateStr)
    }
  } catch (e) {}
}

function initProfile() {
  if (initialized) return
  initialized = true
  if (typeof window === 'undefined') return
  loadProfile()
  loadLatestCommit()
}

export function useProfile() {
  initProfile()
  return { avatarUrl, displayName, lastUpdated, githubUrl }
}
