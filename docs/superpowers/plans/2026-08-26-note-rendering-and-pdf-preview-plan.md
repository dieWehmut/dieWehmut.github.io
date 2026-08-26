# Note Rendering And PDF Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair comments cursor interaction, render Mermaid/LaTeX in notes and PDFs, and replace the top PDF download with a new-window preview.

**Architecture:** Markdown emits safe Mermaid placeholders and hydrates them after DOM insertion. Browser KaTeX remains the web renderer; PDF uses SVG output with MathJax and the existing pdfmake DOM traversal. Preview opens synchronously and passes the popup to pdfmake after async preparation.

**Tech Stack:** Vue 3, TypeScript, Marked, KaTeX, Mermaid, MathJax, pdfmake, Node source-contract tests.

---

### Task 1: Cursor/comment regression

**Files:**
- Modify: `src/components/system/BounceCursor.vue`
- Create: `scripts/test-cursor-comments.mjs`
- Modify: `package.json`

- [ ] Write a source-contract test asserting iframe/embed/object detection, mouseover and window-blur binding/unbinding, and an explicit `.giscus-frame` auto cursor rule.
- [ ] Run `pnpm test:cursor-comments` and verify it fails because the explicit Giscus rule/test script is absent.
- [ ] Add `:global(iframe.giscus-frame) { cursor: auto !important; }` after the active cursor override, keep the existing foreign-surface behavior, and clear the custom cursor when the window loses focus.
- [ ] Run the focused test plus `pnpm test:scoped-styles`.
- [ ] Commit only the cursor component, test, and package script as `fix: keep comments cursor usable with pointer effects` and push `main`.

### Task 2: Mermaid and math rendering

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `src/utils/markdown.ts`
- Modify: `src/styles/markdown/index.scss`
- Modify: `scripts/test-markdown-render.mjs`

- [ ] Add `mermaid` and `mathjax-full` dependencies with the package manager.
- [ ] Extend the render test with Mermaid placeholder/hydration, graph support, stable `$$`, `\\[`, `\\]`, `\\(`, `\\)` handling, and Cognitive Science fixture checks; run it and verify the new checks fail.
- [ ] Emit encoded `.md-mermaid` placeholders from Mermaid fences, lazily hydrate them in `bindMarkdownInteractions`, export `ensureMermaidRendered`, and preserve source/error fallback.
- [ ] Replace fragile math substitutions with protected placeholders so block and inline delimiters cannot be consumed by Markdown structure; keep KaTeX output for web rendering.
- [ ] Add responsive Mermaid styles and math overflow rules.
- [ ] Run `pnpm test:markdown-render`, `pnpm typecheck`, and the focused build check.
- [ ] Commit as `fix: render mermaid and math blocks reliably` and push `main`.

### Task 3: PDF SVG output

**Files:**
- Modify: `src/utils/exportPdf.ts`
- Modify: `src/composables/useArticlePdfExport.ts`
- Modify: `scripts/test-pdf-vocabulary.mjs` or create `scripts/test-pdf-render.mjs`
- Modify: `scripts/test-markdown-render.mjs`

- [ ] Add a lazy MathJax TeX-to-SVG adapter with a raw-text fallback.
- [ ] Await Mermaid hydration before cloning the article and map Mermaid SVG and MathJax SVG to pdfmake `svg` content.
- [ ] Keep the existing download API behavior and verify formulas no longer use only raw TeX when SVG is available.
- [ ] Run PDF and markdown source-contract tests plus `pnpm typecheck`.
- [ ] Commit as `fix: preserve rendered diagrams and latex in pdf` and push `main`.

### Task 4: New-window PDF preview

**Files:**
- Modify: `src/utils/exportPdf.ts`
- Modify: `src/composables/useArticlePdfExport.ts`
- Modify: `src/components/content/ArticleExportButton.vue`
- Modify: `scripts/test-console-layout.mjs` or create `scripts/test-pdf-preview.mjs`

- [ ] Add an output mode accepting a pre-opened `Window` and call `pdf.open(targetWindow)` only for preview mode.
- [ ] Add `previewArticlePdf()` that resets pointer effects, opens the blank window synchronously, awaits source/render preparation without page locks, closes on failure, and leaves `exportArticlePdf()` unchanged for console downloads.
- [ ] Change the top button text/title/aria to PDF preview wording and call the preview method.
- [ ] Add ordering/failure source-contract tests and run them.
- [ ] Commit as `feat: preview article pdf in a new window` and push `main`.

### Task 5: Full verification

**Files:**
- No source changes unless a verification failure requires a targeted fix.

- [ ] Run the complete available test set, `pnpm typecheck`, and `pnpm build`.
- [ ] Start Vite on an available port and verify the Cognitive Science note at desktop/mobile widths, including Mermaid SVG, KaTeX, comments cursor boundary, and PDF preview.
- [ ] Review each commit, confirm `AgentSettings.md` and existing note/generated edits remain uncommitted, and confirm `origin/main` matches local `main`.
