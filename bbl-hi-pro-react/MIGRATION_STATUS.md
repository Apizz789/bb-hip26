# Migration status: BBL HI PRO (React + TypeScript, mock / demo)

Reference prototype: `../preview_p4.html` (outside this repository). Its SHA-256 matches the pre-handoff snapshot.
All data is fictional and labelled mock. This is not production software.

## 0. Final status: Complete with limitations

The React build meets the project's definition of done for a mock/demo handoff:

- The build passes and is byte-reproducible.
- All 21 unit tests and all 12 E2E suites (243 checks) pass against the React build (`dist/index.html`). Exit code 0.
- The original behaviours listed as uncovered in the previous pass now have E2E checks. No known critical or high-severity migration defect remains.
- Intentional differences from the prototype are listed in §3 and are each justified.

Limitations that stop this from being "complete" in a stronger sense:
- **Typecheck passes on macOS** with `@types/react`, `@types/react-dom` and `@types/node` installed as devDependencies (§5). The Linux build environment could not install them; its earlier typecheck reported 1,305 error lines.
- **Accessibility is checked, but not audited.** Automated checks cover structure, names, measured contrast, keyboard, focus indicators, dialog semantics and reduced motion. No WCAG conformance is claimed (§6).
- **Visual regression compares the prototype and the React build**, not the animation timing (reduced motion is used).

## 1. Verification

The Linux build environment (2026-11-06) and the macOS project are listed separately. Commands and exit codes are as shown.

### 1.1 Linux build environment (Node v22.23.4)

| Command | Exit | Result |
|---|---|---|
| `npm run build` | 0 | Passes. Two consecutive builds produce identical `dist/index.html` and `dist/app.js` (SHA-256 verified) |
| `npm run test:unit` | 0 | **21 / 21 pass** (18 domain tests, 3 store tests) |
| `npm run test:e2e` | 0 | **12 / 12 suites pass, 243 checks, 0 failed** (table below) |
| `npm run test:visual` | 0 | Page heights identical in **30 / 30** prototype/React pairs. Worst pixel diff **0.05%** (threshold 24/255) |
| `npm run typecheck` | 1 | **1,305 error lines**, all from missing React/Node declarations (before the type packages were installed). Breakdown in §5 |
| Prototype integrity | OK | `../preview_p4.html` SHA-256 matches its pre-handoff snapshot |
| Fixed waits in E2E | 0 | No `waitForTimeout` or sleep remains in any suite |
| Dictionary regeneration | OK | `npm run generate:i18n` reproduces `src/i18n/dictionary.ts` byte-for-byte (339 keys) |
| Dev server | OK | `npm run dev` starts and serves the app (HTTP 200) |

E2E results per suite (all against `dist/index.html`):

| Suite | Checks | What it covers |
|---|---|---|
| p1 | 31 | Core flows: language, routing, skip link, resume card, document request, appointment, tracking, wellness, notifications, mobile |
| p2 | 19 | Financial Goals: list, simulated savings, create/edit validation, home sync, mobile overflow |
| p3 | 20 | Goal highlight, journeys, responsive breakpoints, reduced motion |
| p4 | 16 | Splash, skeleton loading, reduced motion, English intro |
| route-focus | 17 | Skip link and route focus, including early activation during a skeleton, keyboard, scroll to top on route change |
| features | 52 | Contact form, Financial Overview controls, cash-flow range, wellness accordion, document copies stepper, appointment notes, notifications, brand page, Playground |
| features-more | 28 | Home quick actions, recent activity, services hub, back buttons, tracking dialog, delivery choice, appointment cancel, footer |
| journeys | 13 | Journeys A-D: document request, appointment, wellness, goals |
| interactions | 16 | Language switch and persistence, dialog focus trap, error summary, goal and home sync, resume card |
| a11y-dom | 5 | Accessible names and labels on every route, focus moves to h1, heading outline, focus indicator |
| a11y-behaviour | 13 | Measured contrast on every route, skip link first and visible, keyboard walk, dialog semantics, reduced motion |
| responsive | 13 | No horizontal overflow at 320 to 1440 px on every route; bottom navigation by width |

