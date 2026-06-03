export function getGitHubAvatarUrl(username: string): string {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(username)}`
}
