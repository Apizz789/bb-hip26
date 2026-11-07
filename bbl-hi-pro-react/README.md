# BBL HI PRO — React + TypeScript (mock / demo)

## What this is
BBL HI PRO is a web experience concept that sits beside Bangkok Bank Mobile Banking. It focuses on service
access, Financial Wellness, and Financial Goals. This repository is the React + TypeScript migration of the
Phase 1–4 HTML prototype (`preview_p4.html`, kept unchanged).

## What this is not
- Not a replacement for Mobile Banking.
- Not connected to any Bangkok Bank API, real customer data, real transactions, or authentication.
- Not production software. No backend, no security review, no compliance claims.
- The Playground page is not connected to the app's goals or mock data. It embeds a separate 3D zoo (`public/zoo/index.html`, locked at v10.13) that keeps its own simulated state.

All data is fictional and marked as mock (`src/data/mock.ts`). Document requests, appointments, and savings
are simulated in memory and reset on reload.

## Pages
Home (overview, cash-flow chart, goal summary, resume card) · Services (hub) · Document request
(form → review → confirmation) · Appointment booking (branch, purpose, date, time, confirmation) · Request
tracking (filters, timeline) · Financial overview (monthly breakdown) · Financial Wellness (score, factors,
insights, recommendations) · Financial Goals (create, edit, simulated savings) · Contact (form, simulated
submission) · Playground (3D zoo) · Brand.

## Requirements
- Node.js (the exact version used for this handoff was not recorded; run `node --version` to confirm).
- The reference prototype `../preview_p4.html` (one folder above this project). It is needed by
  `npm run generate:i18n` and `npm run test:visual`. The app itself does not load it.
- Chromium for Playwright (needed by `test:e2e` and `test:visual`).
- Python 3 with Pillow for the pixel comparison in `test:visual`.

## Setup
Two situations:

**A. Normal machine (npm registry reachable).** This is the macOS setup that was verified.
    npm install
    npx playwright install chromium
    pip3 install pillow

**B. Offline environment (what this handoff was built in).** `node_modules/` is populated with local copies of
react, react-dom, scheduler, esbuild, typescript, and tsx. Playwright is listed in `devDependencies` but is not in
`node_modules/`; the E2E and visual scripts resolve the globally installed copy (`require('playwright')`). Do not run
`npm install` there; it fails without the registry. The commands below all work with this layout.

## Commands (results from the latest run; details in MIGRATION_STATUS.md §1)
Run from the project root.

| Command | Purpose | Result |
|---|---|---|
| `npm run build` | Bundle to `dist/` (esbuild, IIFE) | Passes |
| `npm run dev` | Watch + serve `.dev/` on http://localhost:5173 | Writes only `.dev/`, never `dist/` |
| `npm run test:unit` | Domain, store, and utility unit tests (node:test + tsx) | 21 / 21 pass |
| `npm run test:e2e` | All 12 E2E suites against `dist/index.html` (run build first) | **12 / 12 suites pass, 243 checks, 0 failed.** Exit 0 |
| `npm run test:visual` | Screenshots of prototype and React at 390/430/768/1000/1440 px, then pixel diff | Heights identical in all 30 pairs. Worst pixel diff 0.05% (threshold 24/255) |
| `npm run typecheck` | `tsc -p tsconfig.json` with strict settings, including JSX | No errors on macOS, where the React and Node type packages are installed (see MIGRATION_STATUS.md §5) |
| `npm run generate:i18n` | Regenerate `src/i18n/dictionary.ts` from the prototype's `const S` | Reproduces the committed file from `preview_p4.html` (339 keys) |

Run one E2E suite: `node tests/e2e/journeys.e2e.cjs`. Point any suite elsewhere with `BBL_URL=file:///path/to/index.html`.
Each suite exits non-zero if any check fails, and `run-all.mjs` reports it as FAIL.

