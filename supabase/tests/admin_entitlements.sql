-- Run as postgres against the migrated database. Everything is rolled back.
begin;
select set_config('test.admin',gen_random_uuid()::text,true), set_config('test.member',gen_random_uuid()::text,true), set_config('test.other',gen_random_uuid()::text,true), set_config('test.request',gen_random_uuid()::text,true);
insert into auth.users(id,email,created_at,raw_app_meta_data,raw_user_meta_data)
select current_setting(k)::uuid,'pathfinder-test-'||current_setting(k)||'@example.invalid',now(),'{}','{}'
from unnest(array['test.admin','test.member','test.other']) k;
insert into public.pathfinder_admins(user_id) values(current_setting('test.admin')::uuid);

set local role anon;
do $$ begin
 begin perform * from public.pathfinder_entitlements; raise exception 'FAIL anonymous read'; exception when insufficient_privilege then null; end;
 begin perform public.pathfinder_is_admin(); raise exception 'FAIL anonymous role RPC'; exception when insufficient_privilege then null; end;
 begin perform public.pathfinder_grant_access(null,null,null,null,null); raise exception 'FAIL anonymous grant'; exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.member'),'role','authenticated','user_metadata',json_build_object('is_admin',true))::text,true);
set local role authenticated;
do $$ begin
 if public.pathfinder_is_admin() then raise exception 'FAIL editable metadata role escalation'; end if;
 if exists(select 1 from public.pathfinder_directory) then raise exception 'FAIL directory exposed'; end if;
 if exists(select 1 from public.pathfinder_admin_users) then raise exception 'FAIL directory view exposed'; end if;
 if exists(select 1 from public.pathfinder_entitlement_audit) then raise exception 'FAIL internal notes exposed'; end if;
 begin insert into public.pathfinder_admins(user_id) values(auth.uid()); raise exception 'FAIL role escalation'; exception when insufficient_privilege then null; end;
 begin insert into public.pathfinder_entitlements(user_id,product_id,source) select auth.uid(),id,'admin_grant' from public.pathfinder_products limit 1; raise exception 'FAIL self-grant'; exception when insufficient_privilege then null; end;
 begin update public.pathfinder_products set access_tier='full'; raise exception 'FAIL product tampering'; exception when insufficient_privilege then null; end;
 begin delete from public.pathfinder_entitlements; raise exception 'FAIL history deletion'; exception when insufficient_privilege then null; end;
 begin perform public.pathfinder_grant_access(auth.uid(),null,null,null,gen_random_uuid()); raise exception 'FAIL unauthorized RPC'; exception when insufficient_privilege then null; end;
 begin perform public.pathfinder_revoke_access(null,auth.uid(),null); raise exception 'FAIL unauthorized revoke'; exception when insufficient_privilege then null; end;
 begin perform public.pathfinder_record_payment(auth.uid(),'trailblazer','fake','fake'); raise exception 'FAIL client payment RPC'; exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare grant_id uuid; again uuid; product uuid; begin
 if not public.pathfinder_is_admin() then raise exception 'FAIL admin authorization'; end if;
 if (select count(*) from public.pathfinder_directory where user_id in (current_setting('test.member')::uuid,current_setting('test.other')::uuid))<>2 then raise exception 'FAIL admin user list'; end if;
 select id into product from public.pathfinder_products where slug='trailblazer';
 grant_id:=public.pathfinder_grant_access(current_setting('test.member')::uuid,product,null,'Internal test note',current_setting('test.request')::uuid);
 again:=public.pathfinder_grant_access(current_setting('test.member')::uuid,product,null,'Retry',current_setting('test.request')::uuid);
 if grant_id<>again then raise exception 'FAIL idempotency'; end if;
 if (select count(*) from public.pathfinder_entitlement_audit where entitlement_id=grant_id)<>1 then raise exception 'FAIL audit atomicity'; end if;
 if (select granted_by from public.pathfinder_entitlements where id=grant_id)<>auth.uid() then raise exception 'FAIL actor attribution'; end if;
 if (select access_tier from public.pathfinder_admin_users where user_id=current_setting('test.member')::uuid)<>'full' then raise exception 'FAIL effective tier'; end if;
 begin perform public.pathfinder_grant_access(current_setting('test.member')::uuid,product,null,null,gen_random_uuid()); raise exception 'FAIL duplicate'; exception when raise_exception then if sqlerrm='FAIL duplicate' then raise; end if; end;
 begin perform public.pathfinder_grant_access(current_setting('test.other')::uuid,product,now()-interval '1 day',null,gen_random_uuid()); raise exception 'FAIL past expiry'; exception when raise_exception then if sqlerrm='FAIL past expiry' then raise; end if; end;
 perform set_config('test.entitlement',grant_id::text,true);
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.member'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.pathfinder_entitlements where id=current_setting('test.entitlement')::uuid) then raise exception 'FAIL own entitlement missing'; end if;
 if exists(select 1 from public.pathfinder_entitlements where user_id<>auth.uid()) then raise exception 'FAIL cross-account entitlement access'; end if;
 if exists(select 1 from public.pathfinder_entitlement_audit) then raise exception 'FAIL private audit visible'; end if;
 begin update public.pathfinder_entitlements set expires_at=null; raise exception 'FAIL expiry tampering'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin if exists(select 1 from public.pathfinder_entitlements where id=current_setting('test.entitlement')::uuid) then raise exception 'FAIL other account read'; end if; end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare e uuid:=current_setting('test.entitlement')::uuid; begin
 begin perform public.pathfinder_revoke_access(e,current_setting('test.other')::uuid,'Wrong account'); raise exception 'FAIL wrong account revoke'; exception when raise_exception then if sqlerrm='FAIL wrong account revoke' then raise; end if; end;
 perform public.pathfinder_revoke_access(e,current_setting('test.member')::uuid,'Test revocation');
 perform public.pathfinder_revoke_access(e,current_setting('test.member')::uuid,'Retry');
 if (select count(*) from public.pathfinder_entitlement_audit where entitlement_id=e)<>2 then raise exception 'FAIL revoke audit'; end if;
 if (select revoked_by from public.pathfinder_entitlements where id=e)<>auth.uid() then raise exception 'FAIL revoke actor'; end if;
 if (select access_tier from public.pathfinder_admin_users where user_id=current_setting('test.member')::uuid)<>'free' then raise exception 'FAIL revoke did not remove access'; end if;
