<h1 align="center">Vorlage</h1>

<p align="center">
  <img src="https://count.getloli.com/get/@Vorlage?theme=rule34" alt="Visitors">
</p>

<div align="center">

<a href="https://diewehmut.github.io/Vorlage/" target="_blank">
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
<a href="https://github.com/dieWehmut/Vorlage/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/LICENSE-MIT-green?style=flat-square&logo=github&logoColor=white&labelColor=555555" alt="License">
</a>

</div>

<div align="center">

简体中文 | [繁體中文](docs/README.zh-TW.md) | [English](docs/README.en.md)

</div>

---

`Vorlage` 是一个基于 `Vue 3 + Vite + TypeScript + Element Plus` 的个人站点模板，适合用来搭建博客、笔记、项目展示、友链页和轻量级状态看板。它可以部署到 GitHub Pages，也可以部署到 Vercel、Netlify、Cloudflare Pages 等静态托管平台。

如果你希望长期跟进模板更新，推荐使用 **Fork**，而不是 `Use this template`。Fork 会保留上游仓库关系，后续可以直接同步最新模板代码。

## 示例

- 模板仓库：<https://github.com/dieWehmut/Vorlage>
- 模板示例：<https://diewehmut.github.io/Vorlage/>
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

在 GitHub 打开 <https://github.com/dieWehmut/Vorlage>，点击 `Fork`，创建到自己的账号或组织下。

然后克隆你的 Fork：

```bash
git clone https://github.com/YOUR_USERNAME/Vorlage.git
cd Vorlage
git remote add upstream https://github.com/dieWehmut/Vorlage.git
```

如果你已经用 `Use this template` 创建了仓库，也可以继续使用，只是后续同步上游会麻烦一些。建议手动添加上游：

```bash
git remote add upstream https://github.com/dieWehmut/Vorlage.git
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
  templateRepoUrl: 'https://github.com/dieWehmut/Vorlage',
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
- `templateRepoUrl`：这份代码的来源仓库。控制台首屏 `LINKS` 段的 `template` 一行就指向它。fork 之后通常保持不变 —— 你自己的仓库不是你 fork 的那个模板。
- `siteUrl`：最终访问地址。项目页仓库通常是 `https://YOUR_USERNAME.github.io/YOUR_REPO/`。
- `enableInfra`：是否显示基础设施状态页。
- `enableProject`：是否显示项目展示页。

### 4. 配置 GitHub Pages 路径

仓库自带的 GitHub Actions workflow 会根据 `GITHUB_REPOSITORY` 自动设置 Vite 的 `BASE_PATH`：用户页仓库和自定义域名使用 `/`，项目页仓库使用 `/<仓库名>/`。部署到 GitHub Pages 时不需要手动修改 `vite.config.ts`。

本地构建或部署到其他平台时，默认路径是 `/`。如果平台使用子路径，可以通过环境变量覆盖：

```bash
BASE_PATH=/my-site/ pnpm build
```

也可以使用 `VITE_BASE_PATH`，两者都只影响构建产物中的资源路径。

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
3. 如果使用项目页仓库，workflow 会自动根据仓库名设置资源路径，无需修改 `vite.config.ts`。
4. 如果使用自定义域名，在 `public/CNAME` 写入域名，并在 DNS 里配置到 GitHub Pages。

部署完成后，GitHub Actions 的 `Deploy to GitHub Pages` 任务会给出最终访问地址。

## 部署到 Vercel / Netlify / Cloudflare Pages

通用配置：

- Framework preset：`Vite`
- Install command：`pnpm install`
- Build command：`pnpm build`
- Output directory：`dist`
- Node.js：建议 `20`

如果平台部署在子路径，请按平台文档设置 `BASE_PATH` 或 `VITE_BASE_PATH`，再运行构建命令；不需要改动源码中的 `vite.config.ts`。

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

## Infra 页面探测

Infra 页面只把最终 HTTP 状态精确为 `200` 的服务显示为 online；`201`、`204`、重定向、错误状态和网络异常全部显示为 offline。

生产环境如果目标服务没有允许 GitHub Pages 来源的 CORS 响应，请配置公开的探测代理：

```yaml
VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}
```

代理需要提供 `GET /api/ping?url=<encoded-target>`，仅在上游最终状态为 `200` 时返回 HTTP `200` 和 `{ "online": true }`。代理必须允许部署站点的无凭据跨域请求，并限制上游主机白名单，避免变成 SSRF/open proxy。`VITE_INFRA_PROBE_URL` 会被嵌入公开的前端构建产物，不能放置密钥。

Pages 构建会从 `src/data/site/infra.ts` 生成 `public/infra-status.json`。GitHub Actions 服务端按最终 HTTP 状态探测并写入快照，前端优先读取同源快照，代理不可用时再回退到代理或浏览器直连。工作流每 15 分钟运行一次；手动运行 `pnpm infra:status:sync` 可刷新快照。不支持 CORS 且没有可用快照或代理的目标仍会显示 offline。

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
