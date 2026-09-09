import PathfinderApp from "./pathfinder-client";
import { loadAssessmentDraft, loadCareerProfile } from "@/db/pathfinder";
import type { CareerProfile } from "@/lib/profile";
import { getPathfinderAccount } from "@/lib/supabase/server";
import { readWorkspace } from "@/lib/workspace-server";
import { careerCatalogue, universityCatalogue } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function Home() {
  const access = await readWorkspace();
  const account = await getPathfinderAccount();
  let profile: CareerProfile | null = null;
  let assessmentProgress: { answered: number; completed: boolean } | null = null;
  try {
    if (account) {
      const [savedProfile, savedAssessment] = await Promise.all([
        loadCareerProfile(account.userId),
        loadAssessmentDraft(account.userId),
      ]);
      profile = savedProfile;
      if (savedAssessment) {
        assessmentProgress = {
          answered: Object.keys(savedAssessment.answers).length + Number(!!savedAssessment.priority) + Number(!!savedAssessment.access) + Number(!!savedAssessment.funding),
          completed: savedAssessment.completed,
        };
      }
    }
  } catch { /* Keep the assessment available during a temporary storage outage. */ }
  return <PathfinderApp
    firstName={profile?.displayName ?? account?.email.split("@")[0] ?? "there"}
    initialLifeStage={profile?.lifeStage ?? "school"}
    profileSaved={!!profile}
    assessmentProgress={assessmentProgress}
    signedIn={!!account}
    premium={access?.tier === "full"}
    careers={access?.tier === "full" ? careerCatalogue : careerCatalogue.slice(0,6).map(c=>({...c,qualifications:[],skills:[],employers:[],day:"",outlook:""}))}
    universities={access?.tier === "full" ? universityCatalogue : universityCatalogue.slice(0,4)}
  />;
}
