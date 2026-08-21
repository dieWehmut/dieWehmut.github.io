# Scroll Progress Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the table-of-contents native scrollbar as a page-progress control with an accessible, clickable, draggable rail whose position maps directly to the document scroll range.

**Architecture:** Put all coordinate, percentage, keyboard-step, and target-scroll calculations in a new pure utility. Keep `ScrollSpySidebar.vue` responsible only for DOM events, pointer capture, scrolling, and presentation. Preserve internal sidebar overflow for automatic heading following, but hide its native scrollbar (and the mobile drawer scrollbar) so users cannot mistake independent directory scrolling for page progress.

**Tech Stack:** Vue 3 Composition API, TypeScript, scoped SCSS, Node regression scripts.

---

## File structure

- Create `src/utils/scrollProgress.ts`: pure clamping, pointer mapping, keyboard stepping, and scroll target functions.
- Create `scripts/test-scroll-progress.mjs`: transpile/test the pure helper and assert the component/CSS integration contract.
- Modify `package.json`: expose the focused test and include it in the navigation regression aggregate.
- Modify `src/components/system/ScrollSpySidebar.vue`: slider semantics, pointer capture, keyboard input, top-down fill, and hidden native scrollbar.
- Modify `src/layouts/MobileDrawerLayout.vue`: hide the drawer's native scrollbar without disabling overflow.

### Task 1: Pure scroll-progress calculations

**Files:**
- Create: `src/utils/scrollProgress.ts`
- Create: `scripts/test-scroll-progress.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing pure-helper test**

Create `scripts/test-scroll-progress.mjs` using the same TypeScript transpile/import pattern as `scripts/test-heading-navigation.mjs`. Its initial assertions must call these not-yet-created exports:

```js
check('pointer top maps to zero', helper.scrollRatioFromPointer(100, 100, 90) === 0)
check('pointer middle maps to half', helper.scrollRatioFromPointer(145, 100, 90) === 0.5)
check('pointer bottom maps to one', helper.scrollRatioFromPointer(190, 100, 90) === 1)
check('pointer before track clamps to zero', helper.scrollRatioFromPointer(20, 100, 90) === 0)
check('pointer after track clamps to one', helper.scrollRatioFromPointer(250, 100, 90) === 1)
check('zero-height track maps to zero', helper.scrollRatioFromPointer(150, 100, 0) === 0)
check('half progress maps to half scroll range', helper.scrollTopForRatio(0.5, 2400) === 1200)
check('non-scrollable document maps to zero', helper.scrollTopForRatio(0.5, 0) === 0)
check('Home maps to start', helper.scrollRatioForKey('Home', 0.4) === 0)
check('End maps to end', helper.scrollRatioForKey('End', 0.4) === 1)
check('ArrowDown advances two percent', helper.scrollRatioForKey('ArrowDown', 0.4) === 0.42)
check('ArrowUp clamps at start', helper.scrollRatioForKey('ArrowUp', 0.01) === 0)
check('PageDown advances ten percent', helper.scrollRatioForKey('PageDown', 0.4) === 0.5)
check('PageUp clamps at start', helper.scrollRatioForKey('PageUp', 0.05) === 0)
check('unhandled key returns null', helper.scrollRatioForKey('Enter', 0.4) === null)
```

Add this package script:

```json
"test:scroll-progress": "node scripts/test-scroll-progress.mjs"
```

Add `pnpm test:scroll-progress` beside the existing heading/hash tests in `test:console`.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test:scroll-progress`

Expected: FAIL because `src/utils/scrollProgress.ts` does not exist or its exports are missing.

- [ ] **Step 3: Implement the minimal pure helper**

Create `src/utils/scrollProgress.ts`:

```ts
export function clampScrollRatio(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function scrollRatioFromPointer(
  clientY: number,
  trackTop: number,
  trackHeight: number,
): number {
  if (!Number.isFinite(trackHeight) || trackHeight <= 0) return 0
  return clampScrollRatio((clientY - trackTop) / trackHeight)
}

export function scrollTopForRatio(ratio: number, maxScrollY: number): number {
  if (!Number.isFinite(maxScrollY) || maxScrollY <= 0) return 0
  return clampScrollRatio(ratio) * maxScrollY
}

export function scrollRatioForKey(key: string, currentRatio: number): number | null {
  const current = clampScrollRatio(currentRatio)
  if (key === 'Home') return 0
  if (key === 'End') return 1
  if (key === 'ArrowUp' || key === 'ArrowLeft') return clampScrollRatio(current - 0.02)
  if (key === 'ArrowDown' || key === 'ArrowRight') return clampScrollRatio(current + 0.02)
  if (key === 'PageUp') return clampScrollRatio(current - 0.1)
  if (key === 'PageDown') return clampScrollRatio(current + 0.1)
  return null
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm test:scroll-progress`

Expected: all pure helper checks print `PASS` and the command exits 0.

- [ ] **Step 5: Commit the helper and test**

```bash
git add src/utils/scrollProgress.ts scripts/test-scroll-progress.mjs package.json
git commit -m "test(scroll): define page progress mapping"
```

### Task 2: Interactive accessible rail

**Files:**
- Modify: `scripts/test-scroll-progress.mjs`
- Modify: `src/components/system/ScrollSpySidebar.vue`
- Modify: `src/layouts/MobileDrawerLayout.vue`

- [ ] **Step 1: Add failing component-contract checks**

Extend `scripts/test-scroll-progress.mjs` to read both Vue files and require:

