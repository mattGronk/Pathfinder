import Link from "next/link";
import { accountConfiguration, getPathfinderAccount } from "@/lib/supabase/server";
import AccountForm from "./account-form";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; message?: string }> }) {
  const { error, next, message } = await searchParams;
  const account = await getPathfinderAccount();
  return <main className="profile-page">
    <Link className="back-link" href="/">← Pathfinder SA</Link>
    <p className="eyebrow">YOUR PRIVATE PATHWAY SPACE</p>
    <h1>{account ? "Your path is saved." : "A path you can return to."}</h1>
    <p>Use a normal email and password to keep your career ideas, degree routes and university research together.</p>
    {error && <p role="alert" className="form-error">{error === "signout" ? "We could not sign you out. Please try again." : error==="recovery" ? "This password reset link has expired or was already used. Request a fresh reset email below and open the newest link." : "That email confirmation link could not be verified. Try signing in or request another confirmation."}</p>}
    {message === "password-updated" && <p className="form-success">Your password has been updated. Sign in with the new password.</p>}
    {account ? <section className="profile-form">
      <h2>Signed in</h2>
      <p><strong>{account.email}</strong></p>
      <p>Your profile and assessment answers are stored separately for this verified Pathfinder account.</p>
      <Link className="profile-link" href="/onboarding">Review my profile →</Link>
      <Link className="profile-link" href="/dashboard">Open my dashboard, reports and CV studio →</Link>
      <Link className="profile-link" href="/assessments">Continue my assessments →</Link>
      <form action={signOut}><button className="text-link" type="submit">Sign out</button></form>
    </section> : accountConfiguration() ? <AccountForm next={next} /> : <section className="profile-form"><h2>Accounts are temporarily unavailable.</h2><p>Please return later. No password has been collected.</p></section>}
  </main>;
}
