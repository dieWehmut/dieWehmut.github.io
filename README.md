# Nexus

一个基于 Vite + Vue 的静态前端项目，包含多语言支持、组件化页面自动加载与若干工具组件。此仓库用于演示与发布小型网页应用（如资源目录、页面集合或演示站点）。

## 项目结构（概览）

- `index.html`：应用入口页面
- `package.json`：依赖与脚本
- `vite.config.js`：Vite 配置
- `src/`：源码目录
	- `main.js`：应用引导
	- `App.vue`：根组件
	- `i18n.js`：国际化初始化
	- `components/`：Vue 组件集合（页面与 UI 组件）
	- `assets/`：静态样式与资源（如 `global.css`）
	- `data/content.js`：页面/条目数据源
	- `locales/`：多语言 JSON 文件（`en.json`、`zh.json` 等）
	- `utils/`：工具脚本（缓存、网络请求、Toast 等）

## 主要功能说明

- 多语言支持：使用 `src/i18n.js` 加载 `locales` 下的语言文件。
- 页面自动加载：`PagesAutoLoader.vue` / `ReleasesAutoLoader.vue` 用于基于 `data/content.js` 动态生成列表或页面项。
- 组件库：包含 `SearchBar.vue`、`SideBar.vue`、`FloatButton.vue` 等常用 UI 组件，便于在不同页面复用。
- 小工具：`utils/github.js` 用于与 GitHub 接口交互，`apiCache.js` 提供简单的请求缓存策略。