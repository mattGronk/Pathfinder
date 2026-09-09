import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pathfinderProject } from "./project";

export function accountConfiguration() {
  if (process.env.PATHFINDER_ACCOUNTS_ENABLED === "false") return null;
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  const appUrl = process.env.APP_URL ?? pathfinderProject.appOrigin;
  try {
    const endpoint = new URL(url);
    const app = new URL(appUrl);
    if (endpoint.protocol !== "https:" || app.protocol !== "https:" || !key.startsWith("sb_publishable_")) return null;
    return { url, key, origin: app.origin };
  } catch {
    return null;
  }
}

export async function createAccountClient() {
  const config = accountConfiguration();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { secure: true, httpOnly: true, sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Read-only Server Components rely on proxy.ts to refresh cookies.
        }
      },
    },
  });
}

export type PathfinderAccount = { userId: string; email: string };

export async function getPathfinderAccount(): Promise<PathfinderAccount | null> {
  try {
    const client = await createAccountClient();
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.id || !data.user.email) return null;
    return { userId: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export async function requirePathfinderAccount(returnTo: string): Promise<PathfinderAccount> {
  const account = await getPathfinderAccount();
  if (!account) redirect(`/account?next=${encodeURIComponent(returnTo)}`);
  return account;
}


