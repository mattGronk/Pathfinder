import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { accountConfiguration } from "./src/lib/supabase/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const config = accountConfiguration();
  if (!config) return response;
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: { secure: true, httpOnly: true, sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, cacheHeaders) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(cacheHeaders ?? {}).forEach(([name, value]) => response.headers.set(name, value));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  try { await supabase.auth.getUser(); } catch { /* Protected routes verify identity again. */ }
  return response;
}

export const config = { matcher: ["/", "/account/:path*", "/onboarding/:path*", "/assessment/:path*", "/auth/:path*"] };

