# Vorlage Template Synchronization Design

## Context

The source repository is `dieWehmut/dieWehmut.github.io`. Its exported template
repository was renamed to `dieWehmut/Vorlage`, but the source workflow still
emits the legacy repository name and Pages path. GitHub redirects the legacy
repository URL, which hides the error:
the sync job can report success while the generated files, repository metadata,
and deployed site remain stale.

The current export also has two independent consistency failures. It writes a
development log containing historical text that the infrastructure regression
test incorrectly treats as runtime integration, and it replaces the Markdown
content without regenerating `src/data/docs/generated.ts`. The template Pages
workflow therefore fails before build, leaving an older artifact whose assets
still use the legacy project path.

## Goals

1. Make `Vorlage` the canonical template repository identity everywhere in
   tracked source, generated template content, repository metadata, and Pages
   URLs.
2. Treat the source repository as the only source of truth for the template
   export. The target `Vorlage/main` is a content mirror of the generated export
   while retaining its chronological sync commits.
3. Make an export self-validating before it can be pushed: generated document
   metadata, package metadata, repository links, deployment base path, type
   checks, regression tests, and production build must agree.
4. Ensure the generated template website can deploy at
   `https://diewehmut.github.io/Vorlage/` and does not reference the legacy path.
5. Make synchronization deterministic under repeated source pushes and expose
   manual recovery through `workflow_dispatch`.

## Non-goals

- Do not rename the source repository `dieWehmut/dieWehmut.github.io`.
- Do not rename generic concepts such as `starter`, `template`, or workflow files
  such as `sync-starter.yml`.
- Do not replace the private `diesw-assets` repository or change its access
  protocol.
- Do not make the template byte-for-byte identical to the source checkout. The
  export intentionally removes private content, personal data, capture assets,
  and source-only workflows. Consistency means that every intentional
  transformation is explicit and every remaining tracked file is generated from
  the current source commit.

## Canonical Identity

The export uses separate values for GitHub identity and npm metadata:

| Value | Canonical value | Use |
| --- | --- | --- |
| Template repository | `dieWehmut/Vorlage` | Git clone and GitHub API |
| Repository name | `Vorlage` | Display text and Pages path |
| Package name | `vorlage` | `package.json` and lockfile |
| Repository URL | `https://github.com/dieWehmut/Vorlage` | Links and docs |
| Pages URL | `https://diewehmut.github.io/Vorlage/` | Demo links and metadata |
| Pages base | `/Vorlage/` | Generated Vite artifact |

The legacy repository token must not occur in tracked source or in an exported
template. Historical Git objects and ignored local caches are outside this
invariant. German words such as `Vorlagen` remain unchanged.

## Architecture

### Export preparation

Move the large inline transformation in `.github/workflows/sync-starter.yml`
into a Node script with a small identity module. The script receives the source
checkout, a destination staging directory, and the source commit SHA. It:

- copies the source tree into a clean staging directory;
- removes source-only files and private content;
- writes the generic package, config, sample data, translated README files, and
  template deployment workflow;
- renders all links and names from the canonical identity values;
- regenerates `src/data/docs/generated.ts` after sample Markdown is written;
- records the source SHA in the generated template commit message or metadata;
- returns a non-zero exit code for an incomplete or ambiguous export.

The staging directory is never the source checkout. This prevents generated
files from leaking into the source job and makes the export runnable locally in
tests.

### Validation

Add a focused export validator that runs against the staging directory. It must
assert:

- no old repository token or old Pages path is present;
- package and lockfile names are `vorlage`;
- all repository and Pages links use `Vorlage`;
- every generated document metadata path exists exactly once;
- no private source-only file or sync workflow is exported;
- the generated deploy workflow derives the base path from
  `GITHUB_REPOSITORY` and contains the infrastructure regression gate.

The validator then runs the existing infrastructure test, `pnpm typecheck`, and
the production build with `BASE_PATH=/Vorlage/`. Build output is inspected for
root-relative asset references that would bypass the project path. The
infrastructure test's forbidden-product scan is narrowed to runtime/configuration
files and explicitly excludes the generated historical development log; that
file is content, not an installed integration.

### Synchronization workflow

The workflow remains the GitHub Actions entry point, but becomes orchestration:

1. Check out the source commit.
2. Prepare a clean export staging directory.
3. Run the export and validator.
4. Clone `dieWehmut/Vorlage`, replace its tracked contents from the validated
   staging directory, and create a sync commit containing the source SHA.
5. Push the approved mirror update with an explicit lease against the target
   SHA. The workflow uses a serial concurrency group so an older run cannot
   overwrite a newer export. The target history is retained; no unconditional
   force push is used.
6. Patch `dieWehmut/Vorlage` metadata at the new API path, set the homepage to
   `/Vorlage/`, and enable the GitHub template-repository flag. A follow-up GET
   assertion fails the job if metadata did not converge.

The workflow supports both `push` to `main` and `workflow_dispatch`. Missing
tokens, validation failures, target lease conflicts, and metadata failures are
fatal rather than silently ignored. A lease conflict is retried only by a new
workflow run, never by an unconditional force push.

## Branch and Commit Structure

Changes are delivered as stacked, independently pushed branches:

1. `docs/vorlage-sync-design`: this design document.
2. `fix/vorlage-identity`: canonical identity module, source links/config/docs,
   and old-name regression tests.
3. `fix/template-export`: staging export script, generated-doc regeneration,
   export validator, and template snapshot tests.
4. `fix/template-sync-workflow`: workflow orchestration, concurrency, lease
   push, metadata verification, and generated deployment checks.

Each branch gets focused commits and is pushed before the next branch is based
on it. After branch-level verification, the final branch is merged into
`main` and pushed. The source `main` push is the only action that should trigger
the production synchronization; the template repository and Pages deployment
are then checked independently.

## Error Handling and Recovery

- A failed export never reaches the target repository.
- A target push lease conflict leaves the previous target revision intact and
  reports the expected and observed SHAs.
- Metadata verification failure fails the run after the content push; rerunning
  the workflow repairs metadata without changing the source export.
- The previous target SHA is captured in the workflow log before replacement so
  an administrator can restore it deliberately if a remote deployment issue is
  discovered.

## Verification

Local verification covers the export validator, all existing focused tests,
`pnpm test:infra-status`, `pnpm typecheck`, and a production build with
`BASE_PATH=/Vorlage/`. The generated staging tree is searched independently for
old repository tokens and broken Markdown metadata paths.

Remote verification requires all of the following:

- source `Sync Starter`, `Sync Capture`, and `Deploy` runs succeed;
- `Vorlage/main` contains the new identity and a current source SHA;
- `Vorlage` metadata has the new homepage and template flag;
- the `Vorlage` Pages deployment succeeds;
- `https://diewehmut.github.io/Vorlage/` returns HTML whose title, script, and
  stylesheet paths use `/Vorlage/`, and those assets return HTTP 200;
- the legacy project path is no longer referenced by the generated template or
  active repository metadata.
