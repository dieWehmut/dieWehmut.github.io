<h1 align="center">Vorlage</h1>

<p align="center">
  <img src="https://count.getloli.com/get/@Vorlage?theme=rule34" alt="Visitors">
</p>

<div align="center">

<div>
<a href="https://diewehmut.github.io/Vorlage/" target="_blank">
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
<a href="https://github.com/dieWehmut/Vorlage/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/LICENSE-MIT-green?style=flat-square&logo=github&logoColor=white&labelColor=555555" alt="License">
</a>
</div>

</div>

<div align="center">

[简体中文](../README.md) | 繁體中文 | [English](README.en.md) | [日本語](README.ja.md)

</div>

---

`Vorlage` 是一個基於 `Vue 3 + Vite + TypeScript + Element Plus` 的個人網站模板，整合了 **Sandkasten 線上程式碼沙箱** 與二值基礎設施連線狀態面板，適合建立部落格、筆記、專案展示、友鏈頁與帶運維儀表板的靜態個人頁。

## 示例

- 範例倉庫：<https://github.com/dieWehmut/dieWehmut.github.io>
- 模板示例：<https://diewehmut.github.io/Vorlage/>
- 成品示例：<https://diewehmut.github.io/>

如果模板示例無法開啟，請確認倉庫 `Settings -> Pages -> Source` 已設定為 `GitHub Actions`。部署工作流程會自動為 GitHub Pages 子路徑設定 Vite `base`。

## 快速開始

```bash
git clone https://github.com/dieWehmut/Vorlage.git my-site
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

## Go 程式碼執行

模板統一透過 Sandkasten HTTP API 執行程式碼：

```env
VITE_CODE_RUNNER_API_URL=https://your-sandkasten-api.example.com
VITE_CODE_RUNNER_API_TOKEN=
```

Vite 會把這些值寫進公開的前端 JavaScript，`VITE_CODE_RUNNER_API_TOKEN` 不應放私密服務端 token。

## Infra 狀態探測

Infra 頁面只有在上游最終 HTTP 狀態精確為 `200` 時才顯示 online；`201`、`204`、重新導向、錯誤狀態與網路失敗都會顯示 offline。

若生產服務沒有提供瀏覽器可讀的 CORS 標頭，請在 Pages 工作流程中設定公開探測代理：

```yaml
VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}
```

代理必須提供 `GET /api/ping?url=<encoded-target>`，只有在上游最終回應為 HTTP `200` 時才回傳 HTTP `200` 與 `{ "online": true }`。代理必須允許部署網站的無憑證 CORS，並限制上游主機白名單，避免成為 SSRF/open proxy。`VITE_INFRA_PROBE_URL` 會嵌入公開的瀏覽器 JavaScript，不可放入憑證。未設定代理時會退回瀏覽器直連；不支援 CORS 的目標在此模式下會顯示 offline。

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

## 授權

MIT
