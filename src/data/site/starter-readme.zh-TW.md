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

[简体中文](../README.md) | 繁體中文 | [English](README.en.md) | [日本語](README.ja.md)

</div>

---

`diesuwa-starter` 是一個基於 `Vue 3 + Vite + TypeScript + Element Plus` 的個人網站模板，適合建立部落格、筆記、專案展示、友鏈頁與靜態個人頁。

## 示例

- 範例倉庫：<https://github.com/dieWehmut/dieWehmut.github.io>
- 模板示例：<https://diewehmut.github.io/diesuwa-starter/>
- 成品示例：<https://diewehmut.github.io/>

如果模板示例無法開啟，請確認倉庫 `Settings -> Pages -> Source` 已設定為 `GitHub Actions`。部署工作流程會自動為 GitHub Pages 子路徑設定 Vite `base`。

## 快速開始

```bash
git clone https://github.com/dieWehmut/diesuwa-starter.git my-site
cd my-site
pnpm install
pnpm dev
```

請先編輯 `src/data/site/config.ts`，再替換 `src/data` 下的範例文章、筆記、友鏈與專案資料。

## 部署

推送到 `main` 後，內建 GitHub Actions 會自動建置並部署到 GitHub Pages。

需要確認：

1. 進入 `Settings -> Pages`
2. `Source` 選擇 `GitHub Actions`
3. 如果不是 `YOUR_USERNAME.github.io` 倉庫，網址會是 `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

## 授權

MIT
