import Link from "next/link";
import { loadCareerProfile } from "@/db/pathfinder";
import type { CareerProfile } from "@/lib/profile";
import { requirePathfinderAccount } from "@/lib/supabase/server";
import { Reggie } from "@/components/reggie";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";
export default async function OnboardingPage() {
  const account = await requirePathfinderAccount("/onboarding");
  let profile: CareerProfile | null = null;
  let problem = "";
  try { profile = await loadCareerProfile(account.userId); }
  catch { problem = "We could not load your saved profile. Please retry before editing so you do not overwrite earlier details."; }
  return <main className="profile-page"><div className="profile-page-nav"><Link href="/">← Pathfinder SA</Link><Link href="/account" className="text-link">Account</Link></div><div className="onboarding-intro"><div><p className="eyebrow">START WITH WHAT MATTERS</p><h1>{profile ? "Your starting point can change." : "Your path starts with you."}</h1><p>A few practical details help us connect work interests to qualifications and university choices.</p></div><Reggie message="I’ll keep this simple. Choose what feels true today—you can update it later." size={210}/></div>
    {problem ? <section className="profile-form"><p className="form-error" role="alert">{problem}</p><Link href="/onboarding">Try again</Link></section> : <ProfileForm profile={profile} enabled />}
  </main>;
}

