"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { FormResult } from "@/lib/profile";
import { authenticate } from "./actions";

export default function AccountForm({ next = "/dashboard" }: { next?: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "recover" | "otp">("login");
  const [state, action, pending] = useActionState<FormResult, FormData>(authenticate, {});
  return <form action={action} className="profile-form">
    <input type="hidden" name="mode" value={mode} />
    <input type="hidden" name="next" value={next} />
    <h2>{mode === "login" ? "Welcome back." : mode === "recover" ? "Reset your password." : mode === "otp" ? "Use a one-time sign-in link." : "Create your Pathfinder account."}</h2>
    <p>{mode === "login" ? "Use your email and password to continue your saved career journey." : mode === "recover" ? "We’ll email a secure reset link to the address on your account." : mode === "otp" ? "We’ll email a short-lived sign-in link, so you do not need to enter a password on this device." : "Save career ideas, qualification routes and university comparisons in one private space."}</p>
    <p className="secure-site-note"><span aria-hidden="true" /> Current Pathfinder Site · private pilot</p>
    <label>Email<Input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    {mode !== "recover" && mode !== "otp" && <>
      <label>Password<Input name="password" type="password" minLength={mode === "signup" ? 12 : 1} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
      <p className="field-hint">{mode === "signup" ? "Use at least 12 characters and do not reuse a school or work password." : "Use your existing Pathfinder password."}</p>
    </>}
    {mode === "signup" && <>
      <p className="account-guidance"><strong>Already tried this email?</strong> Creating it again will not replace its password. Return to sign in and choose “Forgot your password?” instead.</p>
      <label className="check-label"><Checkbox name="adult" required /> I am 18 or older. Under-18 accounts are not available during the private pilot.</label>
      <label className="check-label"><Checkbox name="privacy" required /><span>I have read the <Link href="/privacy">privacy notice</Link> and agree to account and pathway data storage.</span></label>
    </>}
    <div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.message && <p className="form-success">{state.message}</p>}</div>
    <Button type="submit" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "recover" ? "Email reset link" : mode === "otp" ? "Email one-time sign-in link" : "Create account"}</Button>
    {mode === "login" && <button className="text-link" type="button" disabled={pending} onClick={() => setMode("recover")}>Forgot your password?</button>}
    {mode === "login" && <button className="text-link" type="button" disabled={pending} onClick={() => setMode("otp")}>Sign in with a one-time email link</button>}
    <button className="text-link" type="button" disabled={pending} onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "New here? Create an account" : "Return to sign in"}</button>
  </form>;
}