end $$;
reset role;

-- Expiry evaluated by the database clock, without changing audit history.
insert into public.pathfinder_entitlements(user_id,product_id,source,granted_at,expires_at)
select current_setting('test.other')::uuid,id,'promotion',now()-interval '2 days',now()-interval '1 day' from public.pathfinder_products where slug='trailblazer';
do $$ begin if (select access_tier from public.pathfinder_admin_users where user_id=current_setting('test.other')::uuid)<>'free' then raise exception 'FAIL expired access'; end if; end $$;

-- Removing a role immediately invalidates authorization, even with old claims.
delete from public.pathfinder_admins where user_id=current_setting('test.admin')::uuid;
set local role authenticated;
do $$ begin
 if public.pathfinder_is_admin() then raise exception 'FAIL stale admin role'; end if;
 begin perform public.pathfinder_grant_access(null,null,null,null,gen_random_uuid()); raise exception 'FAIL removed admin grant'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role service_role;
do $$ declare first_id uuid; again uuid; ref text:=current_setting('test.request'); begin
 first_id:=public.pathfinder_record_payment(current_setting('test.member')::uuid,'hatchling','test-provider',ref);
 again:=public.pathfinder_record_payment(current_setting('test.member')::uuid,'hatchling','test-provider',ref);
 if first_id<>again then raise exception 'FAIL payment idempotency'; end if;
 begin perform public.pathfinder_record_payment(current_setting('test.other')::uuid,'hatchling','test-provider',ref); raise exception 'FAIL receipt theft'; exception when raise_exception then if sqlerrm='FAIL receipt theft' then raise; end if; end;
 update public.pathfinder_entitlements set status='revoked',revoked_at=now() where id=first_id;
 begin perform public.pathfinder_record_payment(current_setting('test.member')::uuid,'hatchling','test-provider',ref); raise exception 'FAIL replay restored revoked purchase'; exception when raise_exception then if sqlerrm='FAIL replay restored revoked purchase' then raise; end if; end;
end $$;
reset role;
rollback;
select 'PASS: anonymous, member, admin, removed-admin, expiry, audit and payment replay checks; all fixtures rolled back' as result;
