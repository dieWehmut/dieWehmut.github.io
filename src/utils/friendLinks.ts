import type { FriendLink } from '../types/content'

// Friends usually host their site on GitHub Pages, so the account is readable
// from the URL (`<login>.github.io`). When that is not the case we fall back to
// the login embedded in the GitHub avatar URL, and `FriendLink.github` overrides
// both for friends whose account cannot be inferred at all.

const GITHUB_PAGES_LOGIN = /^https?:\/\/([a-z0-9-]+)\.github\.io(?:\/|$)/i
const GITHUB_AVATAR_LOGIN = /^https?:\/\/avatars\.githubusercontent\.com\/([^/?#]+)/i

function githubProfileUrl(login: string | undefined): string | null {
  const value = login?.trim()
  if (!value) return null
  return `https://github.com/${value}`
}

/** GitHub profile for a friend link, or null when no account is known. */
export function friendGithubUrl(friend: FriendLink): string | null {
  const explicit = friend.github?.trim()
  if (explicit) return explicit

  const pagesLogin = friend.url?.match(GITHUB_PAGES_LOGIN)?.[1]
  if (pagesLogin) return githubProfileUrl(pagesLogin)

  return githubProfileUrl(friend.avatar?.match(GITHUB_AVATAR_LOGIN)?.[1])
}