### 1.2 macOS project (user's machine, after the type packages were added)

Run by the user with `npm install`, then each command below.

| Command | Result |
|---|---|
| `npm install` | Up to date, 0 vulnerabilities |
| `npm run build` | Passes. `dist/app.js` 317.3 kB, `dist/app.css` 37.6 kB. `dist/index.html` and `dist/app.js` SHA-256 match the Linux build |
| `npm run test:unit` | **21 / 21 pass** |
| `npm run test:e2e` | **12 / 12 suites pass, 243 checks, 0 failed** |
| `npm run test:visual` | Heights identical in **30 / 30** pairs. Worst pixel diff **0.01%** |
| `npm run typecheck` | No errors reported |

Note: the E2E and visual runs were made before `@types/react-dom` was added and before `tsconfig.json` gained `"types": ["node"]`. Neither change affects the bundle or runtime code, but `npm run build && npm run test:unit` should be run once more on macOS after them.

## 2. What changed in this pass

- **Skip link during skeletons (bug fixed).** Pressing the skip link during a skeleton route did nothing, because the heading it targeted was hidden. Loading state is now derived from the route change (`useRoute` returns `navId`), focus moves to the heading once the skeleton finishes, and the skip link targets `<main>` while loading. Regression tests: `route-focus`. Mutation check: restoring the old handler fails 2 checks.
- **Fixed waits removed.** `journeys`, `interactions`, `a11y-dom` and `responsive` were rewritten on the shared runner. Each wait is now a state wait (route ready, splash gone, dialog open, value changed). Assertions were kept. One check that accepted either "focused" or "has links" was made strict: the error summary must take focus.
- **Accessibility beyond DOM.** New suite `a11y-behaviour` (13 checks). See §6.
- **Scroll to top on route change** is now covered by a test (`route-focus`).
- **Runner.** Failing steps are named, and the suite exits non-zero on any failure. Every suite now uses the same runner.

Files changed: `src/app/router.ts`, `src/app/App.tsx`, `src/components/layout/Shell.tsx`, `src/features/goals/GoalsPage.tsx`, `src/features/goals/useGoalBump.ts`, `src/features/home/HomePage.tsx`, `src/store/appState.ts`, `src/styles/components.css` (one rule), `tests/e2e/*`, `tests/unit/store.test.ts`. Documentation: this file, `README.md`, `ARCHITECTURE.md`.

## 3. Intentional differences from the prototype

| Difference | Why | How to reverse |
|---|---|---|
| **Goal highlight is visible.** After a simulated save, the goal card and home card pulse. | The prototype applies the `bump` class, but its reveal rule (`.view.active .reveal`) overrides the pulse, so the pulse never shows. The pulse is the intended feedback. | Remove the `.view.active` scope in `components.css` (the `.goal-item.bump` and `.goal-card.bump` rules). Then the prototype's invisible result is restored |
| **Skip link during a skeleton** moves focus to `<main>`, then to the heading when the skeleton finishes. | The prototype focuses a hidden heading, so the skip link fails. | Not reversed: the old behaviour is the bug |
| **Scroll to top happens when the page is ready**, not when navigation starts. | Makes the focus and scroll position deterministic. The page is not scrolled under the skeleton. | Move the `window.scrollTo` call back into the navigation effect |
| **Unknown hash** falls back to Home but stays in the URL. | Hash router has no 404 page. | Known; see §7 |

