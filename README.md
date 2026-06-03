# diesuwa-starter

`diesuwa-starter` 是一个基于 `Vue 3 + Vite + TypeScript + Element Plus + Tailwind CSS` 的个人站点项目，内容以本地 Markdown 和静态 TypeScript 数据为主，适合部署到 GitHub Pages 一类静态托管平台。

当前站点包含这些能力：

- 文章、笔记与 About 页面 Markdown 渲染
- 项目、友链、基础设施导航页
- 明暗主题切换
- 动态背景与动画降级
- Giscus 评论
- 多语言切换
- 前端全文搜索

## 开发环境

- Node.js 18+
- pnpm 8+（推荐）或 npm

## 常用命令

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

默认本地开发地址：

- `http://localhost:5173`

## 内容与配置位置

核心数据都放在 `src/data` 下：

- `src/data/site/config.ts`：站点基础配置
- `src/data/site/about.md`：About 页面内容
- `src/data/site/friends.ts`：友链
- `src/data/site/page.ts`：网站类项目
- `src/data/site/app.ts`：应用类项目
- `src/data/site/game.ts`：游戏类项目
- `src/data/site/tool.ts`：工具类项目
- `src/data/site/infra.ts`：基础设施入口
- `src/data/docs/posts/*.md`：文章
- `src/data/docs/notes/*.md`：笔记

Markdown 文档支持简单 frontmatter，例如：

```md
---
title: My First Post
date: 2026-05-28
tags: [hello, intro]
---

正文内容，支持代码高亮与 KaTeX 数学公式。
```

## 评论配置

项目使用 Giscus。把 `.env.example` 复制为 `.env.local` 后填写这些变量：

```env
VITE_GISCUS_REPO=
VITE_GISCUS_REPO_ID=
VITE_GISCUS_CATEGORY=General
VITE_GISCUS_CATEGORY_ID=
VITE_GISCUS_MAPPING=pathname
VITE_GISCUS_STRICT=0
VITE_GISCUS_REACTIONS_ENABLED=1
VITE_GISCUS_INPUT_POSITION=bottom
VITE_GISCUS_THEME=nexus
VITE_GISCUS_LANG=zh-CN
```

## 当前工程约定

- Markdown 在构建时通过 `import.meta.glob` 收集
- 搜索索引在前端运行时从本地内容聚合生成
- 主题、语言、动态背景偏好保存在 `localStorage`
- GitHub Pages 通过构建后的 `404.html` 兼容 SPA 刷新

## 质量检查

本仓库当前至少应通过这两个检查：

```bash
pnpm typecheck
pnpm build
```
