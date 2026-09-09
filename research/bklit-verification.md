# Bklit component update — 8 September 2026

## Source and destination

This is the current app recovered from `Pathfinder-SA-current-source-2026-09-07.zip`, not the older starter at the project mirror root. Work only from `bklit-update/vercel-pathfinder`.

The archive handoff matches the connected Vercel project's latest production deployment, rechecked on 8 September:

- Project: `pathfinder-sa` / `prj_K3GT1fRZJGlTIZUFF098enG9Xjyd`
- Team: `matthewdegryse-7320` / `team_wVlyQVlnQriRGYCvG9DEhUvl`
- Baseline: `dpl_4H4LUTZhUr9J1zggaYVLEqD8RbyE`
- Production: https://pathfinder-sa-zeta.vercel.app
- Supabase: `axsvaswbqulwyxhhntai`

## Changes

The active dashboard uses Bklit ring components for assessment/checklist progress, with separate denominators and an accessible interactive legend. The dashboard interest snapshot and completed assessment results use Bklit bar charts with tooltips, exact count tables, responsive layouts, print fallbacks, and reduced-motion support. Charts consume the existing saved-result model and do not change scoring or storage. Counts are explicitly described as response frequencies rather than ability or career-match percentages.

The existing purple, navy and cream design tokens provide the chart colours. Components load dynamically at their points of use. The legacy `/assessment` route continues redirecting to the current `/assessments` flow; its original chart code is preserved.

Six application/configuration files differ from the supplied ZIP: layout.tsx, assessment-suite-client.tsx, workspace-client.tsx, eslint.config.mjs, package.json and package-lock.json. New component/helper/style/test files and the shadcn registry configuration are added separately. The handoff notes were updated, and Vercel's link command added its local environment ignore entry. No auth, payment, storage or database code was modified.

## Upstream source

- Bklit: https://bklit.com/
- Registry and component documentation: https://ui.bklit.com/
- Source/license: https://github.com/bklit/bklit-ui
- Registry URLs: https://ui.bklit.com/r/bar-chart.json and https://ui.bklit.com/r/ring-chart.json, with their registry dependencies. Radar components are also available in the imported library but are not used on current app routes.

Imported chart sources are retained under `src/components/charts`, including the MIT license. Added package versions are locked, including the Visx 4.0.1-alpha.0 version specified by the upstream registry for React 19. React remains 19.2.6. Next.js and eslint-config-next were updated from 16.2.6 to 16.3.4 after Vercel's build reported existing framework, PostCSS and sharp production advisories. The updated production dependency audit reports zero vulnerabilities. Fourteen advisories remain in legacy development tooling; those packages are not production dependencies. No force-fix or major-version migration was applied.

Maintenance update references: https://github.com/vercel/next.js/releases/tag/v16.3.4 and https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj. This was an update within Next 16, so the major-version codemods were not applicable.

The upstream library uses imperative animation refs and portal measurements. ESLint's React Compiler `refs` and `set-state-in-effect` diagnostics are disabled only for the imported chart directory; this app does not enable React Compiler. Its existing d3 curve-factory `any` is excepted only in `loading-sweep.tsx`. All application components retain normal checks. Four upstream warnings remain: two unused generic type parameters and two intentionally limited effect dependency arrays. No application lint errors or warnings were found. Upstream sources are not otherwise patched.

## Verification

- Production build: `VERCEL=1 next build` — passed locally with the initial chart change and on Vercel with the final Next 16.3.4 update, including TypeScript and all 14 generated pages.
- Tests: `node --test scripts/workspace.test.mjs scripts/auth-recovery.test.mjs scripts/chart-data.test.mjs` — 17 passed.
- HTTP checks: `node scripts/check-workspace-http.mjs http://localhost:3100` and `node scripts/check-workspace-http.mjs https://pathfinder-sa-zeta.vercel.app` — all checks passed, covering audience pages, demo, upgrade, account restrictions, forged tier cookie rejection, premium-question exclusion, payment endpoint access controls, 16 official logos and unknown audience 404. Use localhost for the local harness: Next's local request URL origin differs from 127.0.0.1 for same-origin payment guards.
- Lint: `eslint src proxy.ts` — zero errors, four upstream warnings described above.
- Browser: desktop 1366px and mobile 390px checked. Mobile document width equals scroll width (375px excluding scrollbar). No browser console errors or warnings. Tooltip correctly reads Analytical, 7 of 16 responses; exact table shows 7, 5 and 4 of 16. Checklist interaction updates the progress ring from 1/4 to 2/4. CV studio navigation and sample content remain available.
- Supabase read-only verification: `pathfinder-private-workspaces` exists, is private, has 100000-byte limit and allows application/json. No remote writes or migrations performed.

## Deployment completed

Production deployment: `dpl_85vTEko7JLu3C6TxnUsRxk2PyiJT`, created 8 September 2026, READY. Immutable URL: https://pathfinder-5wpeyre7p-matthewdegryse-7320.vercel.app. Promoted after authenticated preview checks; `vercel inspect https://pathfinder-sa-zeta.vercel.app` confirms that the public site resolves to this exact final deployment. The public dashboard displays the new charts, its demo checklist updates the rings, mobile width has no overflow, and its browser console has no errors or warnings.

The deployment reused the existing production environment and Supabase integration. No credentials are included in the portable source archive. On another computer, authenticate normally and link this directory to the existing project/team above. Recheck the live deployment before uploading in case another computer has since deployed changes. Preserve existing environment variables, especially PAYWALL_COOKIE_SECRET because it derives private-workspace encryption keys. Do not recreate Supabase resources. The previous production deployment is recorded above as the source baseline, not as the current release.

Browser verification used the public demo and public access-control paths. A signed-in paid assessment save/reload flow has not been exercised against production in this update; the backend and access logic are unchanged. No payment transaction was performed.
