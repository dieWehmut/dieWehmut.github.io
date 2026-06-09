import { ref } from 'vue'
import { getGitHubAvatarUrl } from '../utils/githubAvatar'
import { siteConfig } from '../data/site/config'

const avatarUrl = ref(getGitHubAvatarUrl(siteConfig.githubUser))
const displayName = ref(siteConfig.githubUser)
const githubUrl = ref(`https://github.com/${siteConfig.githubUser}`)

export function useProfile() {
  return { avatarUrl, displayName, githubUrl }
}