Behaviour covered by E2E checks against the React build (these checks encode the prototype's behaviour; they are not a side-by-side run of the prototype): language switch and persistence, document request, appointment booking, request tracking, goal create/edit/save, wellness accordion, overview controls, contact form, notifications, and the Playground Coming Soon state.

## 4. Snapshots and integrity

Three files differ from the pre-handoff snapshot (`source_before.sha256`): `package.json`, `scripts/dev.mjs`, `scripts/generate-dictionary.mjs`. They were changed by the earlier handoff, not by this pass. Each change was investigated before the snapshot was updated:

- `scripts/generate-dictionary.mjs` now reads `../preview_p4.html`. Its output reproduces `src/i18n/dictionary.ts` byte-for-byte (339 keys). The change is intentional: the generator used to point at an older prototype file (264 keys).
- `scripts/dev.mjs` writes only to `.dev/`. The first version wrote to `dist/`, which was a bug and was fixed. Dev server starts and serves the app.
- `package.json` scripts all run. The `notes` field that described the offline environment was removed in the post-verification cleanup, because it contradicted the verified macOS setup.

After the snapshot was taken, the macOS project changed `package.json` (type packages added as devDependencies), `package-lock.json` (generated by `npm install`) and `tsconfig.json` (`"types": ["node"]`). These changes are not in the snapshot. They are described in §5.

The snapshot manifest was updated to the verified state. It lives outside the repository, at `/tmp/handoff/source_final.sha256`. The pre-handoff manifest is kept as `/tmp/handoff/source_before.sha256`.

## 5. TypeScript

**Current state (macOS project).** The type packages are devDependencies:

| Package | Declared in `package.json` |
|---|---|
| `@types/react` | `^19.3.0` |
| `@types/react-dom` | `^19.3.0` (added with `npm install -D '@types/react-dom@^19'`) |
| `@types/node` | `^26.6.6` |

`tsconfig.json` gained `"types": ["node"]`. Without it, `node:test` and `node:assert/strict` did not resolve, even with `@types/node` installed. No strict option was changed. `npm run typecheck` (`tsc -p tsconfig.json`) reports no errors on macOS. JSX and React DOM types are now checked. Re-run the typecheck after any change to these packages.

**Earlier state (Linux build environment).** `@types/react` and `@types/node` could not be installed there, because the npm registry was unreachable. Typecheck reported 1,305 error lines, all from missing declarations. The analysis below was made at that time with a scratch-only shim outside the repository. The shim declared the one JSX rule `@types/react` would supply (`key` on `JSX.IntrinsicAttributes`).

| Error | Before (1,305 lines) | With shim | Meaning |
|---|---|---|---|
| TS2322 `key` (2) | 2 | 0 | Caused by the missing JSX type. The two are `GoalCard` and `RequestRow` (`key` on a function component). React's types allow `key` there. Not a source defect |
| TS7026 (JSX element implicit any) | 1,207 | 0 | Caused by the missing JSX type |
| TS7016 (no declaration for `react`) | 60 | 60 | Missing package declarations |
| TS7006 (implicit any parameter) | 32 | 32 | Handler parameters (`e`, `el`, `x`) in JSX props lose their type without React declarations |
| TS2591 (node modules) | 4 | not tested | In `tests/unit`, which the shim did not include. Missing `@types/node` |

No source defect was found. The 92 errors left with the shim came from the missing package declarations. The shim was not part of the project and was not used for the macOS result.

## 6. Accessibility coverage (what is and is not verified)

Verified by E2E checks:

| Area | Method | Result |
|---|---|---|
| Text contrast | Computed colours on all 11 routes, WCAG 2.x ratio | 341 text items, minimum **4.92:1**, 0 below 4.5:1 (3:1 for large text) |
| Accessible names and labels | DOM check on all routes | Pass |
| Focus on route change | DOM check: focus on the h1 | Pass |
| Heading outline | No skipped levels | Pass |
| Focus indicator | Computed outline on each Tab stop (28 stops on home) | Every stop shows a 3 px outline on `:focus-visible` |
| Keyboard order | Real Tab presses from the top of the page | Skip link first; focus visible on each stop; wraps back to skip link |
| Skip link | Visible on focus | Pass |
| Dialog semantics | `role=dialog`, `aria-modal`, accessible name, focus trap, Escape, focus return | Pass (`interactions`, `a11y-behaviour`) |
| Reduced motion | Animation duration under `prefers-reduced-motion` | Pass (≈0 s) |
| Reflow | Layout at 320 px (400% zoom of 1280 px) | No horizontal overflow on any route |

**Not verified:** screen reader output (NVDA, VoiceOver, TalkBack); an automated rules engine such as axe (not available offline); touch target sizes; text spacing and 200% zoom; colour use as the only indicator of state; keyboard operation of every custom control (only the goal dialog, error summary, skip link and home are walked). **No WCAG conformance is claimed.**

## 7. Remaining issues and risks

### Blockers for a production claim
1. **Accessibility audit not performed** beyond the checks in §6.
2. **No backend, authentication or real data.** Any real use needs a security and compliance review and an integration design.

### Known behaviour gaps (accepted for the mock/demo)
- Unknown hash: falls back to Home, keeps the hash in the URL. No 404 page.
- Timers (toast, focus delay, reveal) are not cleared on unmount. Not reachable today because pages stay mounted.
- Greeting uses the local clock.
- Contact profile shows a fictional bank name from the prototype's content. It was not changed.
- Simulated actions change in-memory state only. Only the language setting persists.
- Global, unscoped CSS (`components.css`), copied from the prototype.
- Font loaded from Google Fonts. Without network access, system fonts are used.

### Production requirements (not in scope)
- Content-Security-Policy, and SRI or a self-hosted font.
- Content-hashed bundle filenames and a cache plan. Current filenames are fixed.
- A persistence design before any state beyond the language setting is kept.

### Decisions for the owner
- **Goal highlight** (§3): kept visible. Reverse with the CSS change in §3 if the prototype's exact result is required.

## 8. Repository state and transfer

- Not a git repository. No `git` commit, push, branch or remote change was made. On the macOS project, three type packages were added as devDependencies, approved for the typecheck (§5). Nothing else was installed.
- Keep: `src/`, `tests/`, `scripts/`, `public/`, `index.html`, `package.json`, `tsconfig.json`, `.gitignore`, the three documents. `dist/` is generated, not kept (run `npm run build`).
- Exclude: `node_modules/`, `dist/`, `.dev/`, `.visual-out/`, `.artifacts/`, `.DS_Store`.
- Outside the repository, not part of the handoff: earlier probe and scratch scripts in `/home/claude/work/` (`*.js`, `*.py`, `shots/`, `*.out`). The prototype `preview_p4.html` must stay beside the project (`npm run generate:i18n` and `npm run test:visual` read it).
- The prototype (`preview_p4.html`) is unchanged.

## 9. Commands

```
npm run build          # production bundle to dist/ (reproducible)
npm run dev            # watch + serve .dev/ on http://localhost:5173
npm run test:unit      # 21 unit tests
npm run test:e2e       # 12 E2E suites, 243 checks (run build first)
npm run test:visual    # prototype vs React pixel comparison (needs Pillow)
npm run typecheck      # tsc with strict settings; no errors on macOS (§5)
npm run generate:i18n  # regenerate src/i18n/dictionary.ts from the prototype
node tests/e2e/a11y-behaviour.e2e.cjs   # run one suite; any failure exits 1
```

## 10. Checklist

- [x] Build passes and is reproducible
- [x] Unit tests: 21 / 21
- [x] E2E: 12 / 12 suites, 243 checks, exit 0
- [x] Skip-link timing bug fixed; regression tests
- [x] Goal highlight kept visible and documented (§3)
- [x] Scroll behaviour covered by a test and documented (§3)
- [x] Fixed waits removed (0 remain)
- [x] Accessibility beyond DOM: contrast, keyboard, dialog, reduced motion (§6)
- [x] Visual regression: 30/30 heights identical; worst diff 0.05%
- [x] Prototype unchanged; snapshots investigated and updated (§4)
- [x] `@types/react`, `@types/react-dom` and `@types/node` installed; typecheck passes on macOS (§5)
- [ ] Screen reader, automated rules engine, text spacing, 200% zoom (§6)
- [ ] Security, CSP, SRI and hashed filenames (before any hosted use)