```js
check('rail exposes vertical slider semantics',
  /role="slider"/.test(sidebar) &&
  /aria-orientation="vertical"/.test(sidebar) &&
  /:aria-valuenow="progress"/.test(sidebar) &&
  /tabindex="0"/.test(sidebar))
check('rail handles pointer drag with capture',
  /@pointerdown="onProgressPointerDown"/.test(sidebar) &&
  /@pointermove="onProgressPointerMove"/.test(sidebar) &&
  /setPointerCapture/.test(sidebar))
check('rail handles keyboard progress', /@keydown="onProgressKeydown"/.test(sidebar))
check('rail uses shared progress calculations',
  /scrollRatioFromPointer/.test(sidebar) &&
  /scrollTopForRatio/.test(sidebar) &&
  /scrollRatioForKey/.test(sidebar))
check('progress fill grows from the top',
  /\.scroll-spy__bar span[\s\S]*top:\s*0/.test(sidebar) &&
  !/\.scroll-spy__bar span[\s\S]*bottom:\s*0[\s\S]*background:/.test(sidebar))
check('desktop sidebar native scrollbar is hidden',
  /scrollbar-width:\s*none/.test(sidebar) &&
  /\.scroll-spy::-webkit-scrollbar/.test(sidebar))
check('mobile drawer native scrollbar is hidden',
  /scrollbar-width:\s*none/.test(mobile) &&
  /\.mobile-layout__toc-drawer::-webkit-scrollbar/.test(mobile))
check('progress input releases pinned heading',
  /function scrollPageToRatio[\s\S]*releasePinnedHeading\(\)/.test(sidebar))
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test:scroll-progress`

Expected: pure checks pass; the new component-contract checks fail.

- [ ] **Step 3: Add rail DOM bindings and event handlers**

Import the pure helpers and add `progressBarRef` plus `activeProgressPointerId`. Change the bar to:

```vue
<div
  ref="progressBarRef"
  class="scroll-spy__bar"
  role="slider"
  aria-label="Page reading progress"
  aria-orientation="vertical"
  aria-valuemin="0"
  aria-valuemax="100"
  :aria-valuenow="progress"
  tabindex="0"
  @pointerdown="onProgressPointerDown"
  @pointermove="onProgressPointerMove"
  @pointerup="onProgressPointerEnd"
  @pointercancel="onProgressPointerEnd"
  @keydown="onProgressKeydown"
>
  <span :style="{ height: `${progress}%` }" />
</div>
```

Implement the component functions with these rules:

```js
function maxScrollY() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

function scrollPageToRatio(ratio) {
  releasePinnedHeading()
  window.scrollTo({ top: scrollTopForRatio(ratio, maxScrollY()), behavior: 'auto' })
}

function pointerRatio(event) {
  const rect = progressBarRef.value?.getBoundingClientRect()
  return rect ? scrollRatioFromPointer(event.clientY, rect.top, rect.height) : 0
}

function onProgressPointerDown(event) {
  if (event.button !== 0) return
  event.preventDefault()
  activeProgressPointerId = event.pointerId
  progressBarRef.value?.setPointerCapture?.(event.pointerId)
  scrollPageToRatio(pointerRatio(event))
}

function onProgressPointerMove(event) {
  if (activeProgressPointerId !== event.pointerId) return
  event.preventDefault()
  scrollPageToRatio(pointerRatio(event))
}

function onProgressPointerEnd(event) {
  if (activeProgressPointerId !== event.pointerId) return
  progressBarRef.value?.releasePointerCapture?.(event.pointerId)
  activeProgressPointerId = null
}

function onProgressKeydown(event) {
  const nextRatio = scrollRatioForKey(event.key, progress.value / 100)
  if (nextRatio === null) return
  event.preventDefault()
  scrollPageToRatio(nextRatio)
}
```

- [ ] **Step 4: Update rail and scrollbar styling**

Remove `scrollbar-color` from `.scroll-spy`, add `scrollbar-width: none` and `-ms-overflow-style: none`, and add a hidden WebKit scrollbar rule. Make the fill top-down and widen the hit target without materially widening layout:

```scss
.scroll-spy::-webkit-scrollbar {
  display: none;
}

.scroll-spy__bar {
  width: 4px;
  padding-inline: 7px;
  margin-inline: -7px;
  overflow: hidden;
  background-clip: content-box;
  cursor: pointer;
  touch-action: none;
}

.scroll-spy__bar span {
  left: 7px;
  right: 7px;
  top: 0;
}
```

In `MobileDrawerLayout.vue`, retain `overflow-y: auto` and add `scrollbar-width: none`, `-ms-overflow-style: none`, plus:

```scss
.mobile-layout__toc-drawer::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 5: Run focused navigation tests**

Run:

```bash
pnpm test:scroll-progress
pnpm test:heading-navigation
pnpm test:scroll-hash-navigation
pnpm typecheck
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit the component behavior**

```bash
git add scripts/test-scroll-progress.mjs src/components/system/ScrollSpySidebar.vue src/layouts/MobileDrawerLayout.vue
git commit -m "fix(scroll): map the progress rail to page position"
```

### Task 3: Scroll feature verification

**Files:**
- No production changes expected.

- [ ] **Step 1: Run the complete relevant regression set**

Run:

```bash
pnpm test:scroll-progress
pnpm test:heading-navigation
pnpm test:scroll-hash-navigation
pnpm test:console
pnpm typecheck
```

Expected: every command exits 0 with no failed checks.

- [ ] **Step 2: Verify the production build**

Run: `pnpm build`

Expected: Vite exits 0 and produces `dist/`.

- [ ] **Step 3: Browser-check the mapping after deployment**

At 25%, 50%, 75%, and 100% rail positions, compare `window.scrollY` with:

```js
const max = document.documentElement.scrollHeight - window.innerHeight
window.scrollY / max
```

Expected: the measured ratio matches the selected rail ratio within 0.01, and the active directory heading continues to follow the page.
