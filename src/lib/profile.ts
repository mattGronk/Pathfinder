import { z } from "zod";

export const provinces = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape", "Prefer not to say"] as const;
const note = z.string().trim().max(500);
const common = {
  displayName: z.string().trim().min(1, "Please enter a name.").max(60),
  province: z.enum(provinces),
  mobility: z.enum(["local", "relocate", "remote", "unsure"]),
  goal: z.string().trim().min(5, "Tell us a little more about your goal.").max(500),
  consent: z.literal(true),
};

export const profileSchema = z.discriminatedUnion("lifeStage", [
  z.object({ ...common, lifeStage: z.literal("school"), grade: z.enum(["7", "8", "9", "10", "11", "12"]), subjects: z.string().trim().min(2).max(500), marks: note }),
  z.object({ ...common, lifeStage: z.literal("student"), institution: z.string().trim().min(2).max(120), qualification: z.string().trim().min(2).max(120), year: z.string().trim().min(1).max(40), experience: note }),
  z.object({ ...common, lifeStage: z.literal("working"), role: z.string().trim().min(2).max(120), yearsExperience: z.number().int().min(0).max(70), enjoy: note, change: note }),
]);

export type CareerProfile = z.infer<typeof profileSchema>;
export type FormResult = { error?: string; message?: string };

export function profileFromForm(data: FormData) {
  const values = Object.fromEntries(data.entries());
  return profileSchema.safeParse({
    ...values,
    consent: data.get("consent") === "on",
    yearsExperience: data.get("yearsExperience") === "" ? undefined : Number(data.get("yearsExperience")),
  });
}

