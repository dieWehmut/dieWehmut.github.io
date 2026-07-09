<h1 align="center">diesuwa-starter</h1>

<p align="center">
  <img src="https://count.getloli.com/get/@diesuwa-starter?theme=rule34" alt="Visitors">
</p>

<div align="center">

<a href="https://diewehmut.github.io/diesuwa-starter/" target="_blank">
  <img src="https://img.shields.io/badge/%E6%A8%A1%E6%9D%BF-DEMO-1FC41F?style=flat-square&logo=githubpages&logoColor=white&labelColor=555555" alt="模板 Demo">
</a>
<a href="https://diewehmut.github.io/" target="_blank">
  <img src="https://img.shields.io/badge/%E6%88%90%E5%93%81-DEMO-F9D553?style=flat-square&logo=google-chrome&logoColor=white&labelColor=555555" alt="成品 Demo">
</a>
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

<div align="center">

简体中文 | [繁體中文](docs/README.zh-TW.md) | [English](docs/README.en.md)

</div>

---

`diesuwa-starter` 是一个基于 `Vue 3 + Vite + TypeScript + Element Plus` 的个人站点模板，适合用来搭建博客、笔记、项目展示、友链页和轻量级状态看板。它可以部署到 GitHub Pages，也可以部署到 Vercel、Netlify、Cloudflare Pages 等静态托管平台。

如果你希望长期跟进模板更新，推荐使用 **Fork**，而不是 `Use this template`。Fork 会保留上游仓库关系，后续可以直接同步最新模板代码。

## 示例

- 模板仓库：<https://github.com/dieWehmut/diesuwa-starter>
- 模板示例：<https://diewehmut.github.io/diesuwa-starter/>
- 成品示例：<https://diewehmut.github.io/>

## 功能

- 深色 / 浅色主题切换
- 动态背景效果
- Markdown 文章与笔记
- KaTeX 数学公式
- 归档、标签、搜索
- 友链页面
- 项目展示页，可通过配置关闭
- 基础设施状态页，可通过配置关闭
- Giscus 评论，可选
- 多语言界面
- 响应式移动端布局
- GitHub Pages 自动部署

## 快速开始

### 1. Fork 仓库

在 GitHub 打开 <https://github.com/dieWehmut/diesuwa-starter>，点击 `Fork`，创建到自己的账号或组织下。

然后克隆你的 Fork：

```bash
git clone https://github.com/YOUR_USERNAME/diesuwa-starter.git
cd diesuwa-starter
git remote add upstream https://github.com/dieWehmut/diesuwa-starter.git
```

如果你已经用 `Use this template` 创建了仓库，也可以继续使用，只是后续同步上游会麻烦一些。建议手动添加上游：

```bash
git remote add upstream https://github.com/dieWehmut/diesuwa-starter.git
```

### 2. 安装依赖

推荐使用 pnpm：

```bash
pnpm install
```

也可以使用 npm：

```bash
npm install
```

### 3. 修改站点配置

优先编辑 `src/data/site/config.ts`：

```ts
export const siteConfig = {
  githubUser: 'your-github-username',
  githubRepo: 'your-repo-name',
  owner: 'your-name',
  displayName: 'your-name',
  email: 'you@example.com',

  title: 'my-nexus',
  subtitle: 'my-nexus',
  description: 'Hi! This is my personal site.',
  siteUrl: 'https://your-github-username.github.io/your-repo-name',
  startedAt: '2026-01-01T00:00:00+08:00',

  googleAnalyticsId: '',

  icpNumber: '',
  icpText: '',

  enableInfra: false,
  enableProject: false,

  links: [
    { label: 'GitHub', url: 'https://github.com/your-github-username' },
  ],
}
```

几个容易忽略的字段：

- `githubUser`：你的 GitHub 用户名或组织名。
- `githubRepo`：部署这个站点的仓库名。
- `siteUrl`：最终访问地址。项目页仓库通常是 `https://YOUR_USERNAME.github.io/YOUR_REPO/`。
- `enableInfra`：是否显示基础设施状态页。
- `enableProject`：是否显示项目展示页。

### 4. 配置 GitHub Pages 路径

如果仓库名是 `YOUR_USERNAME.github.io`，或者你使用自定义域名，`vite.config.ts` 里的 `base` 保持 `/` 即可。

如果部署到项目页仓库，例如 `https://YOUR_USERNAME.github.io/diesuwa-starter/`，请把 `vite.config.ts` 里的：

```ts
const base = '/'
```

改成：

```ts
const base = '/diesuwa-starter/'
```

如果你把仓库改名为 `my-site`，这里就写：

```ts
const base = '/my-site/'
```

