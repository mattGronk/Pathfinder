# Pathfinder workspace update — 6 September 2026

Existing project: `pathfinder-sa` on Vercel. No new website or project created.

## Implemented

- Local university logo files with source provenance in `logo-sources.json`. All 16 reviewed visually. Preserve full artwork and proportions; white artwork sits on dark panels.
- Dedicated `/solutions/for-students`, `/solutions/for-parents`, and `/solutions/for-schools` pages. Original graphics and text inspired by Yenza’s audience-focused presentation.
- Account-gated `/dashboard` with overview, assessment status, career/university explorers, student/parent/school report formats, checklist, and Classic/Modern/Graduate CV layouts.
- Public `/dashboard/demo` uses fictional data and a limited catalogue sample. Demo edits never save to a user account.
- Report and CV export uses the browser’s print-to-PDF dialog. It does not email anyone.
- Server-side catalogue/question filtering. Full paid question sets and full catalogue records no longer appear in public JavaScript bundles.
- Account-linked live Paystack verification. Exact ZAR amount, package metadata, purchaser email and user ID must match. Test transactions fail closed. The old browser access cookie is no longer trusted.
- Private encrypted workspace records in the existing Supabase project. Session metadata contains only the entitlement, avoiding oversized cookies from CV content.

## Storage configuration

Confirmed the Vercel project’s non-secret Supabase hostname matches `axsvaswbqulwyxhhntai.supabase.co`. No production credentials were downloaded.

Provisioned `pathfinder-private-workspaces` in the existing project: private, 100,000-byte object limit, application/json only. `storage.objects` has RLS enabled and no client access policies. Records are read/written by authenticated server operations under the current verified user ID. AES-256-GCM additionally binds ciphertext to the user and record path. The existing `PAYWALL_COOKIE_SECRET` derives a separate storage key; preserve that secret when rotating credentials, or migrate records before rotation.

SQL confirmed client visibility is zero. No changes made to unrelated tables or users.

## Verification

- Production build and TypeScript checks pass.
- ESLint passes.
- `node --test scripts/workspace.test.mjs`: 10 tests cover exact payment amounts, live/test mode, purchaser binding, malformed entitlement, redirect safety, CV validation, encryption, tampering and cross-account record substitution.
- HTTP checks cover the three audience pages, public demo, free catalogue/question limits, all 16 logo assets, signed-out dashboard protection, forged tier cookies and payment API authorization.
- Next.js can emit redirects within a streamed 200 response. Verification checks the redirect marker and absence of private workspace content in that case.

## Limits requiring a real account / external setup

- Paystack live activation and `PAYSTACK_SECRET_KEY` remain outstanding. No live charge was made. The checkout UI states this instead of pretending purchases work.
- Browser automation currently exposes no enabled browser surface. Live click-through, PDF pagination and authenticated cross-device saving still need an interactive check; HTTP and code tests do not substitute for those checks.
- Parent/school reports are individual export formats, not school-wide rosters, parent portals or automatic sharing.
- Existing adult-pilot account restrictions remain in place.

## Existing Supabase advisor findings

The existing project reports public execute permissions on the event-trigger helper `public.rls_auto_enable()` and disabled leaked-password protection. These are pre-existing and were not changed as part of the workspace feature:

- [Public SECURITY DEFINER function permissions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Signed-in SECURITY DEFINER function permissions](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Password strength and leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Design references

- https://www.yenzacareers.com/solutions/for-students/
- https://www.yenzacareers.com/solutions/for-parents/
- https://www.yenzacareers.com/solutions/for-schools/

## Production result

Deployment dpl_3ZNNeqRAXqM2dPgf9KUjTtMuzWku is READY and aliased to https://pathfinder-sa-zeta.vercel.app. All live HTTP checks passed, including all 16 logo files, optimized UCT/UP/UJ images, signed-out and forged-cookie paywall checks, API authorization, audience pages and 404 handling. Account configuration and the HTTPS security header were also verified.

