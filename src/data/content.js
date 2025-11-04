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
      name: "PhantomGenesis",
      repoUrl: "https://github.com/dieWehmut/PhantomGenesis/",
      versions: [
        {
          version: "v1.3",
          date: "2025-06-30",
          log: "Second version release",
          url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.3.zip",
        },
        {
          version: "v1.2",
          date: "2025-06-30",
          log: "Survival game",
          url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.2.zip",
        },
      ],
    },
        {
      name: "LeereRiss",
      repoUrl: "https://github.com/dieWehmut/LeereRiss/",
      versions: [
        {
          version: "v1.0",
          date: "2025-11-2",
          log: "Unity 3D game",
          url: "https://github.com/dieWehmut/Showcase/releases/download/LeereRiss/LeereRiss1.0_win.zip",
        },
      ],
    },
    {
      name: "Sugisarishi-Kage",
      repoUrl: "https://github.com/dieSehnsucht/SugisarishiKage",
      versions: [
        {
          date: "2025-10-1",
          log: "VN",
          url: "https://github.com/dieSehnsucht/SugisarishiKage/releases/download/v1.0/SugisarishiKage_win.7z",
        },
      ],
    },
  ]);

  const apps = ref([
    {
      name: "kotobahitomi_android",
      repoUrl: "https://github.com/dieWehmut/kotoba-hitomi",
      versions: [
        {
          version: "v1.0.0",
          date: "2025-06-03",
          log: "First app release",
          url: "https://github.com/dieWehmut/showcase/releases/download/kotobahitomi/kotobahitomi.apk",
        },
      ],
    },
    {
      name: "sugisarishi_kage_android",
      repoUrl: "https://github.com/dieSehnsucht/SugisarishiKage",
      versions: [
        {
          date: "2025-10-1",
          log: "VN",
          url: "https://github.com/dieSehnsucht/SugisarishiKage/releases/download/v1.0/SugisarishiKage_android.apk",
        },
      ],
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
