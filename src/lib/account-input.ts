import { z } from "zod";

const email = z.string().trim().email().max(254);

export const accountInput = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("login"), email, password: z.string().min(1).max(128) }),
  z.object({ mode: z.literal("recover"), email }),
  z.object({ mode: z.literal("otp"), email }),
  z.object({
    mode: z.literal("signup"),
    email,
    password: z.string().min(12).max(128),
    adult: z.literal("on"),
    accountFor: z.enum(["self","learner"]),
    guardianName: z.string().trim().max(100).optional(),
    guardianRelationship: z.enum(["parent","guardian"]).optional(),
    guardianConsent: z.literal("on").optional(),
    privacy: z.literal("on"),
  }),
 ]).superRefine((input,ctx)=>{
  if(input.mode==="signup"&&input.accountFor==="learner"&&(!input.guardianName||input.guardianName.length<2||!input.guardianRelationship||input.guardianConsent!=="on")) ctx.addIssue({code:z.ZodIssueCode.custom,message:"A parent or legal guardian must complete the learner consent section.",path:["guardianConsent"]});
});

export const passwordUpdateInput = z.object({
  password: z.string().min(12).max(128),
  confirmation: z.string().min(12).max(128),
}).refine(({ password, confirmation }) => password === confirmation, {
  message: "Passwords do not match.",
  path: ["confirmation"],
});

