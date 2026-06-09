# diesw-nexus

<p align="center">
  <img src="https://count.getloli.com/get/@dieWehmut.github.io?theme=rule34" alt="Visitors">
</p>

- 提取出的模板仓库：<https://github.com/dieWehmut/diesuwa-starter>
- 模板 Demo：<https://diewehmut.github.io/diesuwa-starter/>

## 开发

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

默认本地开发地址：

- <http://localhost:5173>

## Go 代码运行

当前仓库默认使用 Sandkasten 后端模式。本地联调时先启动 `/root/sandkasten` 的 API，再在本站运行：

```bash
VITE_CODE_RUNNER_MODE=backend VITE_CODE_RUNNER_API_URL=http://127.0.0.1:8080 pnpm dev
```

可以用 `VITE_CODE_RUNNER_API_URL=http://127.0.0.1:8080 pnpm runner:smoke` 直接验证后端能运行 Go。

模板导出默认使用 `VITE_CODE_RUNNER_MODE=frontend`，可以不依赖后端直接运行。线上 GitHub Pages 如需后端模式，需要把仓库变量 `VITE_CODE_RUNNER_API_URL` 设为 HTTPS Sandkasten API；`VITE_CODE_RUNNER_API_TOKEN` 会被打进前端产物，只能放公开的客户端 token。

## 内容位置

- `src/data/site/config.ts`：站点基础配置
- `src/data/site/about.md`：About 页面内容
- `src/data/site/*.ts`：友链、项目、基础设施等静态数据
- `src/data/docs/posts/*.md`：文章
- `src/data/docs/notes/*.md`：笔记

模板相关说明请看 `diesuwa-starter`：

- <https://github.com/dieWehmut/diesuwa-starter>
