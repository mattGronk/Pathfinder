import type { Tier, SavedResult } from "./workspace-model";

export function canTakeAssessment(tier: Tier, id: string) {
  return tier === "full" || (tier === "start" && ["career", "subjects"].includes(id));
}

export function subjectChoiceOptional(profile?: { lifeStage?: string; grade?: string } | null) {
  return !!profile && (profile.lifeStage !== "school" || Number(profile.grade) >= 10);
}

export function assessmentProgress(assessments: { id: string }[], results: SavedResult[], tier: Tier, optionalSubjects: boolean) {
  const recommended = assessments.filter(a => canTakeAssessment(tier, a.id) && !(a.id === "subjects" && optionalSubjects));
  return { total: recommended.length, completed: recommended.filter(a => results.some(r => r.id === a.id)).length };
}
