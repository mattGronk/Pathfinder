import { parseAssessmentDraft, type AssessmentDraft } from "@/lib/assessment";
import { profileSchema, type CareerProfile } from "@/lib/profile";
import { ownedMetadata, updateOwnedMetadata } from "@/lib/workspace-server";
export async function loadCareerProfile(userId: string): Promise<CareerProfile | null> { const { metadata } = await ownedMetadata(userId); return metadata.pathfinder_profile ? profileSchema.parse(metadata.pathfinder_profile) : null; }
export async function saveCareerProfile(userId: string, profile: CareerProfile) { await updateOwnedMetadata(userId, { pathfinder_profile: profileSchema.parse(profile) }); }
export async function deleteCareerProfile(userId: string) { await updateOwnedMetadata(userId, { pathfinder_profile: null }); }
export async function loadAssessmentDraft(userId: string): Promise<AssessmentDraft | null> { const { metadata } = await ownedMetadata(userId); return metadata.pathfinder_draft ? parseAssessmentDraft(metadata.pathfinder_draft) : null; }
export async function saveAssessmentDraft(userId: string, draft: AssessmentDraft) { await updateOwnedMetadata(userId, { pathfinder_draft: parseAssessmentDraft(draft) }); }
export async function deleteAssessmentDraft(userId: string) { await updateOwnedMetadata(userId, { pathfinder_draft: null, pathfinder_results: null }); }
