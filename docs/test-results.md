# Verification results

## Current addition — optional WhatsApp notifications, 2026-09-18

Backend migration `20260918200120` and both Edge Functions are installed in the dedicated hosted project with delivery **off**. New frontend source builds successfully; final deployment is coordinated separately. This verifies disabled installation and notification logic, not real Meta delivery or authenticated browser acceptance.

Final deployment resumed check: source `4e712dd0e8c7bdf63ef825d606ba0fea590d5426` (application change `db02c75`), deployment `dpl_9ZhE68qMTYzodYtitrZyPpWvn9w7`, is now **READY**. The public production origin serves the new WhatsApp privacy disclosure, confirmed through actual Chrome and HTTP. Home/privacy/terms/callback each return HTTP 200. Deployed endpoint/authentication and feature-OFF checks again pass **7/7**.

After Chrome Control recovered, actual production guest and OAuth-unavailable dialog checks passed at **320/390/430 × 844px**. Dialog widths were 284/354/394px with no horizontal overflow; screenshots were visually inspected. The 320px guest page exposes discovery controls in the first viewport. Google/Apple remain disabled with clear explanations. Escape dismissed the dialog and restored focus to Sign in; captured application error logs were empty. Viewport override was reset. This verifies public/default-OFF behavior only; checkout opt-in and verification controls were not exercised while delivery is disabled.

- `npm run build` and `npm run typecheck`: pass on final WhatsApp source. OAuth regression tests: **8/8 unit** and **6/6 hosted** pass; Email, Google and Apple remain disabled.
- `node --test tests/whatsapp.test.mjs`: **11/11 pass** executing actual TypeScript shared code and request handlers with mocked transport/environment. Covers raw-body HMAC tampering, business/phone binding, malformed events, minimal templates, unverified/withdrawn suppression, definitive throttling versus uncertain outcomes, three-job batch limit, webhook verification/auth and worker authentication. No real message sent.
- `node tests/whatsapp-http.mjs`: **7/7 pass** on deployed hosted endpoints: missing/incorrect worker secret, unsupported methods, unsigned webhook and wrong verification token reject; public availability returns disabled with no business number.
- `node tests/whatsapp-hosted.mjs`: **25/25 pass** against the live hosted migration. Covers private phone/consent grants, owner/stranger isolation, explicit valid consent, same-key retry while disabled, fresh disabled-request rejection, challenge renewal/hash/exact sender/expiry/replay, created/ready/cancelled event behavior, post-claim cancellation and withdrawal suppression, STOP and deduplicated old STOP after new opt-in, bounded retries, unknown-outcome handling, monotonic statuses and expired leases. Result details: `tests/whatsapp-hosted-results.json`.
- Hosted role tests use TLS certificate validation, synthetic authenticated/service-role claims and reserved fictional phone numbers inside one transaction that always rolls back. These test database authorization and behavior; they are not genuine OAuth sessions. Repeated claims verify exclusive sequential selection; actual concurrent workers were not exercised.
- Secret comparison scan: **97 files including 18 production static bundles**, no database-password matches. No WhatsApp secrets have been provisioned. A separate live read observed delivery disabled and zero QA transaction users/carts, private consents and outbox rows outside the test transaction.

**Limits:** Chrome Control has recovered, but enabled WhatsApp checkout/verification visuals and interaction remain untested while delivery is off. Meta business credentials, templates, webhook setup and an explicitly opted-in recipient remain pending; real created/ready/cancelled deliveries and STOP replies are unverified. Do not enable delivery based only on mocked tests. Google setup is being resumed; its genuine OAuth round trip is still pending. Apple remains pending. Earlier mobile screenshots and password journeys below are historical and do not establish these new flows.

### Resumed Google setup checkpoint

Latest hosted settings check passes 6/6 with **Google enabled, Email disabled, Apple disabled**. Production Chrome likewise shows an enabled Google control and unavailable Apple. The implementation agent verified the base account as a test user, then published the Google audience to In production with only the three identity scopes and application/privacy/terms links. Audience publication is configuration evidence, not a completed sign-in. No OAuth round trip has completed yet: the first-account Continue with Google step presents Halal Cart terms acceptance, so the browser action-time confirmation requirement is pending with the coordinator. The real user identity must be preserved after testing; only app sign-out is intended.

