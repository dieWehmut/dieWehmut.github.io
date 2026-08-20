import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'
import templateIdentity from './template-identity.json'

export const templates = ref<SiteProjectGroup[]>([
  {
    name: '模板',
    autoLoad: true,
    owner: templateIdentity.owner,
    repo: templateIdentity.repositoryName,
    description: '静态模板列表',
    manualItems: [
      {
        name: templateIdentity.repositoryName,
        html_url: templateIdentity.repositoryUrl,
        repo_url: templateIdentity.repositoryUrl,
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
        lastModified: '2026-05-28',
      },
      {
        name: 'sandkasten',
        html_url: 'https://github.com/dieWehmut/sandkasten',
        repo_url: 'https://github.com/dieWehmut/sandkasten',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
        lastModified: '2026-06-10',
      },
    ],
  },
])

export default templates
