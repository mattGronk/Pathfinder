import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { createAccountClient } from "./supabase/server";
import { loadPrivateRecords } from "./workspace-storage";
import { createServiceClient } from "./supabase/service";
import { entitlementColumns, type Entitlement, type Product } from "./entitlements";

export type AdminUser = { user_id: string; email: string | null; display_name: string; joined_at: string; email_confirmed: boolean; banned_until: string | null; deleted_at: string | null; access_tier: string };
export type AuditEvent = { id: string; entitlement_id: string; actor_id: string | null; action: string; occurred_at: string; note: string | null };
// React cache is scoped to one render/request; no cross-user authorization cache.
export const requireAdmin = cache(async () => {
  const client = await createAccountClient();
  if (!client) redirect("/account?next=/admin");
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/account?next=/admin");
  const role = await client.rpc("pathfinder_is_admin");
  if (role.error) throw new Error("Administrator access could not be verified. Please try again.");
  if (role.data !== true) redirect("/account");
  return { client, userId: data.user.id };
});
export function checked<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error || data === null) throw new Error("Account information could not be loaded. Please try again.");
  return data;
}
export function pageNumber(value?: string) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1; }
// Existing profile names are encrypted in Storage, so SQL cannot backfill them.
// Index a bounded batch under verified admin authorization; onboarding keeps it current.
const indexExistingNames = cache(async () => {
  const { client } = await requireAdmin();
  const pending = checked(await client.from("pathfinder_directory").select("user_id").is("name_indexed_at", null).limit(100));
  for (let offset = 0; offset < pending.length; offset += 5) {
    await Promise.all(pending.slice(offset, offset + 5).map(async ({ user_id }) => {
      const records = await loadPrivateRecords(user_id, ["pathfinder_profile"]);
      const name = z.object({ displayName: z.string().max(120) }).safeParse(records.pathfinder_profile);
      const values = { name_indexed_at: new Date().toISOString(), ...(name.success ? { display_name: name.data.displayName } : {}) };
      const { error } = await createServiceClient().from("pathfinder_directory").update(values).eq("user_id", user_id);
      if (error) throw new Error("Account names could not be indexed.");
    }));
  }
});
export async function adminUsers(search = "", page = 1) {
  const { client } = await requireAdmin();
  await indexExistingNames();
  let query = client.from("pathfinder_admin_users").select("*", { count: "exact" }).order("joined_at", { ascending: false }).order("user_id");
  // Escape PostgREST syntax; punctuation is not allowed to become a query operator.
  const term = search.replace(/[^\p{L}\p{N}@ ._+\-]/gu, "").replace(/[_%]/g, " ").trim().slice(0, 100);
  if (term) query = query.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
  const result = await query.range((page - 1) * 25, page * 25 - 1);
  return { users: checked(result) as AdminUser[], total: result.count ?? 0 };
}
export async function adminOverview() {
  const { client } = await requireAdmin();
  await indexExistingNames();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [total, recent, paid, users, grants] = await Promise.all([
    client.from("pathfinder_directory").select("user_id", { count: "exact", head: true }),
    client.from("pathfinder_directory").select("user_id", { count: "exact", head: true }).gte("joined_at", since),
    client.from("pathfinder_admin_users").select("user_id", { count: "exact", head: true }).neq("access_tier", "free"),
    client.from("pathfinder_admin_users").select("*").order("joined_at", { ascending: false }).limit(5),
    client.from("pathfinder_entitlements").select(entitlementColumns).eq("source", "admin_grant").order("granted_at", { ascending: false }).limit(5),
  ]);
  if ([total, recent, paid].some(r => r.error)) throw new Error("Overview could not be loaded.");
  return { total: total.count ?? 0, recent: recent.count ?? 0, paid: paid.count ?? 0, users: checked(users) as AdminUser[], grants: checked(grants) as unknown as Entitlement[] };
}
export async function adminUserDetail(id: string) {
  const { client } = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) notFound();
  const userResult = await client.from("pathfinder_admin_users").select("*").eq("user_id", id).maybeSingle();
  if (userResult.error) throw new Error("Account could not be loaded.");
  if (!userResult.data) notFound();
  const [records, entitlements, products, legacyProfile, legacyStudent] = await Promise.all([
    loadPrivateRecords(id, ["pathfinder_profile", "pathfinder_draft", "pathfinder_results", "pathfinder_tasks"]),
    client.from("pathfinder_entitlements").select(entitlementColumns).eq("user_id", id).order("granted_at", { ascending: false }),
    client.from("pathfinder_products").select("*").eq("active", true).order("name"),
    createServiceClient().from("pathfinder_profiles").select("profile,updated_at").eq("user_id", id).maybeSingle(),
    createServiceClient().from("student_profiles").select("onboarding,assessment,completed_at").eq("user_id", id).maybeSingle(),
  ]);
  if (legacyProfile.error || legacyStudent.error) throw new Error("Saved profile could not be loaded.");
  const items = checked(entitlements) as unknown as Entitlement[];
  const audit = items.length ? checked(await client.from("pathfinder_entitlement_audit").select("id,entitlement_id,actor_id,action,occurred_at,note").in("entitlement_id", items.map(e => e.id)).order("occurred_at", { ascending: false })) as AuditEvent[] : [];
  return { user: userResult.data as AdminUser, records, entitlements: items, products: checked(products) as Product[], audit, legacyProfile: legacyProfile.data, legacyStudent: legacyStudent.data };
}
export async function adminEntitlements(page = 1) {
  const { client } = await requireAdmin();
  const result = await client.from("pathfinder_entitlements").select(entitlementColumns, { count: "exact" }).order("granted_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
  return { items: checked(result) as unknown as Entitlement[], total: result.count ?? 0 };
}
