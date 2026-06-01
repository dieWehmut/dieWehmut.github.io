// GitHub API utilities

export function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }

  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function getGitHubToken(): string {
  return import.meta.env.VITE_GITHUB_TOKEN || ''
}
