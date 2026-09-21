import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { entitlementColumns, type Entitlement, tierFromEntitlements } from "./entitlements";

export async function readEntitlements(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from("pathfinder_entitlements").select(entitlementColumns).eq("user_id", userId).order("granted_at", { ascending: false });
  // Fail closed: stale Auth metadata must never restore a revoked product.
  if (error) throw new Error("Your access could not be checked. Please try again shortly.");
  const entitlements = data as unknown as Entitlement[];
  return { entitlements, tier: tierFromEntitlements(entitlements) };
}
