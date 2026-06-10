<h1 align="center">diesuwa-starter</h1>

<p align="center">
  <img src="https://count.getloli.com/get/@diesuwa-starter?theme=rule34" alt="Visitors">
</p>

<div align="center">

<div>
<a href="https://diewehmut.github.io/diesuwa-starter/" target="_blank">
  <img src="https://img.shields.io/badge/TEMPLATE-DEMO-1FC41F?style=flat-square&logo=githubpages&logoColor=white&labelColor=555555" alt="Template Demo">
</a>
<a href="https://diewehmut.github.io/" target="_blank">
  <img src="https://img.shields.io/badge/PRODUCTION-DEMO-F9D553?style=flat-square&logo=google-chrome&logoColor=white&labelColor=555555" alt="Production Demo">
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

[简体中文](../README.md) | [繁體中文](README.zh-TW.md) | English | [日本語](README.ja.md)

</div>

---

`diesuwa-starter` is a personal website template built with `Vue 3 + Vite + TypeScript + Element Plus`. It is suitable for blogs, notes, project showcases, friend links, and static profile pages.

## Demos

- Example repository: <https://github.com/dieWehmut/dieWehmut.github.io>
- Template demo: <https://diewehmut.github.io/diesuwa-starter/>
- Production demo: <https://diewehmut.github.io/>

If the template demo does not open, check `Settings -> Pages -> Source` and set it to `GitHub Actions`. The deploy workflow automatically sets the Vite base path for project Pages repositories.

## Quick Start

```bash
git clone https://github.com/dieWehmut/diesuwa-starter.git my-site
cd my-site
pnpm install
pnpm dev
```

Edit `src/data/site/config.ts` first, then replace the sample posts, notes, friends, and project data under `src/data`.

## Deployment

Push to `main`. The included GitHub Actions workflow builds and deploys the site to GitHub Pages.

Required GitHub setting:

1. Open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`
3. For project repositories, use `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Go Code Runner

The template runs code through a Sandkasten HTTP API:

```env
VITE_CODE_RUNNER_API_URL=https://your-sandkasten-api.example.com
VITE_CODE_RUNNER_API_TOKEN=
```

Vite embeds these values in public JavaScript, so `VITE_CODE_RUNNER_API_TOKEN` must not contain a private server token.

## Commands

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

## License

MIT
