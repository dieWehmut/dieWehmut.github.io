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

## Markdown image references

To include a note or post image in the `Capture` page, reference it with a site path:

```md
![diagram](/capture-assets/notes/ai-api/diagram.png)
```

The source file must exist in the private asset repository at:

```text
diesw-assets/notes/ai-api/diagram.png
```

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

## CI setup

GitHub Actions requires a repository secret named:

```text
DIESW_ASSETS_TOKEN
```

That token must be able to read the private `dieWehmut/diesw-assets` repository.
