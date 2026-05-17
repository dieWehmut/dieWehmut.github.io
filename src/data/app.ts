import { ref } from 'vue'

export const apps = ref([
  {
    name: 'Apps',
    autoLoad: true,
    description: 'Static apps list',
    manualItems: [
      {
        name: 'SugisarishiKage',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/SugisarishiKage',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: '私聊站长要哦~',
        date: '2025-09-11',
      },
      {
        name: 'GeistZerfall',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/GeistZerfall',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: '私聊站长要哦~',
        date: '2025-12-21',
      },
      {
        name: 'kotoba-hitomi',
        html_url: 'https://github.com/dieWehmut/kotoba-hitomi/releases/latest',
        repo_url: 'https://github.com/dieWehmut/kotoba-hitomi',
        showDownload: true,
        downloadToast: false,
        downloadToastMessage: '开始下载',
        date: '2025-10-01',
      },
    ],
  },
])

export default apps
