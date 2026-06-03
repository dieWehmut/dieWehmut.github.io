<h1 align="center">diesuwa-starter</h1>

<div align="center">

<div>
<a href="https://diewehmut.github.io/diesuwa-starter/" target="_blank">
  <img src="https://img.shields.io/badge/TEMPLATE-DEMO-1FC41F?style=flat-square&logo=githubpages&logoColor=white&labelColor=555555" alt="Template Demo">
</a>
<a href="https://diewehmut.github.io/" target="_blank">
  <img src="https://img.shields.io/badge/PRODUCT-DEMO-F9D553?style=flat-square&logo=google-chrome&logoColor=white&labelColor=555555" alt="Product Demo">
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

[简体中文](../README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md) | 日本語

</div>

---

`diesuwa-starter` は `Vue 3 + Vite + TypeScript + Element Plus` で作られた個人サイト用テンプレートです。ブログ、ノート、プロジェクト紹介、リンク集、静的プロフィールページに向いています。

## デモ

- テンプレートデモ：<https://diewehmut.github.io/diesuwa-starter/>
- 完成例：<https://diewehmut.github.io/>

テンプレートデモが開けない場合は、リポジトリの `Settings -> Pages -> Source` を `GitHub Actions` に設定してください。デプロイ workflow は GitHub Pages のサブパスに合わせて Vite の `base` を自動設定します。

## クイックスタート

```bash
git clone https://github.com/dieWehmut/diesuwa-starter.git my-site
cd my-site
pnpm install
pnpm dev
```

まず `src/data/site/config.ts` を編集し、その後 `src/data` 配下のサンプル記事、ノート、リンク、プロジェクトデータを置き換えてください。

## デプロイ

`main` に push すると、同梱の GitHub Actions が自動でビルドし、GitHub Pages にデプロイします。

確認事項：

1. `Settings -> Pages` を開く
2. `Source` を `GitHub Actions` に設定する
3. project Pages の場合、URL は `https://YOUR_USERNAME.github.io/YOUR_REPO/` になります

## コマンド

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

## License

MIT
