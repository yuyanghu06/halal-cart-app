# Website deployment

Status: production Next.js website deployed September 18, 2026. Public root route independently verified in Chrome by the coordinator after the final deployment. The testing agent records hosted HTTPS functional smoke and fixture cleanup in `test-results.md`.

- Public URL: https://halal-cart-app.vercel.app
- Vercel project: `halal-cart-app` / `prj_yaEQUwwlgvjbvWlUnRM6lPnS73Gm`
- Vercel team: `team_sIVk8dkyqMJIRQ2e4uTa4w0O`
- Production deployment: `dpl_9ZhE68qMTYzodYtitrZyPpWvn9w7`
- Inspector: https://vercel.com/yuyanghu06s-projects/halal-cart-app/9ZhE68qMTYzodYtitrZyPpWvn9w7
- Deployed source: `4e712dd0e8c7bdf63ef825d606ba0fea590d5426` (application changes through `db02c750cd4acd554c85c40c9055a3453d190961`)
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

## Historical deployment verification and recovery

Vercel reported the final deployment `READY`, target `production`, source branch `web`, and the exact source SHA above. The public alias was independently opened in Chrome and rendered the app with hosted directory data and active sign-in controls. This closes an earlier packaging failure: the repository-link tool initially chose `main` and framework `Other`, so an intermediate deployment built but returned a Vercel 404. Production tracking was corrected to `web`, framework preset to Next.js, and the final source was deployed under those settings. The earlier two deployments are not known-good rollback targets.

Later documentation-only `web` commit `2d8a145` also reached production READY (`dpl_9d4sYPJJGqdet6vuS9PyzybKFpBh`) with unchanged application source. The known-good functional smoke above applies to application code through `fc21d24`; later handoff commits do not change that code.

Vercel's project Ignored Build Step is set to **Only build production**, saved and read back after observing unwanted `main`/`ios` preview failures. Only `web` is the production branch. Shared backend/iOS branches intentionally have no website package and future non-production builds are skipped; historical failed previews are not release artifacts. The local development and test servers were stopped after verification.

For future releases, push reviewed website changes to `web`, then verify the deployment state, public root route, hosted directory request, and authenticated critical paths. A successful build alone is not release verification. Keep shared backend migrations coordinated with `main` and the eventual iOS client.

Only the dedicated Halal Cart Vercel project and dedicated Halal Cart Supabase Auth URLs were changed during website deployment. No unrelated projects, access protections, credentials, billing plans, or provider settings were modified.

## OAuth-only revision: setup in progress

Application changes remove all email/password/signup/reset flows. Browser PKCE explicitly exchanges the callback code, preserves a whitelisted local destination and guest bag quantities, handles cancellation/expired codes without echoing credentials, and supports retry after browser Back restoration. Only Supabase public connection variables are needed in Vercel; provider secrets stay in Supabase Auth configuration.

Google Cloud project `halal-cart-nyc-2026` (display name **Halal Cart**, project number `648130500310`) contains one dedicated **Halal Cart Web** OAuth client. The user approved the policy/client setup checkpoint and completed its Finish step; creation and provider configuration are now complete. No billing or Workspace subscription was added.

- Authorized JavaScript origins: `https://halal-cart-app.vercel.app` and `http://localhost:3000`.
- Authorized redirect URI: `https://wbbnwbkpzoggffmvnqkh.supabase.co/auth/v1/callback` only.
- Saved scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`. No sensitive or restricted scopes.
- Branding: Halal Cart; published home, privacy and terms URLs; only the dedicated app and Supabase domains; no uploaded logo requiring extra verification.
- Audience read back **External / In production**. A base-account test user was added during setup, but production audience is no longer restricted to test users.
- Dedicated client ID/secret transferred privately to Supabase; dashboard read back **Google Enabled**, **Apple Disabled**, **Email Disabled**. Nonce checks remain enabled and email is required. No provider secret was written to Git, Vercel, logs or client code; temporary in-memory secret data was cleared after saving.

Actual first Google sign-in has reached the Google consent screen, awaiting the user's specific first-sign-in Terms/Privacy acceptance. Configuration success is not yet an end-to-end authentication claim; tester evidence will record the completed round trip separately.

Apple requires an enrolled Apple Developer team, a primary App ID with Sign in with Apple, an associated Services ID for web, Team ID, Key ID and a Sign in with Apple `.p8` signing key. Configure web domain `wbbnwbkpzoggffmvnqkh.supabase.co` and return URL `https://wbbnwbkpzoggffmvnqkh.supabase.co/auth/v1/callback`. Put the Services ID first in Supabase's allowed client IDs for web OAuth. Generate the Apple client-secret JWT privately and renew it before its maximum six-month expiry. Apple Developer access is currently signed out; no Apple credentials were supplied, created, or enabled.

