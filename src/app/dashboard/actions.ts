"use server";
import { readWorkspace, updateOwnedMetadata } from "@/lib/workspace-server";
import { cvSchema } from "@/lib/workspace-model";
import { assessmentSuite } from "@/lib/assessment-suite";
import { z } from "zod";
import { revalidatePath } from "next/cache";
export async function saveSuiteResult(input: unknown) {
  const parsed = z.object({ id: z.string(), answers: z.array(z.string().max(40)).max(80) }).safeParse(input);
  const state = await readWorkspace();
  if (!state || state.tier === "free") return { error: "Sign in with a paid account to save your results." };
  if (!parsed.success) return { error: "Please complete every question." };
  const assessment = assessmentSuite.find(a => a.id === parsed.data.id);
  if (!assessment || (state.tier !== "full" && assessment.id !== "career")) return { error: "This assessment needs Trailblazer access." };
  const answers = parsed.data.answers;
  if (answers.length !== assessment.questions.length || answers.some((a, i) => !assessment.questions[i].options.some(o => o.signal === a))) return { error: "Please complete every question with a valid response." };
  const scores = Object.entries(assessment.signals).map(([key, label]) => ({ key, label, count: answers.filter(a => a === key).length })).sort((a,b) => b.count-a.count);
  const result = { id: assessment.id, answers, scores, total: answers.length, completedAt: new Date().toISOString() };
  try { await updateOwnedMetadata(state.user.id, { pathfinder_results: [...state.results.filter(r => r.id !== assessment.id), result] }); revalidatePath("/dashboard"); return { message: "Results saved. Your reports are ready in the dashboard." }; }
  catch { return { error: "Your result is shown here, but saving failed. Please try again." }; }
}
export async function saveCv(input: unknown) {
  const state = await readWorkspace();
  if (!state || state.tier === "free") return { error: "Sign in with a paid account to save a CV." };
  const parsed = cvSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await updateOwnedMetadata(state.user.id, { pathfinder_cv: parsed.data }); revalidatePath("/dashboard"); return { message: "CV saved to your account." }; }
  catch { return { error: "We could not save the CV. Your edits are still here; please retry." }; }
}
export async function saveTasks(input: unknown) {
  const state = await readWorkspace();
  if (!state || state.tier === "free") return { error: "Please sign in with a paid account." };
  const parsed = z.array(z.enum(["profile", "research", "conversation", "cv"])).max(4).safeParse(input);
  if (!parsed.success) return { error: "Invalid checklist." };
  try { await updateOwnedMetadata(state.user.id, { pathfinder_tasks: [...new Set(parsed.data)] }); return { message: "Checklist saved." }; }
  catch { return { error: "Checklist could not be saved. Try again." }; }
}