## E2E suites
- **p1** core flows: language, routing, skip link, resume card, document request, appointment, tracking filters, wellness, notifications, mobile.
- **p2** Financial Goals: list, simulated savings, create/edit validation, home card sync, mobile overflow.
- **p3** goal highlight (restored prototype `.bump`), journeys, responsive breakpoints, reduced motion.
- **p4** splash, skeleton loading, reduced motion, English intro.
- **route-focus** skip link and route focus, including early skip activation during a skeleton route (13 checks).
- **features** contact form, Financial Overview controls, cash-flow range, wellness accordion, document copies stepper, appointment notes counter, notifications, brand page, Playground (52 checks).
- **features-more** home quick actions, recent activity, services hub and back buttons, request tracking dialog, delivery choice, appointment cancel, footer links (28 checks).
- **a11y-dom**: accessible names, labels, focus on route change, heading outline, focus indicator (structure checks).
- **a11y-behaviour**: measured text contrast on every route, skip link first and visible, keyboard walk with focus indicators, dialog semantics, reduced motion (13 checks).
- **journeys**, **interactions**, **responsive**: journey, interaction, and overflow checks.

All suites use the shared runner (`tests/e2e/helpers.cjs`). The suites wait for UI state, not fixed times. p1–p4 check
behaviour through roles, labels, and React state, not the prototype's DOM hooks (MIGRATION_STATUS.md §2 lists each old selector).

Accessibility is checked at the DOM and behaviour level. Screen reader output, an automated rules engine (axe), and
200% text zoom have not been verified (MIGRATION_STATUS.md §6). No WCAG conformance is claimed.

## Repository layout
    src/          application source (see ARCHITECTURE.md)
    tests/unit/   unit tests (domain and utilities)
    tests/e2e/    Playwright suites (*.cjs; run-all.mjs runs them all)
    tests/visual/ screenshot capture and pixel comparison
    scripts/      build, dev server, i18n generator
    public/       static files copied into dist/ (currently empty)
    dist/         production build output (git-ignored; generate with npm run build)
    index.html    HTML template used by build and dev
    .gitignore    excludes node_modules/, dist/ (keeps dist/.gitkeep), .dev/, .visual-out/, .artifacts/

## Environment substitutions (current toolchain)
The intended stack is Vite + React Router + Vitest + React Testing Library + @types/react. None of these were
installable in the environment where this was built. The project uses the following instead:

| Intended | Used now |
|---|---|
| Vite | esbuild (`scripts/build.mjs`, `scripts/dev.mjs`) |
| React Router | small hash router (`src/app/router.ts`) |
| Vitest | `node:test` run through `tsx` |
| React Testing Library | not used; behaviour covered by Playwright |
| @types/react, @types/react-dom, @types/node | installed as devDependencies; JSX and Node types are checked |

The steps for moving to the intended stack once the registry is available are in ARCHITECTURE.md, under "Future migration path".

## Troubleshooting (macOS)
- **`The Yarn Plug'n'Play manifest forbids importing react`, or esbuild cannot resolve modules:** a `.pnp.cjs` file in a parent folder (for example your home folder) makes the build treat the project as a Yarn PnP workspace. Move it away (for example `~/.pnp.cjs`). Do not run `yarn` in the home folder, because it regenerates that file.
- **`npm run test:visual` cannot find `preview_p4.html`:** the prototype must sit one folder above the project (`../preview_p4.html`).
- **`You installed esbuild for another platform`:** `node_modules/` was copied from another machine. Delete it and run `npm install` on this machine.

## Persistence
Only the selected language is saved, in `localStorage` under `bblhipro-lang`. Everything else lives in memory
and resets on reload. No cookies, no network storage, no sensitive financial data.

## Documentation
- `ARCHITECTURE.md` — structure, routing, state, data, localisation, build and test setup, future migration path.
- `MIGRATION_STATUS.md` — final status, verification results with exit codes, intentional differences from the prototype, snapshot investigation, TypeScript limitation, accessibility coverage, remaining risks, transfer list, checklist.