## Current change — OAuth-only, 2026-09-18

The user replaced email/password authentication with Google and Apple only. **Earlier password sign-in and 25/25 backend results below are historical; they do not verify OAuth.** SMTP is no longer the current onboarding dependency. Authenticated release acceptance now depends on provider setup and a genuine OAuth round trip.

Current source verification:

- Read the installed Supabase skill, current changelog, official [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) and [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) documentation.
- `node --test tests/oauth.test.mjs`: **8/8 pass**. Actual `lib/oauth.ts` is executed with mocked browser/Auth dependencies: safe route fields, one-use exchange, code/error scrubbing, missing/invalid/stale contexts, disabled provider/storage refusal, identity-only scopes and trusted authorization destination. This is not a real provider login.
- Final source `8ba78e3` build/typecheck pass. Secret scan checked 85 candidate files including 18 static bundles, with no match for the database password. Obsolete fixture passwords were removed locally; hosted identities/data were preserved.
- Actual Chrome local production checks: no email/password inputs; only Google/Apple controls, both honestly disabled while unavailable. Guest browsing remains usable.
- Cancellation, missing-code and invalid-code callbacks scrubbed the URL back to the app origin and showed safe retry guidance without echoing provider error details. Retry reopened the provider-only dialog.
- OAuth dialog had no horizontal overflow at 320/390/430px: dialog widths 284/354/394px, document scroll width equal to each viewport. Screenshots: `tests/screenshots/oauth-options-*.png`.
- `node tests/oauth-hosted.mjs`: **6/6 pass** against the dedicated live project. Email is disabled, its password token endpoint rejects requests as provider-disabled, only permitted provider names can be enabled, and account-free carts/menu/sightings reads work. Actual settings: Email off, Google off, Apple off. This passes denial/configuration checks; it does not mean any login provider works.
- Both historical fixture commands were executed after Email disable and correctly exited before creating users. Hosted accounts/data were untouched.

Final deployed guest/error smoke passed on **https://halal-cart-app.vercel.app/**, source `8ba78e3`, deployment `dpl_9xQAp1jQuYv3PcbXsKpF4x7UL97k`:

- HTTPS home, privacy, terms and callback routes each returned 200.
- Real Chrome showed zero email/password inputs; Google/Apple controls were both correctly disabled and explained as unavailable. Guest directory stayed usable, with no fabricated cart data. No application console errors were captured on the normal guest/provider-options path.
- Deployed cancellation, invalid-code and missing-code callbacks all returned to the same app origin, removed code/provider-error parameters, and displayed safe retry guidance. Screenshot: `tests/screenshots/oauth-deployed.png`.
- Production tab left signed out on the clean guest homepage, temporary viewport reset, local test server stopped.

**Current acceptance:** guest browsing, OAuth-only UI, failure paths, source checks and denial/configuration tests pass. **Authenticated human testing remains pending**: Google is now configured, but the genuine first sign-in has not completed; Apple is still unconfigured. No genuine OAuth round trip, provider Back/BFCache return, OAuth bag handoff or cross-provider identity switch is claimed. The user approved the Google setup checkpoint; provider configuration is resuming now that Chrome Control has recovered. Apple setup is pending. Logic/source checks cover return intent and account scoping; historical password browser evidence below is context only.

Historical fixture scripts stop before creating users when Email is disabled. Never re-enable Email to rerun them. Current human-testing instructions are in `docs/human-testing.md`.

## Historical evidence — before OAuth-only change

## 2026-09-18 — preparation

- Read project instructions and Supabase/Postgres security skills.
- Read current official Supabase RLS and Auth admin-create-user documentation and changelog. Hosted REST/RLS tests will use application user tokens, never an admin token for the assertions.
- Confirmed `.env` is ignored. Environment contains the public project URL, publishable key and database password; values were not printed.
- Backend contract and hosted schema are in progress. No functional, mobile-browser or deployment pass is claimed yet.

