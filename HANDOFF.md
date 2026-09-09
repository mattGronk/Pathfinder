# Pathfinder SA handoff — updated 8 September 2026

The Bklit chart update is deployed to the existing production site. Current deployment: dpl_85vTEko7JLu3C6TxnUsRxk2PyiJT. Current framework: Next.js 16.3.4; React 19.2.6. The dashboard has interactive progress rings and response bar charts; completed assessment results use the same count charts. Tests and public-site checks pass. The production dependency audit reports zero vulnerabilities. See research/bklit-verification.md for changes, verification evidence and remaining limitations.

Continue from this source, not the older starter in the ChatGPT project mirror root. This portable archive excludes local credentials, environment files, node_modules and build output. Authenticate normally on another computer, link the existing Vercel project, and recheck the current live deployment before publishing.

## Original source handoff — 7 September 2026

This archive contains the current editable Vercel source and assets from the original computer. Continue editing this existing app; do not create another website.

Production: https://pathfinder-sa-zeta.vercel.app
Vercel project: pathfinder-sa
Vercel scope: matthewdegryse-7320
Supabase project: axsvaswbqulwyxhhntai
Latest deployed recovery update: dpl_4H4LUTZhUr9J1zggaYVLEqD8RbyE

Use Node >=22.13.0 and npm ci. In PowerShell build with:
$env:VERCEL='1'
npx next build
For local development use npx next dev with the same VERCEL variable.
Some package.json scripts are legacy Sites scripts; use the Next commands above.

Credentials, environment files, node_modules, build output, and local Vercel authentication/link state are deliberately excluded. Authenticate normally and link to the existing Vercel project on the laptop. Do not deploy before confirming project identity and comparing the current live deployment with the deployment above.

There are no local Supabase migration files in this checkout. Existing remote storage setup is documented in research/workspace-verification.md. Do not recreate the existing backend. Preserve the production PAYWALL_COOKIE_SECRET: it derives the key used for stored private workspace records.

The app includes university logos, audience pages, paid dashboard, reports and CV templates, Reggie assets and server-side access controls. Supabase stores subscription access in app_metadata.pathfinder_access; do not use user-editable metadata for access decisions.

Password recovery routing is deployed. The user reports changing Supabase Site URL on their phone; redirect allowlist and email template still need verification. research/recovery-fix.md and recovery-email-template.html document the intended settings. Never copy passwords or credentials from conversation into files.

Paystack live activation/configuration remains unverified. Full complimentary owner access was granted separately in the existing backend. No paid transaction was performed.

Tests: node --test scripts/workspace.test.mjs scripts/auth-recovery.test.mjs
Research notes are historical snapshots; dates and limitations may predate later fixes.
