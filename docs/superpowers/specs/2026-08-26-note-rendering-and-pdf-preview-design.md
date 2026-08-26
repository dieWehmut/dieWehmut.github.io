# Note Rendering And PDF Preview Design

## Goal

Make article and note rendering reliable for Mermaid diagrams and LaTeX, preserve those rendered elements in PDF output, keep the custom cursor usable around cross-origin comments, and change the breadcrumb PDF action into a new-window preview without changing the console download command.

## Scope And Boundaries

The work is split into three independently testable commits:

1. Cursor/comments: keep the existing iframe boundary fix, add an explicit Giscus frame cursor fallback, and add a source-contract regression test.
2. Markdown/PDF rendering: render Mermaid fences asynchronously with the Mermaid runtime, make math delimiter preprocessing stable, and convert rendered Mermaid SVG plus LaTeX SVG into pdfmake content.
3. PDF preview: add a preview-specific hook path that opens a blank window synchronously, pass that window through PDF generation, and change only the top ArticleExportButton label/action. The console `/export` command remains a download.

Existing user edits in `src/data/docs/notes/CognitiveScience.md` and generated metadata remain untouched and are used as the acceptance fixture. The unrelated `AgentSettings.md` edit is preserved and excluded from task commits.

## Architecture

`renderMarkdown` remains synchronous so existing cache and progressive rendering contracts do not change. Mermaid fences emit a safe placeholder containing encoded source. `bindMarkdownInteractions` hydrates those placeholders after each chunk is mounted through a lazy Mermaid import; `ensureMermaidRendered` provides an awaitable export path for PDF generation. Math remains KaTeX in the browser, with delimiter normalization performed before Marked parses the source.

PDF generation continues to traverse the rendered article DOM. Mermaid placeholders with SVG are emitted as pdfmake `svg` nodes. LaTeX formulas are rendered to SVG through a lazy MathJax TeX-to-SVG adapter and emitted as pdfmake `svg` nodes, with raw TeX as a deterministic fallback if MathJax cannot load. The same document definition is used for download and preview.

The preview hook first asks the pointer-effects layer to clear its active cursor, then opens `window.open('', '_blank')` before any asynchronous font, image, Mermaid, or MathJax work. `BounceCursor` also clears itself on window blur, so a preview tab/window cannot leave a frozen heart over the button while the parent page is unfocused. The renderer receives the opened `Window` and calls pdfmake `open(targetWindow)`. A blocked popup or failed render returns `false` and closes the blank window; downloads keep the existing `download()` path.

## Error Handling

- Mermaid render errors leave the source visible in the placeholder and add an error state instead of blanking the document.
- MathJax load/render errors leave the formula text in PDF rather than failing the entire export.
- Image/font failures preserve existing fallback behavior.
- Preview popup failure is reported through the existing button disabled/error path; no orphan blank window remains.
- Opening or focusing the preview never locks page scrolling or pointer handling; the parent cursor is hidden until the next real pointer movement.

## Verification

- Static source-contract tests cover iframe cursor behavior, Mermaid placeholder/hydration hooks, math delimiters, PDF SVG handling, and synchronous preview popup ordering.
- Existing markdown, scoped-style, console, typecheck, and build checks remain green.
- The Cognitive Science note is rendered through the dev server and inspected at desktop and mobile widths; Mermaid SVGs, inline/display KaTeX, and the preview window are verified.