## Hosted backend — passed 2026-09-18 16:57 UTC

Command: `TEST_DB_HOST=aws-0-us-west-2.pooler.supabase.com TEST_DB_USER=postgres.wbbnwbkpzoggffmvnqkh node tests/live-backend.mjs`

Result: **25/25 checks passed**, exit 0. Machine-readable evidence: `tests/live-backend-results.json`, run `qa-1789750613704`. Four disposable confirmed users authenticated through the real hosted GoTrue password endpoint. All application assertions used publishable-key guest requests or real user bearer tokens; privileged SQL was used only for fixture setup, stale-presence simulation and exact-ID cleanup.

Verified guest cart/menu reads; guest/invalid-token write denial; cross-owner menu/presence denial; direct table mutation denial; offline/stale/invalid-location rejection; server-trusted price and unpaid orders; quantity and foreign-menu rejection; existing and concurrent first-submit idempotency; changed-payload retry rejection; owner/customer order and item visibility with stranger isolation; valid lifecycle and invalid transition denial; customer cancellation; unavailable items; separate community sightings; sighting and order rate limits.

Initial run had 24/25 because a test sent an empty PATCH body, which PostgREST treats as a successful no-op. The assertion was corrected to request a real column mutation; the complete suite then passed. No application fix was required.

Final rerun uses verified TLS with the Supabase root CA downloaded from the dashboard's official certificate link. Earlier fixture connections were encrypted but did not validate the pooler certificate; both test scripts now validate it and the full suite still passes.

Fixture cleanup signed out sessions and removed exact test user IDs and dependent records. No fixture carts are retained or represented as real cart locations.

Limitations: tests created confirmed Auth fixtures using hosted SQL, so they verify genuine password sign-in but **do not verify signup verification/recovery email delivery**. Coordinator dashboard inspection found custom SMTP off and email confirmation on; default SMTP production recipient restrictions remain a deployment dependency. Direct IPv6 database hostname was unavailable in this environment; the dashboard-confirmed session pooler was used.

Dependency security check: `npm audit --omit=dev --json` exited 0, with zero reported vulnerabilities in production dependencies on 2026-09-18. This advisory scan is not a comprehensive security audit.

## Website production build and live browser QA — 2026-09-18

`npm run build` and `npm run typecheck` pass on the reviewed application. Production server tested at `http://localhost:3001` using Chrome Control/CUA, not simulated DOM tests. Final deployment smoke remains separate.

Final secret exposure scan: `node tests/check-secret-exposure.mjs --require-bundle` compared the database password and both random fixture passwords (including URL/base64 encodings) against 76 candidate files including 18 production static files: zero matches. `.env`, `.env.local`, `tests/.env.browser-qa`, `tests/.env.human-testing` and other `tests/.env.*` are ignored. No credentials were printed. Reports contain only credential-free test evidence.

### Verified user journeys

- Guest discovery starts account-free, reads actual hosted data, and shows an honest empty directory before fixtures. Search/filter/map controls and start of results appear in the first mobile viewport after the initial oversized hero was corrected.
- Owner signed in through the UI, created a clearly labeled temporary QA cart, added a $10.99 menu item, published explicit manual NYC test coordinates, and went online. No real device location was published.
- Guest opened the live menu, added two items, and signed in as a separate customer. Quantities survived guest-to-customer handoff; pickup name/notes were cleared. Customer submitted a genuine hosted $21.98 pickup order. UI clearly showed unpaid/pay-at-cart status.
- Sign-out cleared private customer order display. Owner then signed in, saw the incoming order, and processed accepted → preparing → ready → completed through the UI. Status and totals stayed correct.
- Explicit automatic-location action could not access device location and showed a recoverable manual-entry message. Go offline succeeded, and the online-only filter removed the cart. Real GPS hardware/continuous tracking was not exercised.
- Map rendered tiles and the hosted cart's coordinates; pin popup distinguished offline/last-shared location and offered a menu link. Generic pin accessible label was reported and fixed to identify the cart.
- Customer created a clearly labeled temporary community sighting through the form. Result explicitly said unverified and displayed timestamp, separate from owner presence.
- Cross-tab identity regression: tab A held owner pickup name/notes and a failed offline checkout; tab B signed out and signed into the customer account. Tab A remounted with bag count 0 and blank name/notes; previous private draft and error did not leak.
- An expired callback error hash displayed persistent sign-in failure guidance after directory loading, with a working path to the password-reset form. No recovery email was sent and no genuine recovery-token exchange is claimed.

