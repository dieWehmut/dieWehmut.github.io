import { ref } from 'vue';

export function useContent() {
  // Pages section - Auto-loaded from GitHub repositories with homepage set
  // Will scan dieWehmut and dieSehnsucht organizations for repos with website
  const pages = ref([
    {
      name: "Pages",
      autoLoad: true, // Flag to indicate this should use PagesAutoLoader
      owners: ["dieWehmut", "dieSehnsucht"],
      description: "Automatically loaded from GitHub repositories with homepage",
    },
  ]);

  const games = ref([
    {
      name: "Games",
      autoLoad: true, // Flag to indicate this should use ReleasesAutoLoader
      repoUrl: "https://github.com/dieWehmut/Showcase",
      description: "Automatically loaded from GitHub releases",
    },
  ]);

  const apps = ref([
    {
      name: "Apps",
      autoLoad: true, // Flag to indicate this should use ReleasesAutoLoader
      repoUrl: "https://github.com/dieWehmut/Showcase",
      description: "Automatically loaded from GitHub releases",
    },
  ]);

  // Files section no longer needs manual per-file listings.
  // Provide a single entry pointing to the GitHub repo that will be enumerated dynamically by the FileItem component.
  const files = ref([
    {
      name: "Files",
      repoUrl: "https://github.com/dieWehmut/Files",
      description: "Repository listing (fetched from GitHub)",
    },
  ]);

  return { pages, games, apps, files };
}
