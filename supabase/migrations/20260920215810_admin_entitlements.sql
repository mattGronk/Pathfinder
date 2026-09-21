-- Additive migration for the existing Pathfinder Auth and encrypted workspaces.
create schema if not exists pathfinder_private;
revoke all on schema pathfinder_private from public, anon, authenticated;
grant usage on schema pathfinder_private to authenticated;

create table public.pathfinder_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null
);
alter table public.pathfinder_admins enable row level security;
revoke all on public.pathfinder_admins from public, anon, authenticated;
grant select on public.pathfinder_admins to authenticated;
grant all on public.pathfinder_admins to service_role;
create policy own_admin_membership on public.pathfinder_admins for select to authenticated
  using (user_id = (select auth.uid()));

create function pathfinder_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.pathfinder_admins a join auth.users u on u.id=a.user_id
    where a.user_id=auth.uid() and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= now()));
$$;
revoke all on function pathfinder_private.is_admin() from public, anon;
grant execute on function pathfinder_private.is_admin() to authenticated;
create function public.pathfinder_is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$ select pathfinder_private.is_admin(); $$;
revoke all on function public.pathfinder_is_admin() from public, anon;
grant execute on function public.pathfinder_is_admin() to authenticated;

create table public.pathfinder_products (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text not null default '', active boolean not null default true,
 access_tier text not null default 'free' check(access_tier in ('free','start','full')),
 created_at timestamptz not null default now()
);
insert into public.pathfinder_products(name,slug,description,access_tier) values
 ('Hatchling','hatchling','The existing Pathfinder starter assessments and dashboard.','start'),
 ('Trailblazer','trailblazer','Full Pathfinder assessments, career library, reports and CV tools.','full');

create table public.pathfinder_directory (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text, display_name text not null default '' check(length(display_name)<=120), name_indexed_at timestamptz,
 joined_at timestamptz not null, email_confirmed boolean not null default false,
 banned_until timestamptz, deleted_at timestamptz
);
create index pathfinder_directory_joined on public.pathfinder_directory(joined_at desc,user_id);
create index pathfinder_directory_email on public.pathfinder_directory(lower(email));

create table public.pathfinder_entitlements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 product_id uuid not null references public.pathfinder_products(id) on delete restrict,
 source text not null check(source in ('admin_grant','payment','promotion','subscription','legacy_import')),
 granted_at timestamptz not null default now(),
 granted_by uuid references auth.users(id) on delete set null,
 expires_at timestamptz check(expires_at is null or expires_at > granted_at),
 status text not null default 'active' check(status in ('active','revoked')),
 revoked_at timestamptz, revoked_by uuid references auth.users(id) on delete set null,
 provider text, external_reference text, request_id uuid unique,
 check ((status='active' and revoked_at is null and revoked_by is null) or (status='revoked' and revoked_at is not null)),
 check ((provider is null) = (external_reference is null)),
 unique(provider,external_reference)
);
create index pathfinder_entitlements_user on public.pathfinder_entitlements(user_id,status,expires_at);
create index pathfinder_entitlements_product on public.pathfinder_entitlements(product_id);
create index pathfinder_entitlements_recent on public.pathfinder_entitlements(granted_at desc);
create index pathfinder_entitlements_grantor on public.pathfinder_entitlements(granted_by);
create index pathfinder_entitlements_revoker on public.pathfinder_entitlements(revoked_by);
create index pathfinder_admins_approver on public.pathfinder_admins(approved_by);

create table public.pathfinder_entitlement_audit (
 id uuid primary key default gen_random_uuid(),
 entitlement_id uuid not null references public.pathfinder_entitlements(id) on delete restrict,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null check(action in ('granted','revoked')), occurred_at timestamptz not null default now(),
 note text check(length(note)<=2000)
);
create index pathfinder_audit_entitlement on public.pathfinder_entitlement_audit(entitlement_id,occurred_at desc);
create index pathfinder_audit_actor on public.pathfinder_entitlement_audit(actor_id);

