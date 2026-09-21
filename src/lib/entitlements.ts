import type { Tier } from "./workspace-model";

export type Product = { id: string; name: string; slug: string; description: string; active: boolean; access_tier: Tier };
export type Entitlement = {
  id: string; user_id: string; product_id: string; source: string;
  granted_at: string; granted_by: string | null; expires_at: string | null;
  status: "active" | "revoked"; revoked_at: string | null; revoked_by: string | null;
  pathfinder_products: Product;
};
export const entitlementColumns = "id,user_id,product_id,source,granted_at,granted_by,expires_at,status,revoked_at,revoked_by,pathfinder_products(id,name,slug,description,active,access_tier)";
export function entitlementStatus(item: Pick<Entitlement, "status" | "expires_at">, now = Date.now()) {
  if (item.status === "revoked") return "revoked";
  return item.expires_at && new Date(item.expires_at).getTime() <= now ? "expired" : "active";
}
export function tierFromEntitlements(items: Entitlement[], now = Date.now()): Tier {
  const tiers = items.filter(item => entitlementStatus(item, now) === "active").map(item => item.pathfinder_products?.access_tier);
  return tiers.includes("full") ? "full" : tiers.includes("start") ? "start" : "free";
}
export const tierName = (tier: string) => tier === "full" ? "Trailblazer" : tier === "start" ? "Hatchling" : "Free";
export function accountStatus(user: { deleted_at: string | null; banned_until: string | null; email_confirmed: boolean }, now = Date.now()) {
  return user.deleted_at ? "Deleted" : user.banned_until && Date.parse(user.banned_until) > now ? "Suspended" : user.email_confirmed ? "Verified" : "Awaiting verification";
}
export const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(value)) : "—";
