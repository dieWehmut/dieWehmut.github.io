# Nexus Starter

A modern personal website / blog template built with **Vue 3 + Vite + TailwindCSS + Element Plus**.

Live demo → [https://diesw.tech](https://diesw.tech)

---

## ✨ Features

- 🌙 Dark / Light theme with smooth transitions
- 🌸 Animated backgrounds (particles, sakura, snow)
- 📝 Markdown blog posts & notes with frontmatter, code highlighting, and **KaTeX math** support
- 🗂️ Project showcase (websites, apps, games, tools) — optional
- 🏗️ Infrastructure status dashboard — optional
- 👥 Friends / blogroll page
- 🔍 Client-side full-text search
- 💬 Giscus comments (GitHub Discussions)
- 🌐 i18n (zh, zh_tw, en, ja, de, la)
- 📱 Responsive mobile layout with drawer navigation
- 💖 Custom cursor (heart shape!)
- 📊 Google Analytics (optional)

---

## 🚀 Quick Start

### 1. Create your repo

Click **"Use this template"** on GitHub, or clone and push:

```bash
git clone https://github.com/dieWehmut/diesuwa-starter.git my-site
cd my-site
rm -rf .git && git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 2. Install dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or npm
npm install
```

### 3. Configure your site

Edit **`src/data/site/config.ts`** — this is the only file you *must* change:

```ts
export const siteConfig = {
  // --- Identity ---
  githubUser: 'your-github-username',       // ⬅️ Your GitHub username
  githubRepo: 'your-repo-name',             // ⬅️ The repo hosting the site
  owner: 'Your Name',
  displayName: 'Your Name',
  email: 'you@example.com',

  // --- Site Meta ---
  title: 'My Site',
  subtitle: 'My Site',
  description: 'A short description.',
  siteUrl: 'https://your-domain.com',       // ⬅️ Your deployed URL
  startedAt: '2026-01-01T00:00:00+00:00',   // ⬅️ Site uptime start date

  // --- External Services ---
  googleAnalyticsId: '',                     // e.g. 'G-XXXXXXXXXX'

  // --- ICP Filing (optional, leave empty to hide) ---
  icpNumber: '',
  icpText: '',

  // --- Feature Flags ---
  enableInfra: false,     // Set true to show Infra page
  enableProject: false,   // Set true to show Project page

  // --- Social Links ---
  links: [
    { label: 'GitHub', url: 'https://github.com/your-github-username' },
  ],
}
```

### 4. Add content

| Content type | Location | Format |
|---|---|---|
| Blog posts | `src/data/docs/posts/*.md` | Markdown with YAML frontmatter |
| Short notes | `src/data/docs/notes/*.md` | Markdown with YAML frontmatter |
| About page | `src/data/site/about.md` | Markdown |
| Friends | `src/data/site/friends.ts` | TypeScript array |
| Projects | `src/data/site/app.ts`, `game.ts`, `page.ts`, `tool.ts` | TypeScript |
| Infra endpoints | `src/data/site/infra.ts` | TypeScript array |

#### Frontmatter example

```markdown
---
title: My First Post
date: 2026-05-28
tags: [hello, intro]
---

Your content here. Supports **bold**, *italic*, `code`, math ($E=mc^2$), tables, etc.
```

### 5. Set up Giscus comments (optional)

1. Go to [https://giscus.app](https://giscus.app) and configure for your repo.
2. Copy `.env.example` to `.env.local` and fill in your Giscus settings:

```env
VITE_GISCUS_REPO=your-username/your-repo
VITE_GISCUS_REPO_ID=R_xxxxx
VITE_GISCUS_CATEGORY=Announcements
VITE_GISCUS_CATEGORY_ID=DIC_xxxxx
```

### 6. Run locally

```bash
pnpm dev
# Open http://localhost:5173
```

### 7. Deploy

The included GitHub Actions workflow (`.github/workflows/`) automatically builds and deploys to GitHub Pages on push to `main`.

Make sure your repo Settings → Pages → Source is set to **GitHub Actions**.

For custom domains, add a `CNAME` file in `public/` with your domain.

---

## 📁 Project Structure

```
src/
├── data/
│   ├── site/
│   │   ├── config.ts        ← ⭐ Personal config (start here!)
│   │   ├── about.md         ← About page content
│   │   ├── profile.ts       ← Profile logic (auto from config)
│   │   ├── friends.ts       ← Friend links
│   │   ├── app.ts           ← App projects
│   │   ├── game.ts          ← Game projects
│   │   ├── page.ts          ← Website projects
│   │   ├── tool.ts          ← Tool projects
│   │   └── infra.ts         ← Infrastructure endpoints
│   └── docs/
│       ├── posts/            ← Blog posts (.md)
│       └── notes/            ← Short notes (.md)
├── components/               ← Vue components
├── composables/              ← Vue composables
├── layouts/                  ← Layout wrappers
├── views/                    ← Page views (routed)
├── styles/                   ← SCSS styles (themes, cursors, etc.)
├── locales/                  ← i18n translation JSON files
└── utils/                    ← Utilities (markdown, API cache, etc.)
```

---

## 🎨 Customization Tips

- **Theme colors** — modify CSS variables in `src/styles/theme/dark/index.scss` and `light/index.scss`
- **Cursor** — change the SVG in `src/styles/cursor/`
- **Background effects** — toggle in the floating settings button, or customize in `src/components/background/`
- **Fonts** — replace in `src/assets/fonts/` and update `src/styles/fonts/index.scss`
- **i18n** — edit JSON files in `src/locales/`

---

## 📐 Math Support

Inline math: `$E = mc^2$`

Display math:
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

Powered by KaTeX — all standard LaTeX math commands are supported.

---

## 🤝 Friends Page

Edit `src/data/site/friends.ts`:

```ts
export const friends: FriendLink[] = [
  {
    id: 'friend-1',
    name: 'Friend Name',
    description: 'A short description',
    url: 'https://friend-site.com',
    avatar: 'https://github.com/friend-username.png',
  },
]
```

---

## ❓ FAQ

**Q: How do I hide the Infra / Project pages?**
A: Set `enableInfra: false` and/or `enableProject: false` in `config.ts`.

**Q: How do I change the site language?**
A: The default is Chinese. Users can switch via the floating button. To change the default, edit `src/i18n.ts`.

**Q: Can I deploy to Vercel / Netlify instead of GitHub Pages?**
A: Yes — just set build command to `pnpm build` and output directory to `dist`.

---

## 📄 License

MIT