References: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase Apple setup](https://supabase.com/docs/guides/auth/social-login/auth-apple), [PKCE callback exchange](https://supabase.com/docs/guides/auth/sessions/pkce-flow). Provider availability and end-to-end success must be recorded separately from source/build verification.

## WhatsApp implementation and activation gate

Migration `20260918200120_whatsapp_notifications` and both Edge Functions are installed on the dedicated hosted project with delivery OFF. No Meta sender, application, access token, templates, or real delivery is configured or claimed. Browser control is currently disconnected. The user has not identified a business sender number or opted-in test recipient. Do not reuse a personal contact automatically or purchase/migrate a number without an explicit decision.

Edge functions `whatsapp-worker` and `whatsapp-webhook` use custom authentication (`verify_jwt=false`): worker requires `x-worker-secret`; webhook requires GET verification token or POST raw-body HMAC using the Meta app secret. Keep all these **Edge secrets**, never Vercel NEXT_PUBLIC variables: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_WORKER_SECRET`, `WHATSAPP_GRAPH_VERSION`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_TEMPLATE_CREATED`, `WHATSAPP_TEMPLATE_READY`, `WHATSAPP_TEMPLATE_CANCELLED`. Select a currently supported Graph API version explicitly. Built-in Supabase URL/service-role secrets are used only inside Edge Functions.

A dedicated Meta business portfolio/WABA, business sender registration and minimal system-user access for WhatsApp messaging are required. Configure the subscribed `messages` webhook at `https://wbbnwbkpzoggffmvnqkh.supabase.co/functions/v1/whatsapp-webhook`. Both configured WABA ID and sender phone-number ID are enforced. Submit three utility templates in the chosen language: order received (awaiting cart acceptance), ready for pickup, and cancelled/not accepted. Each template must contain exactly one body text parameter: short order reference. Include STOP opt-out guidance and no marketing, fees, payment claims or free-form notes. Templates must actually be approved before activation.

The migration schedules `halal-cart-whatsapp` once per minute for retention/claim maintenance. Outbound dispatch remains inactive while `private.whatsapp_config.enabled=false` and without Vault secret `whatsapp_worker_secret` matching the Edge secret (at least 32 random characters). Configure secrets privately, verify sender/templates/webhook, then set the private config business number (international digits without +) and enable flag. If any integration check fails, leave the flag false: no phone collection and no delivery promise. Disabling stops future authorizations; already in-flight sends cannot be recalled.

Test before activation with a deliberately identified opted-in recipient: checkout consent → inbound VERIFY → status template → signed delivery receipt → STOP → new status suppressed. No real messages have been sent by this implementation pass. Operator reconciliation must inspect unknown outcomes against Meta delivery evidence; never blindly requeue uncertain sends. Monitor failed/unknown events and credential/template availability; the website remains the source of current order status.

Primary references: [Meta Cloud API collection](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api), [WhatsApp business messaging policy](https://whatsappbusiness.com/policy/), [Supabase scheduled functions](https://supabase.com/docs/guides/functions/schedule-functions), [Meta webhook signature documentation](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/). Direct Meta developer pages returned HTTP429 during this pass; the official collection and policy were accessible.

The worker acknowledges the scheduler with HTTP202 and uses `EdgeRuntime.waitUntil` for a maximum three jobs per invocation. The pg_net request has a 10-second initiation timeout; it does not wait on message dispatch. An interrupted background task is handled by the five-minute unknown-claim recovery rule, not automatic redelivery.

Hosted installation readback: `whatsapp_availability()` returned `{enabled:false,business_number:null}`; Vault has zero `whatsapp_worker_secret` records; cron job exists and is active solely for maintenance until configured. Edge versions: worker1 (`61f56b19-8870-4134-8739-440ca56f1db6`) and webhook1 (`b1a45e49-6797-459b-9af8-456f79a4a45d`). Local migration filename was aligned to the actual hosted version without reapplying SQL. Hosted semantics and transport tests are recorded separately by the tester.

Advisors after installation: private WhatsApp tables intentionally have RLS enabled and no policies (deny all direct access), producing INFO notices; their unused indexes are expected before traffic. An existing Auth leaked-password-protection warning remains while Email/password provider is disabled; OAuth is not affected. References: [RLS no-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No unrelated projects or credentials were modified.

## Current production readback

The WhatsApp default-OFF application release is now Vercel READY at deployment `dpl_9ZhE68qMTYzodYtitrZyPpWvn9w7`, exact source `4e712dd0e8c7bdf63ef825d606ba0fea590d5426`. An initial `db02c75` push did not emit a deployment; a bounded documentation push triggered the release, which remained INITIALIZING before completing. Independent Chrome and HTTP checks of `https://halal-cart-app.vercel.app/privacy` now show the new WhatsApp disclosure, and all four application routes return HTTP200. Mobile/default-OFF checks passed; see the tester's current evidence. This supersedes the earlier pending-platform status.
