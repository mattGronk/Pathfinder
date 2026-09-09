"use server";

import { revalidatePath } from "next/cache";
import { deleteAssessmentDraft, saveAssessmentDraft as persistAssessmentDraft } from "@/db/pathfinder";
import { draftSchema } from "@/lib/assessment";
import type { FormResult } from "@/lib/profile";
import { getPathfinderAccount } from "@/lib/supabase/server";

export async function saveAssessmentDraft(input: unknown): Promise<FormResult> {
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { error: "We could not validate these answers, so nothing was saved." };
  try {
    const account = await getPathfinderAccount();
    if (!account) return { error: "Please sign in with your Pathfinder password again before saving." };
    await persistAssessmentDraft(account.userId, parsed.data);
    revalidatePath("/");
    return { message: parsed.data.completed ? "Your results are saved privately." : "Your progress is saved privately." };
  } catch {
    return { error: "We could not save your progress. Keep this page open and try again." };
  }
}

export async function clearAssessmentDraft(): Promise<FormResult> {
  try {
    const account = await getPathfinderAccount();
    if (!account) return { error: "Please sign in with your Pathfinder password again." };
    await deleteAssessmentDraft(account.userId);
    revalidatePath("/");
    return { message: "Your saved assessment answers have been cleared." };
  } catch {
    return { error: "We could not clear your saved answers. Please try again." };
  }
}


