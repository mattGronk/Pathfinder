"use server";

import { redirect } from "next/navigation";
import { accountInput, passwordUpdateInput } from "@/lib/account-input";
import { accountConfiguration, createAccountClient, getPathfinderAccount } from "@/lib/supabase/server";
import type { FormResult } from "@/lib/profile";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import {safeReturnTo} from "@/lib/safe-return";
import {recoveryCallbackUrl} from "@/lib/auth-redirect";

function safeNext(value: FormDataEntryValue | null) {
  return safeReturnTo(value);
}

export async function authenticate(_previous: FormResult, data: FormData): Promise<FormResult> {
  const parsed = accountInput.safeParse(Object.fromEntries(data.entries()));
  if (!parsed.success) {
    const mode = data.get("mode");
    return { error: mode === "signup"
      ? "Use a valid email, a password of 12–128 characters, and confirm the adult pilot and privacy notice."
      : mode === "recover" ? "Enter the email address used for your Pathfinder account."
      : mode === "otp" ? "Enter a valid email address for your one-time sign-in link."
      : "Enter your valid email and existing password." };
  }
  const config = accountConfiguration();
  if (!config) return { error: "Password accounts are temporarily unavailable." };
  const next = safeNext(data.get("next"));
  const limit = await checkAuthRateLimit(parsed.data.email, parsed.data.mode);
  if (!limit.allowed) return { error: `Too many attempts. Please wait ${limit.retryMinutes} minutes before trying again.` };
  try {
    const client = await createAccountClient();
    if (!client) return { error: "Password accounts are temporarily unavailable." };
    if (parsed.data.mode === "otp") {
      const { error } = await client.auth.signInWithOtp({ email: parsed.data.email, options: { emailRedirectTo: `${config.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error) return { error: "We could not send the secure sign-in code. Please wait and try again." };
      return { message: "If the address can sign in, a secure one-time sign-in email is on its way. The link expires automatically." };
    } else if (parsed.data.mode === "recover") {
      const {error} = await client.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: recoveryCallbackUrl(config.origin),
      });
      if(error)return {error:"We could not send a reset email right now. Please wait a few minutes and try again."};
      return { message: "If this email belongs to a Pathfinder account, a password-reset link is on its way. Check your inbox and spam folder." };
    } else if (parsed.data.mode === "signup") {
      const { data: result, error } = await client.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: `${config.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) return { error: "We could not create the account. Try again later, or sign in if you already have one." };
      if (!result.session) return { message: "If this email is new, check your inbox to confirm it. If you already had an account, its password has not changed—sign in or use ‘Forgot your password?’" };
    } else {
      const { error } = await client.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
      if (error) return { error: "Sign-in failed. Check your details or reset your password. Creating the account again will not replace an existing password." };
    }
  } catch {
    return { error: "The account service is unavailable. Please try again later." };
  }
  redirect(next);
}

export async function updatePassword(_previous: FormResult, data: FormData): Promise<FormResult> {
  const parsed = passwordUpdateInput.safeParse(Object.fromEntries(data.entries()));
  if (!parsed.success) return { error: "Use 12–128 characters and enter the same new password twice." };
  const account = await getPathfinderAccount();
  if (!account) return { error: "This reset link is invalid or has expired. Request a new password-reset email." };
  try {
    const client = await createAccountClient();
    if (!client) return { error: "Password accounts are temporarily unavailable." };
    const { error } = await client.auth.updateUser({ password: parsed.data.password });
    if (error) return { error: "We could not update your password. Request a new reset link and try again." };
    await client.auth.signOut({ scope: "global" });
    return { message: "Your password has been updated. You can now return to sign in." };
  } catch {
    return { error: "The account service is unavailable. Please try again later." };
  }
}

export async function signOut(): Promise<void> {
  try {
    const client = await createAccountClient();
    if (client) await client.auth.signOut({ scope: "local" });
  } catch {
    redirect("/account?error=signout");
  }
  redirect("/account");
}
