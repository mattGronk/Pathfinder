import "server-only";
import { createAccountClient } from "@/lib/supabase/server";
import { cvSchema, emptyCv, type SavedResult } from "./workspace-model";
import { readEntitlements } from "./entitlements-server";
import { createServiceClient } from "./supabase/service";
import { redirect } from "next/navigation";
import {z} from "zod";
import {loadPrivateRecords,savePrivateRecords} from "./workspace-storage";
const resultSchema=z.object({id:z.enum(["career","subjects","leadership","personality","learning","eq","values","enterprise","study","decisions"]),completedAt:z.string().datetime(),answers:z.array(z.string().max(40)).max(80),scores:z.array(z.object({key:z.string().max(40),label:z.string().max(80),count:z.number().int().min(0).max(80)})).max(12),total:z.number().int().min(1).max(80)});
export async function readWorkspace() {
  const client = await createAccountClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email) return null;
  const user = data.user;
  const [records, access] = await Promise.all([loadPrivateRecords(user.id), readEntitlements(client, user.id)]);
  const cv = cvSchema.safeParse(records.pathfinder_cv);
  return { client, user, tier: access.tier, entitlements: access.entitlements, cv: cv.success ? cv.data : emptyCv,
    profile:records.pathfinder_profile,
    results: z.array(resultSchema).max(10).safeParse(records.pathfinder_results).data??[] as SavedResult[],
    tasks: z.array(z.enum(["profile","research","conversation","cv"])).max(4).safeParse(records.pathfinder_tasks).data??[] };
}
export async function requirePaidWorkspace() {
  const state = await readWorkspace();
  if (!state) redirect("/account?next=/dashboard");
  if (state.tier === "free") redirect("/upgrade");
  return state;
}
export async function ownedMetadata(userId: string) {
  const client = await createAccountClient();
  if (!client) throw new Error("Please sign in again.");
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== userId) throw new Error("Please sign in again.");
  return { client, metadata: await loadPrivateRecords(userId) };
}
export async function updateOwnedMetadata(userId: string, values: Record<string, unknown>) {
  const client=await createAccountClient();const result=await client?.auth.getUser();
  if(!result||result.error||result.data.user?.id!==userId)throw new Error("Please sign in again.");
  await savePrivateRecords(userId,values);
  if ("pathfinder_profile" in values) {
    const profile = values.pathfinder_profile as { displayName?: string } | null;
    const { error } = await createServiceClient().from("pathfinder_directory").update({ display_name: profile?.displayName ?? "", name_indexed_at: new Date().toISOString() }).eq("user_id", userId);
    if (error) throw new Error("Your profile was saved, but the account name could not be updated. Please save again.");
  }
}
