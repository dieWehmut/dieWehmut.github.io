---

title: Tauri
date: 2026-07-10
tags: [Rust, Tauri]
---

## 环境安装

Rust，Tauri，Node.js

```bash
cargo --version
rustc --version
```

## pnpm初始化

```bash
pnpm add -D @tauri-apps/cli
pnpm add @tauri-apps/api
```

```bash
pnpm tauri init
```

```bash
pnpm tauri dev
```

## 配置图标

```bash
pnpm tauri icon path\icon.png
```

## 自动更新

```bash
pnpm tauri add updater
```