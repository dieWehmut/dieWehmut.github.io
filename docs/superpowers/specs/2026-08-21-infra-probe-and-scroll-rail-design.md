# Infra Probe and Scroll Rail Design

## Context

The Infra page currently performs cross-origin production checks directly from the browser. Services such as `https://nezha.hc-dsw-nexus.me/` and `https://dashboard.netmaker.hc-dsw-nexus.me/` return HTTP 200, but their CORS headers do not let the GitHub Pages origin read that response. The browser therefore raises a network error and the UI reports them as offline.

The desktop table of contents is independently scrollable. Its native scrollbar changes only the sidebar's `scrollTop`; it does not change the document's `window.scrollY`. Clicking a position on that scrollbar therefore cannot represent the same percentage of the page and produces the large mismatch reported by the user.

## Goals

- Report an Infra endpoint as online only when a trusted probe confirms the upstream's final HTTP status is exactly 200.
- Let the production site probe endpoints that do not expose browser-readable CORS responses.
- Make the visible reading-progress rail the single direct percentage control for page scrolling.
- Preserve table-of-contents heading navigation and automatic active-heading tracking.
- Document the deployment contract in the source README and every exported Vorlage README.
- Keep the source repository and exported Vorlage behavior aligned.

## Non-goals

- Do not treat opaque `no-cors` responses as proof that a service is online.
- Do not add latency, HTTP status, or a third "unknown" state to the Infra UI.
- Do not make the sidebar's content height a proxy for document height.
- Do not deploy or redesign the external probe service in this repository.

## Chosen design

### 1. Production Infra probe

The frontend will accept a public build-time setting named `VITE_INFRA_PROBE_URL`.

- Local Vite development continues to call the same-origin `/api/ping?url=...` middleware.
- A production build with `VITE_INFRA_PROBE_URL` calls `<base>/api/ping?url=<encoded-target>`.
- A production build without that setting falls back to the existing direct strict-status request. This preserves useful behavior for CORS-compatible public endpoints and keeps template builds functional, while CORS-blocked endpoints remain offline until a proxy is configured.
- The remote proxy request itself must return HTTP 200 and JSON `{ "online": true }` before the UI reports online. A non-200 proxy response, malformed JSON, timeout, abort, network failure, or any other value is offline.
- The proxy contract requires `online: true` only when the upstream request finishes with final status 200. Redirects are judged by the final response. Every other upstream status is offline.

The source deployment workflow will expose:

```yaml
VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}
```

This uses the repository's existing `API_PROXY_BASE` secret while preferring a clearly public repository variable for future configuration. Because Vite embeds the value in browser JavaScript, neither setting may contain a credential. The exported Vorlage deployment workflow will use the same expression; forks may configure `VITE_INFRA_PROBE_URL` as a repository variable.

The probe service must allow credential-free GET requests from the deployed Pages origin. For a reusable template probe, `Access-Control-Allow-Origin: *` is acceptable only when the service uses an upstream hostname allowlist and does not rely on browser credentials. The service must reject arbitrary targets to avoid becoming an SSRF/open-proxy endpoint.

### 2. Page progress rail

The table-of-contents container remains internally scrollable so `followActive()` can keep the active heading visible, but the native scrollbars belonging to the desktop sidebar and mobile table-of-contents drawer are hidden in Firefox and WebKit/Blink. Wheel input over the desktop sidebar continues to scroll the document, and touch scrolling can still move long mobile directory content even though its native scrollbar is not painted.

The existing vertical progress rail becomes the only direct percentage control:

- The fill grows from top to bottom, matching normal document progress.
- Pointer down immediately maps the pointer's vertical position within the rail to the document's scrollable range.
- Pointer movement while captured continuously updates the page position; pointer up/cancel ends the drag.
- The mapping clamps to `[0, 1]` and uses `document.documentElement.scrollHeight - window.innerHeight`, so the rail and displayed percentage share the same source of truth.
- Pointer-driven scrolling uses immediate behavior to keep the thumb under the pointer rather than lagging behind a smooth animation.
- Starting a rail interaction releases any pinned table-of-contents heading so active-heading tracking returns to the real document position.

The rail will expose slider semantics:

