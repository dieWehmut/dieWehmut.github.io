# Nexus Starter

一個使用 **Vue 3 + Vite + TailwindCSS + Element Plus** 打造的現代個人網站 / 部落格模板。

線上展示 → [https://diesw.tech](https://diesw.tech)

---

## ✨ 功能特色

- 🌙 深色 / 淺色主題切換，附平滑過渡動畫
- 🌸 動態背景效果（粒子、櫻花、雪花）
- 📝 Markdown 部落格文章與筆記，支援 frontmatter、程式碼高亮及 **KaTeX 數學公式**
- 🗂️ 專案展示（網站、應用、遊戲、工具）— 可選
- 🏗️ 基礎設施狀態儀表板 — 可選
- 👥 友情連結 / 部落格圈頁面
- 🔍 客戶端全文搜尋
- 💬 Giscus 評論系統（GitHub Discussions）
- 🌐 國際化（zh、zh_tw、en、ja、de、la）
- 📱 響應式行動裝置佈局與側邊導航
- 💖 自訂游標（愛心形狀！）
- 📊 Google Analytics（可選）

---

## 🚀 快速開始

### 1. 建立你的倉庫

在 GitHub 上點擊 **「Use this template」**，或手動克隆並推送：

```bash
git clone https://github.com/dieWehmut/diesuwa-starter.git my-site
cd my-site
rm -rf .git && git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 2. 安裝依賴

```bash
# 使用 pnpm（推薦）
pnpm install

# 或使用 npm
npm install
```

### 3. 設定你的網站

編輯 **`src/data/site/config.ts`** — 這是唯一*必須*修改的檔案：

```ts
export const siteConfig = {
  // --- 身份資訊 ---
  githubUser: 'your-github-username',       // ⬅️ 你的 GitHub 使用者名稱
  githubRepo: 'your-repo-name',             // ⬅️ 託管網站的倉庫名稱
  owner: 'Your Name',
  displayName: 'Your Name',
  email: 'you@example.com',

  // --- 網站資訊 ---
  title: 'My Site',
  subtitle: 'My Site',
  description: '一段簡短的描述。',
  siteUrl: 'https://your-domain.com',       // ⬅️ 你部署後的網址
  startedAt: '2026-01-01T00:00:00+00:00',   // ⬅️ 網站上線起始日期

  // --- 外部服務 ---
  googleAnalyticsId: '',                     // 例如 'G-XXXXXXXXXX'

  // --- ICP 備案（可選，留空則隱藏）---
  icpNumber: '',
  icpText: '',

  // --- 功能開關 ---
  enableInfra: false,     // 設為 true 以顯示基礎設施頁面
  enableProject: false,   // 設為 true 以顯示專案頁面

  // --- 社交連結 ---
  links: [
    { label: 'GitHub', url: 'https://github.com/your-github-username' },
  ],
}
```

### 4. 新增內容

| 內容類型 | 位置 | 格式 |
|---|---|---|
| 部落格文章 | `src/data/docs/posts/*.md` | 含 YAML frontmatter 的 Markdown |
| 短筆記 | `src/data/docs/notes/*.md` | 含 YAML frontmatter 的 Markdown |
| 關於頁面 | `src/data/site/about.md` | Markdown |
| 友情連結 | `src/data/site/friends.ts` | TypeScript 陣列 |
| 專案 | `src/data/site/app.ts`、`game.ts`、`page.ts`、`tool.ts` | TypeScript |
| 基礎設施端點 | `src/data/site/infra.ts` | TypeScript 陣列 |

#### Frontmatter 範例

```markdown
---
title: 我的第一篇文章
date: 2026-05-28
tags: [hello, intro]
---

你的內容在這裡。支援 **粗體**、*斜體*、`程式碼`、數學公式（$E=mc^2$）、表格等。
```

### 5. 設定 Giscus 評論（可選）

1. 前往 [https://giscus.app](https://giscus.app) 並為你的倉庫進行設定。
2. 將 `.env.example` 複製為 `.env.local` 並填入你的 Giscus 設定：

```env
VITE_GISCUS_REPO=your-username/your-repo
VITE_GISCUS_REPO_ID=R_xxxxx
VITE_GISCUS_CATEGORY=Announcements
VITE_GISCUS_CATEGORY_ID=DIC_xxxxx
```

### 6. 本地執行

```bash
pnpm dev
# 開啟 http://localhost:5173
```

### 7. 部署

內建的 GitHub Actions 工作流程（`.github/workflows/`）會在推送至 `main` 時自動建置並部署至 GitHub Pages。

請確認你的倉庫 Settings → Pages → Source 設定為 **GitHub Actions**。

如需自訂網域，請在 `public/` 目錄下新增包含你網域的 `CNAME` 檔案。

---

## 📁 專案結構

```
src/
├── data/
│   ├── site/
│   │   ├── config.ts        ← ⭐ 個人設定（從這裡開始！）
│   │   ├── about.md         ← 關於頁面內容
│   │   ├── profile.ts       ← 個人檔案邏輯（自動從 config 載入）
│   │   ├── friends.ts       ← 友情連結
│   │   ├── app.ts           ← 應用專案
│   │   ├── game.ts          ← 遊戲專案
│   │   ├── page.ts          ← 網站專案
│   │   ├── tool.ts          ← 工具專案
│   │   └── infra.ts         ← 基礎設施端點
│   └── docs/
│       ├── posts/            ← 部落格文章（.md）
│       └── notes/            ← 短筆記（.md）
├── components/               ← Vue 元件
├── composables/              ← Vue 組合式函數
├── layouts/                  ← 佈局包裝器
├── views/                    ← 頁面視圖（路由）
├── styles/                   ← SCSS 樣式（主題、游標等）
├── locales/                  ← i18n 翻譯 JSON 檔案
└── utils/                    ← 工具函數（markdown、API 快取等）
```

---

## 🎨 自訂技巧

- **主題色彩** — 修改 `src/styles/theme/dark/index.scss` 和 `light/index.scss` 中的 CSS 變數
- **游標** — 更換 `src/styles/cursor/` 中的 SVG
- **背景效果** — 在浮動設定按鈕中切換，或在 `src/components/background/` 中自訂
- **字型** — 替換 `src/assets/fonts/` 中的字型並更新 `src/styles/fonts/index.scss`
- **國際化** — 編輯 `src/locales/` 中的 JSON 檔案

---

## 📐 數學公式支援

行內公式：`$E = mc^2$`

區塊公式：
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

由 KaTeX 驅動 — 支援所有標準 LaTeX 數學指令。

---

## 🤝 友情連結頁面

編輯 `src/data/site/friends.ts`：

```ts
export const friends: FriendLink[] = [
  {
    id: 'friend-1',
    name: '朋友名稱',
    description: '一段簡短的描述',
    url: 'https://friend-site.com',
    avatar: 'https://github.com/friend-username.png',
  },
]
```

---

## ❓ 常見問題

**問：如何隱藏基礎設施 / 專案頁面？**
答：在 `config.ts` 中設定 `enableInfra: false` 和/或 `enableProject: false`。

**問：如何更改網站語言？**
答：預設為中文。使用者可透過浮動按鈕切換。若要更改預設語言，請編輯 `src/i18n.ts`。

**問：可以部署到 Vercel / Netlify 而非 GitHub Pages 嗎？**
答：可以 — 只需將建置指令設為 `pnpm build`，輸出目錄設為 `dist` 即可。

---

## 📄 授權條款

MIT