### 5. 添加内容

| 内容 | 位置 | 格式 |
|---|---|---|
| 文章 | `src/data/docs/posts/*.md` | Markdown + frontmatter |
| 笔记 | `src/data/docs/notes/*.md` | Markdown + frontmatter |
| 关于页 | `src/data/site/about.md` | Markdown |
| 友链 | `src/data/site/friends.ts` | TypeScript 数组 |
| 项目 | `src/data/site/app.ts`, `game.ts`, `page.ts`, `tool.ts` | TypeScript |
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

### 6. 本地运行

```bash
pnpm dev
```

默认地址是 `http://localhost:5173`。

构建检查：

```bash
pnpm build
```

预览生产构建：

```bash
pnpm preview
```

## 部署到 GitHub Pages

模板自带 `.github/workflows/deploy.yml`。推送到 `main` 后会自动构建并部署。

你需要在 GitHub 仓库里确认：

1. 进入 `Settings -> Pages`。
2. `Source` 选择 `GitHub Actions`。
3. 如果使用项目页仓库，确认 `vite.config.ts` 的 `base` 与仓库名一致。
4. 如果使用自定义域名，在 `public/CNAME` 写入域名，并在 DNS 里配置到 GitHub Pages。

部署完成后，GitHub Actions 的 `Deploy to GitHub Pages` 任务会给出最终访问地址。

## 部署到 Vercel / Netlify / Cloudflare Pages

通用配置：

- Framework preset：`Vite`
- Install command：`pnpm install`
- Build command：`pnpm build`
- Output directory：`dist`
- Node.js：建议 `20`

如果平台部署在域名根路径，`vite.config.ts` 的 `base` 使用 `/`。如果部署在子路径，需要按平台文档配置子路径并同步修改 `base`。

## Giscus 评论

评论功能是可选的。先在 <https://giscus.app> 为你的仓库生成配置，然后复制 `.env.example`：

```bash
cp .env.example .env.local
```

填入：

```env
VITE_GISCUS_REPO=your-username/your-repo
VITE_GISCUS_REPO_ID=R_xxxxx
VITE_GISCUS_CATEGORY=Announcements
VITE_GISCUS_CATEGORY_ID=DIC_xxxxx
```

这些 `VITE_` 变量会被打包进前端，请不要放入私密 token。部署到 GitHub Pages 时，可以提交只包含公开 Giscus ID 的 `.env.production`，也可以把变量写入 GitHub Actions 的 `env`。

## 同步上游更新

如果你是 Fork 仓库，GitHub 页面上通常会出现 `Sync fork` 按钮，点击即可同步上游。

也可以用命令行同步：

```bash
git remote -v
git fetch upstream
git checkout main
git merge upstream/main
pnpm install
pnpm build
git push origin main
```

如果出现冲突，优先保留你自己的站点内容文件，例如：

- `src/data/site/config.ts`
- `src/data/site/about.md`
- `src/data/site/friends.ts`
- `src/data/site/app.ts`
- `src/data/site/game.ts`
- `src/data/site/page.ts`
- `src/data/site/tool.ts`
- `src/data/site/infra.ts`
- `src/data/docs/posts/**`
- `src/data/docs/notes/**`

处理冲突后运行：

```bash
pnpm build
git status
git add .
git commit
git push origin main
```

如果你是用 `Use this template` 创建的仓库，第一次合并上游时可能需要：

```bash
git fetch upstream
git merge upstream/main --allow-unrelated-histories
```

长期维护仍然建议改成 Fork 工作流。

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
pnpm build
pnpm preview
```

## 自定义建议

- 主题颜色：修改 `src/styles/theme/`。
- 字体：替换 `src/assets/fonts/` 并更新 `src/styles/fonts/index.scss`。
- 背景效果：修改 `src/components/background/`。
- 多语言：修改 `src/locales/`。
- 页面开关：修改 `src/data/site/config.ts`。
- 项目与内容：优先改 `src/data/site/` 和 `src/data/docs/`，减少和模板核心代码的冲突。

## 贡献指南

欢迎提交 Issue 和 Pull Request。为了让维护和同步更顺畅，请尽量遵守这些约定：

1. 大改动先开 Issue 说明动机、影响范围和预期行为。
2. 从最新 `main` 新建分支，例如 `feat/search-polish` 或 `fix/pages-base`。
3. 保持改动聚焦，不要把个人站点内容和模板功能改动混在同一个 PR。
4. 提交前运行 `pnpm build`。
5. 如果改动影响配置、部署或使用方式，同步更新 README。
6. PR 描述里写清楚改了什么、如何验证、是否有兼容性影响。

## 许可

MIT