- `role="slider"`, `aria-orientation="vertical"`, `tabindex="0"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and the live percentage in `aria-valuenow`.
- `Home` and `End` move to 0% and 100%.
- Arrow keys move by 2 percentage points.
- `PageUp` and `PageDown` move by 10 percentage points.

The visual rail may stay 4px wide, but its pointer hit area will be widened without changing the layout. Console mode continues to hide the vertical rail. Mobile mode keeps the same component behavior, with the existing drawer determining visibility.

### 3. Documentation and template export

The source `README.md` will explain:

- the binary exact-200 rule;
- why production cross-origin checks require a probe service;
- the `VITE_INFRA_PROBE_URL` contract;
- that the value is public in the client bundle;
- CORS and SSRF/allowlist requirements;
- the direct-probe fallback when no proxy is configured.

The four Vorlage README sources (`starter-readme.md`, English, Traditional Chinese, and Japanese) will receive equivalent deployment guidance. The template exporter and validators will assert that the generated workflow carries the Infra probe setting and that the exported README documents it.

The source-to-Vorlage synchronization remains the existing deterministic export workflow; no manual edits will be made directly in the generated template repository.

## Code boundaries

- `src/composables/urlProbe.ts`: normalize the remote base URL and select local proxy, remote proxy, or direct fallback.
- `src/composables/useUrlStatus.ts`: pass the Vite environment setting into the pure probe dispatcher; retain existing timeout and batching behavior.
- `src/utils/scrollProgress.ts`: hold pure percentage clamping, pointer mapping, keyboard stepping, and page-scroll target calculations so they can be tested without a browser.
- `src/components/system/ScrollSpySidebar.vue`: own pointer/keyboard events and presentation; delegate calculations to the helper.
- `src/layouts/MobileDrawerLayout.vue`: hide the drawer's independent native scrollbar without disabling its overflow behavior.
- `.github/workflows/deploy.yml` and `scripts/prepare-template.mjs`: inject the public probe base into source and exported builds.
- README sources and export validators: keep setup instructions and generated output consistent.

## Error handling

- All Infra failures resolve to the existing `offline` state; they do not throw into Vue rendering.
- Aborted checks remain offline and pending state is cleaned up as today.
- Missing or empty production proxy configuration selects direct probing rather than constructing an invalid URL.
- A zero-height rail or a document with no scrollable range maps to page position 0 without division by zero.
- Pointer coordinates outside the rail clamp to the nearest endpoint.

## Test strategy

Tests will be written before production changes.

### Infra tests

- Production with a configured remote base calls the normalized remote `/api/ping` URL.
- A remote proxy returns online only for proxy HTTP 200 plus `{ online: true }`.
- Proxy HTTP 201/204/4xx/5xx, false/missing/malformed payloads, rejection, and abort are offline.
- Production without a proxy retains direct exact-200 behavior.
- Deployment and template-export tests require the new environment mapping and README documentation.

### Scroll rail tests

- Top, middle, bottom, and out-of-range pointer coordinates map to the correct clamped page positions.
- Zero-height rails and non-scrollable documents return 0.
- Keyboard steps clamp at 0% and 100%.
- Component contract checks require pointer capture, slider accessibility attributes, top-down fill, hidden native scrollbar, and release of pinned heading state.
- Existing heading/hash navigation tests must continue to pass.

### Verification

- Run focused Infra and scroll-navigation tests, full type checking, template export validation, and the production build.
- Deploy through the existing GitHub Pages workflow.
- In a real browser, verify that the Nezha and Netmaker dashboard cards are online when their upstream final response is 200.
- Verify that clicking and dragging the rail at representative percentages moves the page to the corresponding document percentage and that the directory continues to follow the active section.

## Acceptance criteria

- `https://nezha.hc-dsw-nexus.me/` and `https://dashboard.netmaker.hc-dsw-nexus.me/` display online on the production Infra page while returning final HTTP 200 through the configured probe service.
- Any upstream final status other than 200 displays offline.
- Clicking or dragging the progress rail moves the document to the same percentage without using the sidebar's native scrollbar.
- Existing table-of-contents clicks, wheel forwarding, hash navigation, and active-section following remain functional.
- Source and Vorlage README/workflow output describe and implement the same configuration contract.
