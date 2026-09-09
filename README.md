# Pathfinder SA

The source for [Pathfinder SA](https://pathfinder-sa-zeta.vercel.app), a South African career exploration app built with Next.js, React and Supabase, hosted on Vercel.

This repository starts with the production release from 8 September 2026, including Bklit progress rings and response charts. Deployment: `dpl_85vTEko7JLu3C6TxnUsRxk2PyiJT`.

## Run locally

Use Node.js 24 and install the locked dependencies:

```sh
npm ci
```

On macOS/Linux:

```sh
npm run dev:vercel
```

On Windows PowerShell:

```powershell
$env:VERCEL='1'
npx next dev
```

The public demo is at `/dashboard/demo`. Authentication and private workspace features require the existing project's environment configuration. Store local environment variables in `.env.local`; never commit that file.

## Build and check

```sh
npm run build:vercel
npx eslint src proxy.ts
node --test scripts/workspace.test.mjs scripts/auth-recovery.test.mjs scripts/chart-data.test.mjs
```

In PowerShell, build with `$env:VERCEL='1'` followed by `npx next build`. To check a running app:

```sh
node scripts/check-workspace-http.mjs http://localhost:3100
```

The default `dev`, `build`, `test` and `lint` npm scripts are historical tooling; use the Next.js commands above for the Vercel app.

## Deployment

Link to the **existing** Vercel project `pathfinder-sa` in scope `matthewdegryse-7320`. `vercel.json` defines the deployment build and install commands. Confirm the latest deployment before publishing changes from another computer.

Reuse the existing Supabase integration and production environment. Preserve `PAYWALL_COOKIE_SECRET`: it derives the encryption key for private workspace records. Do not recreate the backend or replace its secrets.

Credentials, local environment files, dependencies and build output are excluded from Git. No GitHub Actions or new deployment automation is configured by this source import.

See [HANDOFF.md](HANDOFF.md) and [verification notes](research/bklit-verification.md) for project context and test limitations. Imported Bklit chart components retain their [MIT license](src/components/charts/LICENSE).
