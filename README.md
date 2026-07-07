# diesw-nexus

<p align="center">
  <img src="https://count.getloli.com/get/@dieWehmut.github.io?theme=rule34" alt="Visitors">
</p>

<div align="center">

<a href="https://diewehmut.github.io/" target="_blank">
  <img src="https://img.shields.io/badge/LIVE-SITE-F9D553?style=flat-square&logo=google-chrome&logoColor=white&labelColor=555555" alt="Live Site">
</a>
<a href="https://github.com/dieWehmut/diesuwa-starter" target="_blank">
  <img src="https://img.shields.io/badge/TEMPLATE-diesuwa--starter-1FC41F?style=flat-square&logo=github&logoColor=white&labelColor=555555" alt="Template">
</a>
<a href="https://github.com/dieWehmut/sandkasten" target="_blank">
  <img src="https://img.shields.io/badge/BACKEND-Sandkasten-blue?style=flat-square&logo=serverless&logoColor=white&labelColor=555555" alt="Sandkasten">
</a>

</div>

---

## 关于本站

这是 **dieWehmut** 的个人站点源码仓库，在线地址：<https://diewehmut.github.io/>。

站点基于 `Vue 3 + Vite + TypeScript + Element Plus` 构建，内容以 Markdown 撰写、GitHub Actions 自动部署到 GitHub Pages。从本仓库自动提取并维护的模板仓库可供快速搭建同类站点：

- 模板仓库：<https://github.com/dieWehmut/diesuwa-starter>
- 模板 Demo：<https://diewehmut.github.io/diesuwa-starter/>

## 功能特性

- 深色 / 浅色主题切换
- 动态背景效果
- Markdown 文章与笔记，支持 KaTeX 数学公式
- 归档、标签、搜索
- 友链页面
- 项目展示页（App / 游戏 / 网页 / 工具），可按类别开关
- 基础设施状态页，可开关
- Giscus 评论，可选
- 多语言界面（zh-CN / zh-TW / en / ja）
- 响应式移动端布局
- 在线代码运行（58 种语言 / 运行时）
- GitHub Pages 自动部署

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite 7 |
| 语言 | TypeScript |
| UI 组件 | Element Plus |
| 样式 | SCSS |
| 内容 | Markdown + frontmatter |
| 代码运行 | [Sandkasten](https://github.com/dieWehmut/sandkasten)（58 种运行时） |
| 部署 | GitHub Actions → GitHub Pages |

## 开发

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

默认本地开发地址：<http://localhost:5173>

## 代码运行

本站使用 [Sandkasten](https://github.com/dieWehmut/sandkasten) 后端运行代码，支持 58 种语言 / 运行时。本地联调时先启动 Sandkasten API，再运行本站：

```bash
VITE_CODE_RUNNER_API_URL=http://127.0.0.1:8080 pnpm dev
```

线上 GitHub Pages 需要把仓库变量 `VITE_CODE_RUNNER_API_URL` 设为 HTTPS Sandkasten API 地址；`VITE_CODE_RUNNER_API_TOKEN` 会被打进前端产物，只能放公开的客户端 token。

## 内容位置

| 内容 | 位置 | 格式 |
|------|------|------|
| 站点配置 | `src/data/site/config.ts` | TypeScript |
| About 页面 | `src/data/site/about.md` | Markdown |
| 友链 | `src/data/site/friends.ts` | TypeScript 数组 |
| 项目 | `src/data/site/app.ts`、`game.ts`、`page.ts`、`tool.ts` | TypeScript |
| 基础设施 | `src/data/site/infra.ts` | TypeScript 数组 |
| 文章 | `src/data/docs/posts/*.md` | Markdown + frontmatter |
| 笔记 | `src/data/docs/notes/*.md` | Markdown + frontmatter |

模板相关说明请看模板仓库：<https://github.com/dieWehmut/diesuwa-starter>
