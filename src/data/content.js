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
      manualItems: [
        // 手动添加示例：
      {
        name: "PhantomGenesis", // 游戏名称
        html_url: "https://example.com/game.zip", // 下载链接
        repo_url: "https://github.com/dieWehmut/PhantomGenesis", // 仓库/详情链接（点击行、Repo按钮使用）
        showDownload: true, // false 时隐藏下载按钮
        downloadToast: true, // true 时点击下载按钮仅弹提示
        downloadToastMessage: "私聊站长要哦~"
      },
      {
        name: "GeistZerfall", // 游戏名称
        html_url: "https://example.com/game.zip", // 下载链接
        repo_url: "https://github.com/dieWehmut/GeistZerfall", // 仓库/详情链接（点击行、Repo按钮使用）
        showDownload: true, // false 时隐藏下载按钮
        downloadToast: true, // true 时点击下载按钮仅弹提示
        downloadToastMessage: "私聊站长要哦~"
      },
      {
        name: "SugisarishiKage", // 游戏名称
        html_url: "https://example.com/game.zip", // 下载链接
        repo_url: "https://github.com/dieWehmut/SugisarishiKage", // 仓库/详情链接（点击行、Repo按钮使用）
        showDownload: true, // false 时隐藏下载按钮
        downloadToast: true, // true 时点击下载按钮仅弹提示
        downloadToastMessage: "私聊站长要哦~"
      },
      ],
    },
  ]);

  const apps = ref([
    {
      name: "Apps",
      autoLoad: true, // Flag to indicate this should use ReleasesAutoLoader
      repoUrl: "https://github.com/dieWehmut/Showcase",
      description: "Automatically loaded from GitHub releases",
      manualItems: [
        // 手动添加示例：
      {
        name: "SugisarishiKage",
        html_url: "https://example.com/app.apk",
        repo_url: "https://github.com/dieWehmut/SugisarishiKage",
        showDownload: true,
        downloadToast: true,
        downloadToastMessage: "私聊站长要哦~"
      }
      ],
    },
  ]);

  const tools = ref([
    {
      name: "Tools",
      autoLoad: true,
      owner: "dieWehmut",
      repo: "Gajetto",
      description: "Automatically loaded from GitHub repository folders",
      manualItems: [
        // 手动添加示例：
        // {
        //   name: "My Manual Tool",
        //   html_url: "https://github.com/your/repo/releases/download/v1.0/tool.zip", // 下载链接（可选）
        //   repo_url: "https://github.com/your/repo", // 仓库/详情链接
        //   showDownload: true,
        //   downloadToast: true,
        //   downloadToastMessage: "私聊站长要哦~",
        //   lastModified: "2026-02-28T10:30:00Z"
        // }
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

  return { pages, games, apps, files, tools };
}
