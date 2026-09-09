# Recovery redirect fix

Project: axsvaswbqulwyxhhntai, verified as the existing Vercel site's Supabase service.

## App change

Recovery requests now include `type=recovery` and the password-update destination. The callback always routes verified recovery tokens to `/account/update-password`, including email-template links with no next parameter. Unsupported email token types are rejected. Failed provider reset-email requests show a retry error. Invalid/used recovery links have their own message.

## Required Supabase dashboard changes — pending sign-in

- Authentication → URL Configuration → Site URL: `https://pathfinder-sa-zeta.vercel.app`
- Add the exact Vercel `/auth/callback` redirect paths needed by the app, including the recovery callback `https://pathfinder-sa-zeta.vercel.app/auth/callback?type=recovery&next=%2Faccount%2Fupdate-password`. Inspect and preserve unrelated redirects; remove the obsolete Pathfinder `.chatgpt.site` destinations once confirmed.
- Authentication → Emails → Reset password: inspect the existing template. Use `recovery-email-template.html` so recovery links carry a token hash to the server callback. This supports opening the reset email in another browser without requiring the original PKCE cookie.
- Re-read saved URL and template settings to verify persistence.
- Request a fresh reset email after correction. Already-sent email content cannot be rewritten.

At the time this note was written, the browser was at Supabase's sign-in page. The provider configuration has not yet been read or changed. Its old default URL or email template is suspected from the user's symptom, not confirmed.

Verification: targeted lint, TypeScript, production build and four recovery-routing tests passed. No user's password was changed and no email was sent by the agent.

References: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/guides/auth/auth-email-templates
