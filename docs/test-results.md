# Verification results

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

**Assessment:** ready for restricted human testing with the supplied local disposable accounts. Public onboarding/recovery email delivery remains a production-launch blocker until SMTP is configured and separately verified. Mobile evidence is desktop Chrome at phone sizes, with the GPS/network-fault limits above; it does not certify physical-device GPS or soft keyboards.
