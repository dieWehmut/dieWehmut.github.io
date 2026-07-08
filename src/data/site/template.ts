import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'
import { siteConfig } from './config'

export const templates = ref<SiteProjectGroup[]>([
  {
    name: 'Templates',
    autoLoad: true,
    owner: siteConfig.githubUser,
    repo: 'diesuwa-starter',
    description: 'Static templates list',
    manualItems: [
      {
        name: 'diesuwa-starter',
        html_url: 'https://github.com/dieWehmut/diesuwa-starter',
        repo_url: 'https://github.com/dieWehmut/diesuwa-starter',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
      },
      {
        name: 'sandkasten',
        html_url: 'https://github.com/dieWehmut/sandkasten',
        repo_url: 'https://github.com/dieWehmut/sandkasten',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
      },
    ],
  },
])

export default templates
