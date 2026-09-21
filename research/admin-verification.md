# Admin and entitlement verification — 21 September 2026

Implemented in the existing `pathfinder-github` checkout, based on `68b5055` from `mattGronk/Pathfinder`. Production uses the existing `pathfinder-sa` Vercel project and `axsvaswbqulwyxhhntai` Supabase project. The live domain is https://pathfindersa.com (the older handoff's `pathfinder-sa-zeta.vercel.app` is no longer its production alias).

Final application deployment: `dpl_2cZBYALhEkJjaBKVU9Qx5QP7dqUN`, https://pathfinder-f2393gyot-matthewdegryse-7320.vercel.app, promoted to the existing domain. Migration `20260920215810_admin_entitlements` was applied and its local filename aligned with the remote migration history.

## Passed checks

- 25 existing assessment, persistence, encrypted-storage, payment-validation, chart and recovery regression tests.
- Three entitlement tests for highest active product, revocation, exact expiry boundary and retired product benefits.
- Six isolated server authorization tests: signed-out redirects; normal-user grant/revoke denial despite forged fields; role lookup failures fail closed; only validated RPC arguments are forwarded; authorization rechecks after a role change; invalid input/past expiry/missing confirmation cannot mutate.
- Real Supabase SQL permission tests using temporary fixtures in one rolled-back transaction: anonymous denial; admin role spoofing blocked; protected directory/view/audit hidden from members; direct role/product/entitlement writes blocked; user isolation; authorized atomic grants/audit; idempotency; duplicate and past-expiry rejection; revocation/audit; expired entitlement excluded; removed-admin authorization denied; service-only payment recording; receipt theft and revoked-payment replay blocked.
- TypeScript and focused ESLint checks passed. Local and final Vercel production builds succeeded.
- Signed-out browser `/admin` redirected to `/account?next=/admin` and exposed no admin data. Headers were private/no-store. Next streams some redirects in a 200 response, so the browser destination was checked as well as headers.
- Existing signed-in owner opened `/admin`, searched users by email, opened their detailed profile, and saw real legacy onboarding, stored assessment results, entitlements and history.
- Live UI grant/revoke cycle: a Hatchling grant was added to the already-Trailblazer owner account, appeared on `/account`, then was revoked through its confirmation dialog. Success feedback and both audit events were verified in the UI and database. Existing Trailblazer access stayed active. The revoked test record intentionally remains as labeled audit history.
- Existing paid dashboard loaded with the owner's two saved assessments. No account registration or password reset was needed.
- Mobile admin profile and overview inspected at a 390×844 viewport; document content width matched viewport width (375 CSS pixels after scrollbar). Forms fit the page, navigation wrapped, and tables scroll inside their container. Viewport override restored afterwards.
- Production-only dependency audit: zero vulnerabilities. No dependencies changed.
- Supabase advisor: no warnings for the new admin objects.

## Scope and limitations

No payment was charged and no real-provider webhook was added. The existing verifier's ownership/amount/currency tests passed, and the database payment procedure was tested with rolled-back synthetic provider records.

A proposed live test temporarily removing the real owner's admin membership was blocked by automatic approval review because the user had authorized promotion, not removal. The membership was never deleted. That case was instead verified with the isolated server authorization tests and real SQL tests on temporary accounts. Do not describe it as a live browser test with a normal-user session.

Automatic approval review also blocked pulling production secrets into a local file. Testing used Vercel's existing runtime configuration instead. A regular `vercel link` generated its own ignored local OIDC file; application secrets were not downloaded.

Pre-existing advisor warnings remain: execution privileges on `public.rls_auto_enable()` and disabled leaked-password protection. See [function execution guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). The complete installation audit also reports 14 existing development-tool dependency vulnerabilities; the production-only audit is clean. These were not silently changed as part of the admin feature.

Existing private profiles remain encrypted with the unchanged workspace secret. Earlier student-profile fields are shown through explicit allowlists; raw Auth users, credentials, tokens and arbitrary metadata are not rendered.
