<h1 align="center">diesuwa-starter</h1>

<p align="center">
  <img src="https://count.getloli.com/get/@diesuwa-starter?theme=rule34" alt="Visitors">
</p>

<div align="center">

<div>
<a href="https://diewehmut.github.io/diesuwa-starter/" target="_blank">
  <img src="https://img.shields.io/badge/%E6%A8%A1%E6%9D%BF-DEMO-1FC41F?style=flat-square&logo=githubpages&logoColor=white&labelColor=555555" alt="模板 Demo">
</a>
<a href="https://diewehmut.github.io/" target="_blank">
  <img src="https://img.shields.io/badge/%E6%88%90%E5%93%81-DEMO-F9D553?style=flat-square&logo=google-chrome&logoColor=white&labelColor=555555" alt="成品 Demo">
</a>
</div>

<div>
<a href="https://vuejs.org/" target="_blank">
  <img src="https://img.shields.io/badge/VUE-3-42B883?style=flat-square&logo=vuedotjs&logoColor=white&labelColor=555555" alt="Vue 3">
</a>
<a href="https://vite.dev/" target="_blank">
  <img src="https://img.shields.io/badge/VITE-7-646CFF?style=flat-square&logo=vite&logoColor=white&labelColor=555555" alt="Vite">
</a>
<a href="https://github.com/dieWehmut/diesuwa-starter/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/LICENSE-MIT-green?style=flat-square&logo=github&logoColor=white&labelColor=555555" alt="License">
</a>
</div>

</div>

<div align="center">

简体中文 | [繁體中文](docs/README.zh-TW.md) | [English](docs/README.en.md) | [日本語](docs/README.ja.md)

</div>

---

`diesuwa-starter` 是一个基于 `Vue 3 + Vite + TypeScript + Element Plus` 的个人站点模板，集成了 **Sandkasten 在线代码沙箱** 与 **Uptime Kuma 服务器监控**，适合搭建博客、笔记、项目展示、友链页和带运维看板的静态资料页。模板可以直接部署到 GitHub Pages，也支持 Vercel / Netlify 等静态托管平台。

## 示例

- 示例仓库：<https://github.com/dieWehmut/dieWehmut.github.io>
- 模板示例：<https://diewehmut.github.io/diesuwa-starter/>
- 成品示例：<https://diewehmut.github.io/>

如果模板示例无法打开，请先检查仓库 `Settings -> Pages -> Source` 是否设置为 `GitHub Actions`。模板的部署工作流会自动为项目页仓库设置 Vite `base`，例如 `diesuwa-starter` 会构建为 `/diesuwa-starter/`。

## 功能

- 深色 / 浅色主题切换
- 动态背景效果
- Markdown 文章与笔记
- KaTeX 数学公式
- 归档、标签、搜索
- 友链页面
- 项目展示页，可关闭
- 基础设施状态页（可关闭），支持接入 [Uptime Kuma](https://github.com/louislam/uptime-kuma) 公开状态页，自动渲染心跳/延迟
- 内置 [Sandkasten](https://github.com/dieWehmut/sandkasten) 在线代码沙箱前端，可直接在文章中跑代码
- Giscus 评论，可选
- 多语言界面
- 响应式移动端布局
- GitHub Pages 自动部署

## 快速开始

### 1. 创建仓库

在 GitHub 点击 `Use this template`，或手动克隆：

```bash
git clone https://github.com/dieWehmut/diesuwa-starter.git my-site
cd my-site
rm -rf .git
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 修改个人配置

编辑 `src/data/site/config.ts`：

```ts
export const siteConfig = {
  githubUser: 'your-github-username',
  githubRepo: 'your-github-username.github.io',
  owner: 'your-name',
  displayName: 'your-name',
  email: 'you@example.com',

  title: 'my-nexus',
  subtitle: 'my-nexus',
  description: 'Hi! This is my personal site.',
  siteUrl: 'https://your-github-username.github.io',
  startedAt: '2026-05-01T00:00:00+08:00',

  googleAnalyticsId: '',

  icpNumber: '',
  icpText: '',

  enableInfra: false,
  enableProject: false,

  codeRunner: {
    backendApiUrl: import.meta.env.VITE_CODE_RUNNER_API_URL || '',
    backendToken: import.meta.env.VITE_CODE_RUNNER_API_TOKEN || '',
  },

  links: [
    { label: 'GitHub', url: 'https://github.com/your-github-username' },
  ],
}
```

如果部署到 `https://YOUR_USERNAME.github.io/YOUR_REPO/`，请把 `siteUrl` 改成完整地址。工作流会自动处理构建路径。

### 4. 添加内容

| 内容 | 位置 | 格式 |
|---|---|---|
| 文章 | `src/data/docs/posts/*.md` | Markdown + frontmatter |
| 笔记 | `src/data/docs/notes/*.md` | Markdown + frontmatter |
| 关于页 | `src/data/site/about.md` | Markdown |
| 友链 | `src/data/site/friends.ts` | TypeScript 数组 |
| 项目 | `src/data/site/app.ts`、`game.ts`、`page.ts`、`tool.ts` | TypeScript |
| 基础设施 | `src/data/site/infra.ts` | TypeScript 数组 |

Frontmatter 示例：

```markdown
---
title: 我的第一篇文章
date: 2026-05-28
tags: [hello, intro]
---

这里写正文。支持代码高亮、表格、链接、图片和 KaTeX 数学公式。
```

### 5. 本地运行

```bash
pnpm dev
```

默认地址是 `http://localhost:5173`。

### 6. 部署到 GitHub Pages

模板自带 `.github/workflows/deploy.yml`。推送到 `main` 后会自动构建并部署。

你需要在 GitHub 仓库里确认：

1. 进入 `Settings -> Pages`
2. `Source` 选择 `GitHub Actions`
3. 如果仓库名不是 `YOUR_USERNAME.github.io`，访问地址会是 `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Giscus 评论

复制 `.env.example` 为 `.env.local`，然后填入 Giscus 配置：

```env
VITE_GISCUS_REPO=your-username/your-repo
VITE_GISCUS_REPO_ID=R_xxxxx
VITE_GISCUS_CATEGORY=Announcements
VITE_GISCUS_CATEGORY_ID=DIC_xxxxx
```

为空时评论区会自动隐藏。

## Go 代码运行

模板统一使用 Sandkasten 后端运行代码。部署前请配置：

```env
VITE_CODE_RUNNER_API_URL=https://your-sandkasten-api.example.com
VITE_CODE_RUNNER_API_TOKEN=
```

`VITE_CODE_RUNNER_API_TOKEN` 会出现在构建后的前端 JavaScript 中，不要把私密服务端 token 放在这里；生产环境应使用公开客户端 token、限流网关或反向代理。

## 项目结构

```text
src/
  data/
    site/
      config.ts
      about.md
      friends.ts
      app.ts
      game.ts
      page.ts
      tool.ts
      infra.ts
    docs/
      posts/
      notes/
  components/
  composables/
  layouts/
  views/
  styles/
  locales/
  utils/
```

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

## 自定义建议

- 主题颜色：修改 `src/styles/theme/`
- 字体：替换 `src/assets/fonts/` 并更新 `src/styles/fonts/index.scss`
- 背景效果：修改 `src/components/background/`
- 多语言：修改 `src/locales/`
- 页面开关：修改 `src/data/site/config.ts`

## 许可

MIT