### Mobile evidence

Actual Chrome viewport overrides, not physical devices: 320×844, 390×844 and 430×844 CSS pixels for discovery; 430×932 for owner orders. Screenshots are in `tests/screenshots/`.

| Width | Document client/scroll width | Search top | First cart top | Result |
| --- | --- | --- | --- | --- |
| 320 | 305 / 305 | 434 px | 631 px | No horizontal overflow; discovery and result beginning in first viewport |
| 390 | 375 / 375 | 340 px | 485 px | No horizontal overflow |
| 430 | 415 / 415 | 367 px | 512 px | No horizontal overflow |

The 15px difference is the desktop Chrome scrollbar. The completed customer order was also inspected at 320px with client/scroll widths both 305px. Forms have accessible labels and browser validation. Footer touch targets were initially too small and were increased to 44px. Final map control scan found no button/input below 24px in either dimension. Final map marker accessible name identifies the cart and offline status. A long sighting modal measured 284px wide at a 320px viewport, with document client/scroll width both 320px and no overflow.

Modal Tab navigation reached fields. Initial close/Escape lost focus; explicit opener-focus restoration was implemented and retested successfully: both Close and Escape returned the DOM's active element to the **Share a sighting** opener. Latest source including this fix passes production build and typecheck.

Production browser logs contained no application errors during the main flows. A development-only CSP/eval warning and Next.js toolbar overlay were avoided by testing the production build; development CSP was also corrected without enabling eval in production.

### Remaining limits / release gates

- Public signup verification and password recovery email delivery are blocked by unconfigured production SMTP. Admin-created confirmed fixtures do not prove those flows.
- Supported CUA tooling does not expose network interception, so ambiguous network-loss checkout recovery and artificial geolocation in-flight races were reviewed in source and exercised at backend level, but not fault-injected in the browser. Native GPS hardware and mobile soft keyboard were not available; this is desktop Chrome at phone sizes, not a physical-device certification.

## Final deployment and human-testing handoff — verified

Production: **https://halal-cart-app.vercel.app/**, deployment source `fc21d24`. Initial READY deployment returned Vercel 404 because its preset was Other; implementation corrected the preset to Next.js and redeployed. Final smoke passed:

- HTTPS `/`, `/privacy`, `/terms`, `/auth/callback` each returned HTTP 200 with HTML and HSTS. Production CSP excludes `unsafe-eval`.
- Chrome at 390px displayed the deployed website and actual hosted cart data. Real owner password sign-in succeeded; dashboard showed the existing completed test order. Publishing location online then going offline both succeeded through the deployed UI, followed by sign-out.
- No production browser console errors were captured. Screenshots: `tests/screenshots/deployed-390.png` and `deployed-empty-390.png`.
- Cleanup removed only exact fixture IDs and dependent data, revoked their sessions, and preserved two empty disposable owner/customer accounts for human testing. Hosted counts after cleanup: carts 0, menu_items 0, orders 0, order_items 0, sightings 0. A follow-up hosted query verified exactly 2 retained accounts and 0 remaining sessions for their IDs. The deployed empty state was reloaded and verified; no fake cart remains public.
- Human-testing credentials exist only in ignored **`tests/.env.human-testing`**, verified mode **0600**. No passwords appear in reports or Git. Use `node tests/browser-fixtures.mjs --cleanup-human` when these accounts and their test data should be removed.
- Temporary viewport override was reset, the production tab is signed out and retained for the user, and the testing agent's local production server was stopped. Implementation agent was asked to stop its development server.

**Historical assessment (superseded):** this password-based version was ready for restricted testing. Its local passwords have since been removed; use the OAuth-only current status above. Mobile evidence is desktop Chrome at phone sizes, not physical-device GPS or soft-keyboard certification.
