# Pathfinder administration

The existing application now has `/admin`, `/admin/users`, `/admin/users/[id]`, and `/admin/entitlements`. The account page lists each user's own products and shows an administration link only to approved admins. Existing authentication, encrypted profiles, results, CVs, product tiers and Paystack verification are retained.

## Grant and revoke access

1. Sign in to your existing Pathfinder account and open `/admin`.
2. Select **Users**, search by name or email, and open the account.
3. Select **Grant access**, choose Hatchling or Trailblazer, optionally enter an expiry and internal note, and confirm the review dialog.
4. To revoke one entitlement, select its **Revoke access**, add an optional note and confirm. The entitlement and grant/revoke history remain in the database.

Dates in lists use South African Standard Time. The expiry input uses the admin's browser timezone and is converted to an absolute UTC timestamp before submission. Access is checked on each server request. The affected user can reload their account/dashboard to see the change; no new login is required. Already downloaded content cannot be recalled. Revoking one entitlement preserves benefits provided by other active entitlements.

Inactive products cannot receive new admin grants but existing entitlements retain their benefits until revoked or expired. A second active entitlement for the same user/product is rejected by the manual grant procedure. To change expiry, revoke the old grant and create a new one so both decisions remain in history.

## Safely promote an owner

The initial owner was explicitly approved and promoted during implementation. No email address is embedded in frontend authorization, no user is promoted by signup order, and the web application cannot create or edit admin memberships.

For a future admin, an existing Supabase project owner should use the SQL Editor after verifying the user's identity and UUID in **Authentication → Users**. Replace the placeholder below with that exact UUID; the block fails if it is not a verified, available account.

```sql
do $$
declare approved_user uuid;
begin
  select id into strict approved_user
  from auth.users
  where id = 'REPLACE_WITH_VERIFIED_USER_UUID'::uuid
    and email_confirmed_at is not null
    and deleted_at is null
    and (banned_until is null or banned_until <= now());
  insert into public.pathfinder_admins(user_id)
  values(approved_user)
  on conflict(user_id) do nothing;
end $$;
```

To remove admin privileges, delete only the chosen user's membership from `pathfinder_admins` using the trusted SQL Editor. Membership checks are live; stale JWT metadata cannot retain the role. This does not delete the account, purchases, or audit history.

## Database migration and existing data

`supabase/migrations/20260920215810_admin_entitlements.sql` was applied to the existing `axsvaswbqulwyxhhntai` project. Its timestamp matches the remote migration history (the CLI-generated file was renamed to the applied version). It adds:

- `pathfinder_admins`: protected memberships, approval date and optional approving user.
- `pathfinder_products`: extensible product catalogue seeded with existing Hatchling/Trailblazer benefits.
- `pathfinder_directory`: only safe account fields for searchable, paginated admin lists.
- `pathfinder_entitlements`: user/product ownership, source, granting/revoking actors and times, optional expiry, provider reference and idempotency key.
- `pathfinder_entitlement_audit`: internal notes and durable grant/revoke events.
- A security-invoker directory view and private database procedures behind narrowly granted public RPCs.

Existing `app_metadata.pathfinder_access` claims with the previous valid tier/reference format were copied into `legacy_import` entitlements. Existing metadata was preserved for the previous deployment; the new application never falls back to it for access, so revocation cannot be bypassed by stale claims. Imported `granted_at` records migration time, not an invented purchase date.

Existing encrypted profile names are indexed after verified admin access in batches of up to 100, with at most five storage reads in parallel. Both existing accounts are covered by the first visit. Larger installations can revisit the admin overview to complete additional batches. Profile updates and deletion synchronize the directory name. Profiles, drafts and results remain in the existing encrypted storage; credentials and raw Auth objects are never sent to admin client components.

The repository previously had no baseline migrations for the existing profile tables. This is an additive migration for that established schema, not a replacement or a standalone reset of the production database. Do not run a destructive database reset to install it.

## Authorization and payments

Every admin page/data loader and server action independently verifies the current Supabase user and current admin membership. Database grant/revoke functions also check membership, account availability, product availability, expiry and input bounds, derive the actor from `auth.uid()`, and commit the entitlement/audit event atomically. Idempotency keys and per-user/product locks prevent duplicate manual grants.

RLS and SQL grants prevent anonymous access, role edits, product edits, direct entitlement writes and audit writes. Users can read only their own entitlements; admins can read account records, all entitlements and private audit notes. Private SECURITY DEFINER routines have an empty search path and explicit execution grants. Public wrappers use SECURITY INVOKER. Server Actions keep Next.js origin/CSRF protections. Admin/account responses are private and uncached. Service credentials remain server-only.

The existing Paystack verifier still validates live mode, success, ZAR, exact amount, package, customer email and bound user ID on the server. It now records a `payment` entitlement through a service-role-only RPC. Repeating a provider reference cannot transfer a purchase to another account or reactivate a revoked purchase, including a migrated legacy purchase.

Future signed payment webhooks can use the same product/entitlement model. No webhook or fake payment flow is added here. `payment`, `promotion`, `subscription`, `admin_grant` and `legacy_import` sources are supported; a subscription integration should use its own verified renewal/cancellation logic and retain event history.

## Environment

No new environment variables are required. The existing deployment needs:

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for authenticated server clients.
- `SUPABASE_SECRET_KEY` (or existing `SUPABASE_SERVICE_ROLE_KEY`) for authorized private-storage reads, name indexing and verified payment recording. Never prefix either with `NEXT_PUBLIC_`.
- The unchanged `PAYWALL_COOKIE_SECRET`, which encrypts/decrypts existing private workspace records. Do not rotate it as part of this feature.
- Existing `APP_URL`, account enablement and Paystack configuration remain in effect.

## Verification

Run unit/regression tests with `node --import tsx --test tests/assessment-journey.test.ts tests/result-persistence.test.mjs tests/entitlements.test.ts tests/admin-authorization.test.mjs scripts/workspace.test.mjs scripts/auth-recovery.test.mjs scripts/chart-data.test.mjs`.

Run `supabase/tests/admin_entitlements.sql` as the database owner against the migrated project. It creates isolated fixtures inside a transaction, tests anonymous/member/admin/demoted-admin permissions, ownership isolation, grant/revoke auditing, expiry and payment replay protections, and rolls everything back. It does not send emails or charge payments.

Build using the existing Vercel configuration (`VERCEL=1 next build`; set `$env:VERCEL='1'` in PowerShell first).

Supabase advisor checks reported no warnings for the new admin objects. Existing project warnings are documented separately in the implementation verification notes; they were not silently changed by this feature.
