import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const PREMIUM_COOKIE = "pathfinder_access";
type AccessClaim = { tier: "start" | "full"; reference: string; paidAt: number };

function secret() { return process.env.PAYWALL_COOKIE_SECRET ?? ""; }
export function signAccess(claim: AccessClaim) {
  const body = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}
export function readAccess(value?: string): AccessClaim | null {
  if (!value || !secret()) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()) as AccessClaim; } catch { return null; }
}
