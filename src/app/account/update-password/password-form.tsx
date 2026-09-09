"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormResult } from "@/lib/profile";
import { updatePassword } from "../actions";

export default function PasswordForm() {
  const [state, action, pending] = useActionState<FormResult, FormData>(updatePassword, {});
  return <form action={action} className="profile-form">
    <h2>Choose a new password.</h2>
    <p>Use a new password you have not used for school, work or another website.</p>
    <label>New password<Input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
    <label>Confirm new password<Input name="confirmation" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
    <p className="field-hint">Use 12–128 characters.</p>
    <div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.message && <p className="form-success">{state.message}</p>}</div>
    {state.message ? <Link className="profile-link" href="/account?message=password-updated">Return to sign in →</Link> : <Button type="submit" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button>}
  </form>;
}


