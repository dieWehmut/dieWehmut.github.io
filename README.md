# diesw-nexus

<p align="center">
  <img src="https://count.getloli.com/get/@dieWehmut.github.io?theme=rule34" alt="Visitors">
</p>

这是我的个人网站。

- 个人网站：<https://diewehmut.github.io/>
- 提取出的模板仓库：<https://github.com/dieWehmut/diesuwa-starter>
- 模板 Demo：<https://diewehmut.github.io/diesuwa-starter/>

这个仓库保存个人站点源码与内容，包含文章、笔记、项目、友链、标签、搜索、动态背景、Giscus 评论和 GitHub Pages 部署配置。

## 开发

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

默认本地开发地址：

- <http://localhost:5173>

## 内容位置

- `src/data/site/config.ts`：站点基础配置
- `src/data/site/about.md`：About 页面内容
- `src/data/site/*.ts`：友链、项目、基础设施等静态数据
- `src/data/docs/posts/*.md`：文章
- `src/data/docs/notes/*.md`：笔记

模板相关说明请看 `diesuwa-starter`：

- <https://github.com/dieWehmut/diesuwa-starter>