alter table public.pathfinder_products enable row level security;
alter table public.pathfinder_directory enable row level security;
alter table public.pathfinder_entitlements enable row level security;
alter table public.pathfinder_entitlement_audit enable row level security;
revoke all on public.pathfinder_products,public.pathfinder_directory,public.pathfinder_entitlements,public.pathfinder_entitlement_audit from public,anon,authenticated;
grant select on public.pathfinder_products,public.pathfinder_directory,public.pathfinder_entitlements,public.pathfinder_entitlement_audit to authenticated;
grant all on public.pathfinder_products,public.pathfinder_directory,public.pathfinder_entitlements,public.pathfinder_entitlement_audit to service_role;
create policy products_read on public.pathfinder_products for select to authenticated using(true);
create policy directory_admin_read on public.pathfinder_directory for select to authenticated using((select pathfinder_private.is_admin()));
create policy entitlements_read on public.pathfinder_entitlements for select to authenticated using(user_id=(select auth.uid()) or (select pathfinder_private.is_admin()));
create policy audit_admin_read on public.pathfinder_entitlement_audit for select to authenticated using((select pathfinder_private.is_admin()));

-- Auth trigger mirrors only safe directory fields, never credentials or tokens.
create function pathfinder_private.sync_directory() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.pathfinder_directory(user_id,email,display_name,joined_at,email_confirmed,banned_until,deleted_at)
 values(new.id,new.email,left(coalesce(new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'full_name',''),120),new.created_at,new.email_confirmed_at is not null,new.banned_until,new.deleted_at)
 on conflict(user_id) do update set email=excluded.email,email_confirmed=excluded.email_confirmed,banned_until=excluded.banned_until,deleted_at=excluded.deleted_at;
 return new;
end; $$;
revoke all on function pathfinder_private.sync_directory() from public,anon,authenticated;
create trigger pathfinder_sync_directory after insert or update of email,email_confirmed_at,banned_until,deleted_at on auth.users for each row execute function pathfinder_private.sync_directory();
insert into public.pathfinder_directory(user_id,email,display_name,joined_at,email_confirmed,banned_until,deleted_at)
select id,email,left(coalesce(raw_user_meta_data->>'display_name',raw_user_meta_data->>'full_name',''),120),created_at,email_confirmed_at is not null,banned_until,deleted_at from auth.users;

-- Preserve the exact validated legacy access convention. Do not promote any admin.
insert into public.pathfinder_entitlements(user_id,product_id,source,provider,external_reference)
select u.id,p.id,'legacy_import','legacy',u.id::text || ':' || (u.raw_app_meta_data->'pathfinder_access'->>'reference')
from auth.users u join public.pathfinder_products p on p.access_tier=u.raw_app_meta_data->'pathfinder_access'->>'tier'
where jsonb_typeof(u.raw_app_meta_data->'pathfinder_access'->'reference')='string';
insert into public.pathfinder_entitlement_audit(entitlement_id,action,note)
select id,'granted','Imported existing account access; granted_at is the migration time, not a payment date.' from public.pathfinder_entitlements;

create function pathfinder_private.grant_access(p_user uuid,p_product uuid,p_expires timestamptz,p_note text,p_request uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not pathfinder_private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_request is null or length(coalesce(p_note,''))>2000 or (p_expires is not null and (not isfinite(p_expires) or p_expires<=now())) then raise exception 'Invalid grant'; end if;
 if not exists(select 1 from public.pathfinder_products where id=p_product and active) then raise exception 'Product unavailable'; end if;
 if not exists(select 1 from auth.users where id=p_user and deleted_at is null and (banned_until is null or banned_until<=now())) then raise exception 'Account unavailable'; end if;
 -- Serialize grants per account/product; retries and double clicks cannot duplicate access.
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_product::text,0));
 select id into result from public.pathfinder_entitlements where request_id=p_request and user_id=p_user and product_id=p_product and granted_by=auth.uid();
 if result is not null then return result; end if;
 if exists(select 1 from public.pathfinder_entitlements where user_id=p_user and product_id=p_product and status='active' and (expires_at is null or expires_at>now())) then raise exception 'This account already has active access to this product'; end if;
 insert into public.pathfinder_entitlements(user_id,product_id,source,granted_by,expires_at,request_id)
 values(p_user,p_product,'admin_grant',auth.uid(),p_expires,p_request) returning id into result;
 insert into public.pathfinder_entitlement_audit(entitlement_id,actor_id,action,note) values(result,auth.uid(),'granted',nullif(btrim(p_note),''));
 return result;
