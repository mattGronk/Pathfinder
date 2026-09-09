import { z } from "zod";
export type Tier = "free" | "start" | "full";
export type SavedResult = { id: string; completedAt: string; answers: string[]; scores: { key: string; label: string; count: number }[]; total: number };
export const cvSchema = z.object({
  template: z.enum(["classic", "modern", "graduate"]),
  name: z.string().trim().max(100), title: z.string().trim().max(120),
  email: z.string().trim().max(120).refine(v => !v || z.string().email().safeParse(v).success, "Enter a valid email."),
  phone: z.string().trim().max(40), location: z.string().trim().max(120),
  summary: z.string().trim().max(1200), education: z.string().trim().max(1800),
  experience: z.string().trim().max(2400), skills: z.string().trim().max(1000), achievements: z.string().trim().max(1600),
});
export type CvData = z.infer<typeof cvSchema>;
export const emptyCv: CvData = { template: "classic", name: "", title: "", email: "", phone: "", location: "", summary: "", education: "", experience: "", skills: "", achievements: "" };
export function tierFromMetadata(metadata: Record<string, unknown> | undefined): Tier {
  const claim = metadata?.pathfinder_access as {tier?: unknown; reference?: unknown} | undefined;
  return claim && typeof claim.reference === "string" && (claim.tier === "start" || claim.tier === "full") ? claim.tier : "free";
}
export function verifiedPaymentTier(payment: {status?:string;domain?:string;currency?:string;amount?:number;customer?:{email?:string};metadata?:{pathfinder_tier?:string}}, email: string): Tier {
  if (payment.status !== "success" || payment.domain !== "live" || payment.currency !== "ZAR" || payment.customer?.email?.toLowerCase() !== email.toLowerCase()) return "free";
  if (payment.amount === 69900 && payment.metadata?.pathfinder_tier === "full") return "full";
  if (payment.amount === 24900 && payment.metadata?.pathfinder_tier === "start") return "start";
  return "free";
}
