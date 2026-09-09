"use server";
import { revalidatePath } from "next/cache";
import { deleteCareerProfile, saveCareerProfile } from "@/db/pathfinder";
import { profileFromForm, type FormResult } from "@/lib/profile";
import { getPathfinderAccount } from "@/lib/supabase/server";

export async function saveProfile(_previous: FormResult, data: FormData): Promise<FormResult> {
  const parsed = profileFromForm(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  try {
    const account = await getPathfinderAccount();
    if (!account) return { error: "Please sign in with your Pathfinder password again before saving." };
    await saveCareerProfile(account.userId, parsed.data);
  } catch { return { error: "We could not save your profile. Your changes are still on this page; please try again." }; }
  revalidatePath("/");
  revalidatePath("/onboarding");
  return { message: "Your profile is saved. You can leave and return to it after signing in." };
}

export async function eraseProfile(_previous: FormResult, data: FormData): Promise<FormResult> {
  if (data.get("confirmErase") !== "on") return { error: "Confirm that you want to erase your saved career profile." };
  try {
    const account = await getPathfinderAccount();
    if (!account) return { error: "Please sign in with your Pathfinder password again." };
    await deleteCareerProfile(account.userId);
  } catch { return { error: "The profile service is unavailable. Please try again." }; }
  revalidatePath("/");
  revalidatePath("/onboarding");
  return { message: "Your saved career profile has been erased. Your password account is unchanged. Reload this page to clear the form." };
}


