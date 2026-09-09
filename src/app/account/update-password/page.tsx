import Link from "next/link";
import { getPathfinderAccount } from "@/lib/supabase/server";
import PasswordForm from "./password-form";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const account = await getPathfinderAccount();
  return <main className="profile-page">
    <Link className="back-link" href="/account">← Account</Link>
    <p className="eyebrow">SECURE ACCOUNT RECOVERY</p>
    <h1>Set a new password.</h1>
    <p>The reset link must be opened in this browser before you can choose a new password.</p>
    {account ? <PasswordForm /> : <section className="profile-form">
      <h2>This reset link is invalid or has expired.</h2>
      <p>Return to sign in and request a new password-reset email.</p>
      <Link className="profile-link" href="/account">Request another link →</Link>
    </section>}
  </main>;
}


