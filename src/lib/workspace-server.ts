import "server-only";
import { createAccountClient } from "@/lib/supabase/server";
import { tierFromMetadata, cvSchema, emptyCv, type SavedResult } from "./workspace-model";
import { redirect } from "next/navigation";
import {z} from "zod";
import {loadPrivateRecords,savePrivateRecords} from "./workspace-storage";
const resultSchema=z.object({id:z.enum(["career","subjects","leadership","personality","learning","eq"]),completedAt:z.string().datetime(),answers:z.array(z.string().max(40)).max(80),scores:z.array(z.object({key:z.string().max(40),label:z.string().max(80),count:z.number().int().min(0).max(80)})).max(12),total:z.number().int().min(1).max(80)});
export async function readWorkspace() {
  const client = await createAccountClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email) return null;
  const user = data.user;
  const records=await loadPrivateRecords(user.id);
  const cv = cvSchema.safeParse(records.pathfinder_cv);
  return { client, user, tier: tierFromMetadata(user.app_metadata), cv: cv.success ? cv.data : emptyCv,
    profile:records.pathfinder_profile,
    results: z.array(resultSchema).max(6).safeParse(records.pathfinder_results).data??[] as SavedResult[],
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
}
