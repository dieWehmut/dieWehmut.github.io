import { ref } from 'vue'
import { siteConfig } from './config'

export const tools = ref([
  {
    name: 'Tools',
    autoLoad: true,
    owner: siteConfig.githubUser,
    repo: 'renameFile',
    description: 'Static tools list',
    manualItems: [
      {
        name: 'renameFile',
        html_url: 'https://github.com/dieWehmut/renameFile',
        repo_url: 'https://github.com/dieWehmut/renameFile',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
        lastModified: '2025-10-26',
      },
    ],
  },
])

export default tools
