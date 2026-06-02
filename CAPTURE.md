# Capture Workflow

## Local asset repository

By default, this project reads source images from a sibling private repository:

```text
../diesw-assets
```

Override the location with:

```text
DIESW_ASSETS_DIR=/absolute/path/to/diesw-assets
```

## Markdown image sources

For note and post images, place the image file next to the markdown file inside `src/data/docs/...`.

Example:

```text
src/data/docs/notes/ai-api.md
src/data/docs/notes/diagram.png
```

Then reference it from markdown with a normal relative path:

```md
![diagram](./diagram.png)
```

During `dev` and `build`, the project rewrites that reference to a public path under `/capture-assets/docs/...` and copies the actual file into `public/capture-assets/docs/...`.

## Standalone images

Use [manifest.json](D:/project/Nexus/src/data/capture/manifest.json) to register images that do not belong to a note or post.

Example entry:

```json
[
  {
    "id": "my-shot",
    "image": "/capture-assets/standalone/my-shot.jpg",
    "title": "My standalone capture",
    "date": "2026-06-01",
    "tags": ["photo"],
    "summary": "Optional description",
    "standalone": true
  }
]
```

## Dev and build

`pnpm dev` and `pnpm build` both run the capture sync step first. The sync step:

1. Scans markdown for `/capture-assets/...` image references
2. Reads `manifest.json`
3. Copies required files from `diesw-assets` into `public/capture-assets`
4. Generates [generated.ts](D:/project/Nexus/src/data/capture/generated.ts)

If any referenced image is missing, the command fails.

## Auto-push assets repository

To sync `diesw-assets` automatically before pushing the main repository:

```bash
git config core.hooksPath .githooks
```

You can also push the asset repository manually with:

```bash
pnpm assets:push
```

Before that push, the sync script mirrors all non-markdown files from `src/data/docs/**` into:

```text
diesw-assets/docs/**
```

That keeps local markdown images ignored in the main repository while still publishing them into the private asset repository.

## CI setup

GitHub Actions requires a repository secret named:

```text
DIESW_ASSETS_TOKEN
```

That token must be able to read the private `dieWehmut/diesw-assets` repository.
