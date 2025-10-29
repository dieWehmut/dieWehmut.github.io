import { ref } from 'vue';

export function useContent() {
  const pages = ref([
    {
      name: "kotobahitomi",
      repoUrl: "https://github.com/dieWehmut/kotoba-hitomi",
      versions: [
        {
          version: "v1.4",
          date: "2025-06-03",
          log: "nihongo AI web app",
          url: "https://kotoba-hitomi.hc-dsw-nexus.me/",
        },
      ],
    },
    {
      name: "showcase",
      repoUrl: "https://github.com/dieWehmut/Showcase",
      versions: [
        {
          date: "2025-10-01",
          log: "Project and Product Showcase",
          url: "https://showcase.hc-dsw-nexus.me/",
        },
      ],
    },
    {
      name: "notes",
      repoUrl: "https://github.com/dieWehmut/notes/",
      versions: [
        {
          date: "2025-08-20",
          log: "my notes",
          url: "https://notes.hc-dsw-nexus.me/",
        },
      ],
    },
    {
    name: "profile",
    repoUrl: "https://github.com/dieWehmut/profile/",
      versions: [
        {
          date: "2025-08-16",
          log: "personal profile",
          url: "https://profile.hc-dsw-nexus.me/",
        },
      ],
    },
    {
    name: "nexus",
    repoUrl: "https://github.com/dieWehmut/dieWehmut.github.io/",
      versions: [
        {
          date: "2025-08-26",
          log: "nexus(This site)",
          url: "https://www.hc-dsw-nexus.me/",
        },
      ],
    }
  ]);

  const games = ref([
    {
      name: "PhantomGenesis",
      repoUrl: "https://github.com/dieWehmut/PhantomGenesis/",
      versions: [
        {
          version: "v1.3",
          date: "2025-06-30",
          log: "modified game",
          url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.3.zip",
        },
        {
          version: "v1.2",
          date: "2025-06-30",
          log: "first version release",
          url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.2.zip",
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
  ]);

  const files = ref([
    {
      name: "High School Notes",
      repoUrl: "https://git.nju.edu.cn/dieSehnsucht/learningmaterials/-/tree/main/HighSchoolNotes?ref_type=heads",
      description: "Math, Physics and Chemistry, etc.",
    },
    {
      name: "Personal Articles",
      repoUrl: "https://git.nju.edu.cn/dieWehmut/learningmaterials/-/tree/main/Blog",
      description: "My personal blog articles.",
    },
  ]);

  return { pages, games, apps, files };
}
