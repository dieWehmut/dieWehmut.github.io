import { ref } from 'vue'

export const games = ref([
  {
    name: 'Games',
    autoLoad: true,
    description: 'Static games list',
    manualItems: [
      {
        name: 'PhantomGenesis',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/PhantomGenesis',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: 'Contact the site owner for access',
        date: '2025-06-30',
      },
      {
        name: 'GeistZerfall',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/GeistZerfall',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: 'Contact the site owner for access',
        date: '2025-12-21',
      },
      {
        name: 'SugisarishiKage',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/SugisarishiKage',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: 'Contact the site owner for access',
        date: '2025-09-11',
      },
      {
        name: 'LeereRiss',
        html_url: 'https://github.com/dieWehmut/LeereRiss/releases/latest',
        repo_url: 'https://github.com/dieWehmut/LeereRiss',
        showDownload: true,
        downloadToast: false,
        downloadToastMessage: 'Download started',
        date: '2025-11-02',
      },
    ],
  },
])

export default games
