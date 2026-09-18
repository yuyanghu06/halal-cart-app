# Website deployment

Status: production Next.js website deployed September 18, 2026. Public root route independently verified in Chrome by the coordinator after the final deployment. The testing agent records hosted HTTPS functional smoke and fixture cleanup in `test-results.md`.

- Public URL: https://halal-cart-app.vercel.app
- Vercel project: `halal-cart-app` / `prj_yaEQUwwlgvjbvWlUnRM6lPnS73Gm`
- Vercel team: `team_sIVk8dkyqMJIRQ2e4uTa4w0O`
- Production deployment: `dpl_GfY6GLS1WPe6nCv98GsMZvadC1Nf`
- Inspector: https://vercel.com/yuyanghu06s-projects/halal-cart-app/GfY6GLS1WPe6nCv98GsMZvadC1Nf
- Deployed application source: `fc21d243e25d93a73c125308d47e43c8507cfc5c`
- Source repository: https://github.com/yuyanghu06/halal-cart-app
- GitHub default branch and Vercel production branch: `web`
- Framework preset: Next.js. Root directory: repository root. Node runtime: 24.x. Default Next.js build/output behavior, no static-export override.

## Configuration verified

The project has exactly two application environment variables, scoped to Production: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Their values point to the dedicated Halal Cart backend. No database password, service-role key, or secret Supabase API key was configured in Vercel. A temporary file containing only those two public values was used for preparation and removed after configuration.

Supabase project `wbbnwbkpzoggffmvnqkh` Auth URL configuration was saved and then read back in the dashboard:

- Site URL: `https://halal-cart-app.vercel.app`
- Redirect URL: `https://halal-cart-app.vercel.app/auth/callback`
- Redirect URL: `http://localhost:3000/auth/callback`
- Exactly two redirect URLs; no broad wildcard or unrelated preview origins.

The user subsequently replaced email authentication with Google/Apple OAuth only. The Email provider is disabled; existing accounts/data are preserved and OAuth signup remains enabled. The app offers only Google/Apple, reading live provider settings to disable unavailable providers honestly. SMTP is no longer a sign-in dependency. The original password-based smoke evidence above is historical; the OAuth revision requires separate provider round-trip verification.

## Deployment verification and recovery

Vercel reported the final deployment `READY`, target `production`, source branch `web`, and the exact source SHA above. The public alias was independently opened in Chrome and rendered the app with hosted directory data and active sign-in controls. This closes an earlier packaging failure: the repository-link tool initially chose `main` and framework `Other`, so an intermediate deployment built but returned a Vercel 404. Production tracking was corrected to `web`, framework preset to Next.js, and the final source was deployed under those settings. The earlier two deployments are not known-good rollback targets.

Later documentation-only `web` commit `2d8a145` also reached production READY (`dpl_9d4sYPJJGqdet6vuS9PyzybKFpBh`) with unchanged application source. The known-good functional smoke above applies to application code through `fc21d24`; later handoff commits do not change that code.

Vercel's project Ignored Build Step is set to **Only build production**, saved and read back after observing unwanted `main`/`ios` preview failures. Only `web` is the production branch. Shared backend/iOS branches intentionally have no website package and future non-production builds are skipped; historical failed previews are not release artifacts. The local development and test servers were stopped after verification.

For future releases, push reviewed website changes to `web`, then verify the deployment state, public root route, hosted directory request, and authenticated critical paths. A successful build alone is not release verification. Keep shared backend migrations coordinated with `main` and the eventual iOS client.

Only the dedicated Halal Cart Vercel project and dedicated Halal Cart Supabase Auth URLs were changed during website deployment. No unrelated projects, access protections, credentials, billing plans, or provider settings were modified.

## OAuth-only revision: setup in progress

Application changes remove all email/password/signup/reset flows. Browser PKCE explicitly exchanges the callback code, preserves a whitelisted local destination and guest bag quantities, handles cancellation/expired codes without echoing credentials, and supports retry after browser Back restoration. Only Supabase public connection variables are needed in Vercel; provider secrets stay in Supabase Auth configuration.

Google Cloud project `halal-cart-nyc-2026` (display name **Halal Cart**, project number `648130500310`) was created in the base Chrome Google account, separate from unrelated projects. No billing or Workspace subscription was added. Consent branding is prepared with the same account as support/developer contact and an External audience, initially testing. The form is paused before the required Google API Services: User Data Policy acceptance; no OAuth client credentials exist yet. After approval, the dedicated Web application client requires:

- Authorized JavaScript origins: `https://halal-cart-app.vercel.app` and `http://localhost:3000`.
- Authorized redirect URI: `https://wbbnwbkpzoggffmvnqkh.supabase.co/auth/v1/callback` (the provider callback, distinct from the app's callback).
- Only identity scopes: `openid`, email, profile.
- Client ID and client secret entered only into the dedicated Supabase Google provider, then enable it; verify actual round trip. External Testing limits need explicit test-user configuration until production audience publishing is completed.

Apple requires an enrolled Apple Developer team, a primary App ID with Sign in with Apple, an associated Services ID for web, Team ID, Key ID and a Sign in with Apple `.p8` signing key. Configure web domain `wbbnwbkpzoggffmvnqkh.supabase.co` and return URL `https://wbbnwbkpzoggffmvnqkh.supabase.co/auth/v1/callback`. Put the Services ID first in Supabase's allowed client IDs for web OAuth. Generate the Apple client-secret JWT privately and renew it before its maximum six-month expiry. Apple Developer access is currently signed out; no Apple credentials were supplied, created, or enabled.

References: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase Apple setup](https://supabase.com/docs/guides/auth/social-login/auth-apple), [PKCE callback exchange](https://supabase.com/docs/guides/auth/sessions/pkce-flow). Provider availability and end-to-end success must be recorded separately from source/build verification.
