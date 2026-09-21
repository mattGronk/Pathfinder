"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-server";
import type { FormResult } from "@/lib/profile";

const grantSchema = z.object({ user: z.string().uuid(), product: z.string().uuid(), request: z.string().uuid(), note: z.string().trim().max(2000), expires: z.string().datetime({ offset: true }).nullable() });
export async function grantAccess(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { client } = await requireAdmin();
  const parsed = grantSchema.safeParse({ user: form.get("user"), product: form.get("product"), request: form.get("request"), note: form.get("note") ?? "", expires: form.get("expires") || null });
  if (!parsed.success || form.get("confirmed") !== "yes") return { error: "Review the product and account, and confirm the grant." };
  const { user, product, request, note, expires } = parsed.data;
  if (expires && Date.parse(expires) <= Date.now()) return { error: "Choose an expiry in the future." };
  const { error } = await client.rpc("pathfinder_grant_access", { p_user: user, p_product: product, p_request: request, p_note: note, p_expires: expires });
  if (error) return { error: error.message.includes("already has active") ? "This account already has active access to that product." : "Access could not be granted. Check the account, product and expiry, then retry." };
  refresh(user);
  return { message: "Access granted. It is available on the user's next page load." };
}
export async function revokeAccess(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { client } = await requireAdmin();
  const parsed = z.object({ user: z.string().uuid(), entitlement: z.string().uuid(), note: z.string().trim().max(2000) }).safeParse({ user: form.get("user"), entitlement: form.get("entitlement"), note: form.get("note") ?? "" });
  if (!parsed.success || form.get("confirmed") !== "yes") return { error: "Confirm the entitlement you want to revoke." };
  const { user, entitlement, note } = parsed.data;
  const { error } = await client.rpc("pathfinder_revoke_access", { p_user: user, p_entitlement: entitlement, p_note: note });
  if (error) return { error: "Access could not be revoked. Please reload and try again." };
  refresh(user);
  return { message: "Entitlement revoked. Other active products remain available." };
}
function refresh(user: string) {
  for (const path of ["/admin", "/admin/users", `/admin/users/${user}`, "/admin/entitlements", "/account", "/dashboard", "/assessments", "/upgrade"]) revalidatePath(path);
}