end; $$;
create function pathfinder_private.revoke_access(p_entitlement uuid,p_user uuid,p_note text) returns void
language plpgsql security definer set search_path='' as $$
declare changed uuid;
begin
 if not pathfinder_private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if length(coalesce(p_note,''))>2000 then raise exception 'Note too long'; end if;
 if not exists(select 1 from public.pathfinder_entitlements where id=p_entitlement and user_id=p_user) then raise exception 'Entitlement not found'; end if;
 update public.pathfinder_entitlements set status='revoked',revoked_at=now(),revoked_by=auth.uid()
 where id=p_entitlement and user_id=p_user and status='active' returning id into changed;
 if changed is not null then
 insert into public.pathfinder_entitlement_audit(entitlement_id,actor_id,action,note) values(changed,auth.uid(),'revoked',nullif(btrim(p_note),''));
 end if;
end; $$;
revoke all on function pathfinder_private.grant_access(uuid,uuid,timestamptz,text,uuid),pathfinder_private.revoke_access(uuid,uuid,text) from public,anon;
grant execute on function pathfinder_private.grant_access(uuid,uuid,timestamptz,text,uuid),pathfinder_private.revoke_access(uuid,uuid,text) to authenticated;
create function public.pathfinder_grant_access(p_user uuid,p_product uuid,p_expires timestamptz,p_note text,p_request uuid) returns uuid
language sql security invoker set search_path='' as $$ select pathfinder_private.grant_access(p_user,p_product,p_expires,p_note,p_request); $$;
create function public.pathfinder_revoke_access(p_entitlement uuid,p_user uuid,p_note text) returns void
language sql security invoker set search_path='' as $$ select pathfinder_private.revoke_access(p_entitlement,p_user,p_note); $$;
revoke all on function public.pathfinder_grant_access(uuid,uuid,timestamptz,text,uuid),public.pathfinder_revoke_access(uuid,uuid,text) from public,anon;
grant execute on function public.pathfinder_grant_access(uuid,uuid,timestamptz,text,uuid),public.pathfinder_revoke_access(uuid,uuid,text) to authenticated;

-- Only the trusted server can call this, after verifying provider, amount and owner.
-- A repeated provider reference never reactivates a revoked entitlement.
create function public.pathfinder_record_payment(p_user uuid,p_slug text,p_provider text,p_reference text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare result uuid; product uuid;
begin
 if p_provider is null or length(p_provider) not between 1 and 80 or p_reference is null or length(p_reference) not between 1 and 200 then raise exception 'Invalid payment reference'; end if;
 select id into product from public.pathfinder_products where slug=p_slug and active;
 if product is null then raise exception 'Product unavailable'; end if;
 if exists(select 1 from public.pathfinder_entitlements where provider='legacy' and external_reference=p_user::text||':'||p_reference) then
   select id into result from public.pathfinder_entitlements where provider='legacy' and external_reference=p_user::text||':'||p_reference and user_id=p_user and product_id=product and status='active' and (expires_at is null or expires_at>now());
   if result is null then raise exception 'Payment reference unavailable'; end if;
   return result;
 end if;
 insert into public.pathfinder_entitlements(user_id,product_id,source,provider,external_reference)
 values(p_user,product,'payment',p_provider,p_reference) on conflict(provider,external_reference) do nothing returning id into result;
 if result is not null then
 insert into public.pathfinder_entitlement_audit(entitlement_id,action) values(result,'granted');
 else
 select id into result from public.pathfinder_entitlements where provider=p_provider and external_reference=p_reference and user_id=p_user and product_id=product and status='active' and (expires_at is null or expires_at>now());
 if result is null then raise exception 'Payment reference unavailable'; end if;
 end if;
 return result;
end; $$;
revoke all on function public.pathfinder_record_payment(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.pathfinder_record_payment(uuid,text,text,text) to service_role;

-- Security-invoker view preserves RLS on both directory and entitlement tables.
create view public.pathfinder_admin_users with(security_invoker=true) as
select d.*, coalesce((select case when bool_or(p.access_tier='full') then 'full' when bool_or(p.access_tier='start') then 'start' else 'free' end
 from public.pathfinder_entitlements e join public.pathfinder_products p on p.id=e.product_id
 where e.user_id=d.user_id and e.status='active' and (e.expires_at is null or e.expires_at>now())),'free') as access_tier
from public.pathfinder_directory d;
revoke all on public.pathfinder_admin_users from public,anon,authenticated;
grant select on public.pathfinder_admin_users to authenticated,service_role;
