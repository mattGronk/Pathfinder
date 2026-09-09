import { NextResponse } from "next/server";
import { accountConfiguration, createAccountClient } from "@/lib/supabase/server";
import {authenticationDestination,emailOtpType} from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const config = accountConfiguration();
  if (!config) return new Response("Password accounts are unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = emailOtpType(url.searchParams.get("type"));
  const next = authenticationDestination(type,url.searchParams.get("next"));
  if (code || (tokenHash && type)) {
    try {
      const client = await createAccountClient();
      const result = code
        ? await client?.auth.exchangeCodeForSession(code)
        : await client?.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
      if (result && !result.error) return NextResponse.redirect(`${config.origin}${next}`, { headers: { "Cache-Control": "private, no-store" } });
    } catch {
      // Expired codes and provider errors share the same safe response.
    }
  }
  return NextResponse.redirect(`${config.origin}/account?error=${type==="recovery"?"recovery":"confirmation"}`, { headers: { "Cache-Control": "private, no-store" } });
}
