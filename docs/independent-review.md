# Independent release review — 2026-09-18

Current status: OAuth-only revision under independent review. The user superseded email/password authentication with Google and Apple only. Acceptance below applies historically to `fc21d243e25d93a73c125308d47e43c8507cfc5c`, not the new authentication revision. Production readiness now depends on real provider configuration and callback verification, rather than SMTP. The iOS implementation gate remains closed.

## OAuth-only revision — in progress

Review scope: removal of password/signup/reset paths, PKCE callback and session handling, safe return context and guest-bag handoff, account isolation, provider cancellation/errors, accurate setup-state presentation and credential handling. Provider settings alone do not prove a successful Google or Apple sign-in.

Initial source review of `lib/oauth.ts`, Supabase client configuration, the provider-only Auth modal, main initialization and guest-draft changes finds:

- Password/signup/reset controls and calls are removed. Only Google/Apple provider choices exist; hosted public provider booleans govern their availability and disabled providers are labeled honestly.
- PKCE is explicit with automatic URL detection disabled, avoiding two competing exchanges. A module promise protects one-use exchange across StrictMode effects; a full provider round trip reloads the module for a new attempt. Callback code/error data is scrubbed before rendering, and errors remain generic rather than exposing tokens.
- Return context is reconstructed from a view allowlist and UUID cart ID, stored per tab with a one-hour age limit. No external URL or arbitrary `next` value is consumed. The authorize destination must match the dedicated Supabase origin and path.
- Route state reads the rewritten URL even if the callback's synchronous popstate dispatch precedes listener installation. Detail mounting waits for callback/session initialization, protecting guest quantities from an initial guest-state overwrite. Guest restoration uses a readiness guard and validated quantities. Authenticated pending attempts and private fields retain identity-keyed boundaries.
- **Fixed in source — Back/BFCache retry:** a pageshow listener now resets redirect state and refreshes provider availability, addressing disabled buttons restored after leaving the provider. The real provider/back browser regression remains dependent on an enabled provider.

Reviewed current official [Supabase PKCE documentation](https://supabase.com/docs/guides/auth/sessions/pkce-flow) and [OAuth API](https://supabase.com/docs/reference/javascript/auth-signinwithoauth). Successful exchange requires the browser's original verifier; the five-minute code is single-use. Source review passes for the revised OAuth-only UI/callback implementation. Provider configuration, browser/build evidence and real successful Google/Apple round trips remain separate gates; authenticated release acceptance is not granted at this checkpoint.

## Historical email/password release assessment

## Backend assessment

Reviewed both migrations, the shared API contract, and the hosted test implementation/results independently of implementation. Read the Supabase and Postgres skills, privilege/RLS/lock-order references, current Supabase changelog and official RLS documentation. No relevant breaking change was identified for this schema.

No concrete authorization or order-integrity defect found in the reviewed SQL. Client roles have SELECT-only table grants. Order and item reads are constrained to participants. Privileged mutators check permanent authenticated identity and ownership, use fixed search paths, and are not anonymously executable. Mutable user metadata does not authorize access. Menu edits and orders lock carts before menu rows; prices come from database rows and line snapshots are atomic. Presence changes contend on the same cart row. Per-user advisory locks serialize order retry/rate-limit checks. Status transitions lock each order and validate the allowed graph.

The independent testing agent's final `tests/live-backend-results.json` run `qa-1789750613704`, timestamp `2026-09-18T16:57:06.541Z`, records 25 passing hosted checks with certificate-verified TLS. Test source uses genuine GoTrue password tokens for API assertions, four isolated identities, dedicated-project guard, and scoped cleanup. Tests cover cross-owner mutations, participant-only reads, direct-write denial, malformed tokens, server prices/unpaid status, concurrent first submissions, payload mismatch, valid/invalid transitions, unavailable/foreign items, stale/offline presence and rate limits. This is evidence for the backend contract, not signup-mail or website acceptance.

## Findings resolved in source review

- **Checkout identity isolation:** restored cart-and-user keyed component remounts, keeping authenticated pickup names, notes, quantities and pending refs isolated. Guest handoff stores item quantities only. An unmounted request cannot trigger success navigation in the replacement account. User/cart storage keys keep unresolved attempts separate.
- **Ambiguous retries:** exact immutable payload and retry UUID persist in sessionStorage; retries use stored item order even after menu edits and do not depend on menu loading or online status. Form edits remain locked until confirmation/definite rejection. Confirmed responses/rejections remove the entry. If storage cannot save before the request, no RPC is issued and no stale payload ref is captured. Privacy page discloses temporary pickup-name/note storage and tab lifetime.
- **Unavailable-item recovery:** after a definitive rejection refreshes the menu, selected unavailable items retain a remove control with add disabled; customers can repair their bag.
- **Presence/offline ordering:** pending online promises are serialized and awaited before offline/manual writes; generation guards prevent queued geolocation results from publishing after tracking stops. The UI discloses public coordinates and retention of the last location while offline.
- **Active ticket visibility:** all active orders are paginated separately from the 50 recent terminal orders, preventing older active work being hidden by newer history.
- **Auth callback errors:** persistent Auth error state is separate from directory loading, with sign-in/reset guidance. The password-update form is activated on PASSWORD_RECOVERY with a session, not an unauthenticated hash alone.
- **Field constraints:** cuisine/category client limits now match the database's 60-character maximum.

These corrections were re-read independently. No remaining concrete blocking source defect was identified. Browser evidence verifies cross-tab identity isolation, guest quantity handoff, offline control and persistent expired-link guidance. Fault-injected lost-response and geolocation-race checks were not available in the supported browser tooling; exact retry/queue behavior is supported by source review and hosted backend tests, not a claimed browser fault-injection pass.

## Final verification evidence

Reviewed `docs/test-results.md` and `docs/deployment.md`, including the final HTTPS smoke and cleanup. Final production build/typecheck passed. Dependency audit reported zero production advisories; secret scan reported zero matches across 73 candidate files, including 18 browser-static files. Neither result is a guarantee against every security defect.

Chrome/CUA exercised real hosted owner registration/menu/manual presence, customer pickup submission, owner fulfillment, separate community reports, sign-out and account switching. The pickup totaled $21.98 from two $10.99 items and stayed unpaid. Phone-sized 320, 390 and 430 CSS-pixel discovery views and a 320px order view had no horizontal overflow. Modal focus restoration was corrected and verified for Close/Escape; map pins gained cart/status labels and touch targets were reviewed. These are desktop Chrome viewport checks, not physical-phone certification.

Final Vercel HTTPS home/privacy/terms/callback returned 200; the deployed app rendered hosted data and supported owner password sign-in, online/offline writes and sign-out without application console errors. The coordinator independently inspected the deployed page. Deployment configuration uses Next.js on `web`, the dedicated backend's two public environment values, and an exact production Auth callback allowlist. Earlier 404 deployments are excluded from acceptance.

Testing cleanup removed fixture records from all five public tables, with final counts zero, and revoked fixture sessions. Two empty confirmed human-test accounts remain; their credentials are in an ignored local file with mode 0600, never this review or committed artifacts. The empty production directory is intentional and honest.

## Release dependencies and remaining evidence

- **High — public signup/recovery delivery:** custom SMTP is disabled and email confirmation remains enabled. Configure a production sender and verify real signup and recovery delivery. Do not weaken verification. Until resolved, only preverified accounts can exercise authenticated human testing reliably.
- A genuine recovery-session browser check remains unverified along with mail delivery. Before public launch, verify that an actual received link opens the new-password form and completes password reset. Expired-link guidance and reset-form navigation passed; they do not substitute for this check.
- Real device GPS, continuous tracking, mobile soft keyboards, and browser network-fault injection were unavailable. Manual NYC fixture coordinates and desktop Chrome phone viewports were used and disclosed. These limitations are appropriate follow-up human tests, not asserted passes.

## Additional observations

The map creates popup text with DOM textContent, avoiding HTML injection from cart names. Only the current published owner location is retained, including when offline; this behavior must remain disclosed in the consent UI/privacy policy. Public owner/reporter UUIDs are exposed by the documented table contract, but email/password credentials and private orders are not. Owner registration is self-asserted rather than platform verification. No sample data, payments, fees or taxes should be claimed as live functionality.

Native modal uses `dialog.showModal()` rather than merely setting `open`, so browser-provided modal focus containment applies. Escape handling, explicit opener-focus restoration and an accessible title/close button are present; keyboard/modal checks are recorded by the tester. Owner tracking begins only with explicit button action, polls no faster than once/minute, and invalidates pending geolocation acquisition on cleanup via a generation guard; the already-issued-RPC race is addressed by the serialized presence promise. Sighting coordinates require explicit collection or manual entry, and public/unverified status is disclosed.

Main application discards order responses when their captured user ID differs from the current session, clears private order state on identity change, and keys the owner component by identity. Cart-detail also uses identity-keyed remounts after the correction above. Navigation away from the owner view unmounts its tracking effect. Guest near-me coordinates stay in React/browser memory rather than being written to the backend. Privacy and terms explain unpaid reservations, owner-provided claims, retained locations, and unverified sightings. Controls retain visible focus indicators, labeled fields, reduced-motion CSS, and semantic native dialogs. These source findings do not replace real browser validation.

Deployment security headers exist; unsafe-eval was removed during implementation review. CSP still permits unsafe-inline scripts, a defense-in-depth limitation rather than evidence of an injection flaw. The database supports no account/business deletion flow because retained-order foreign keys require an explicit retention/admin process; that limitation is documented in the contract and privacy page.

## Acceptance decision

Accept the deployed website for restricted human testing using confirmed test accounts, within the documented verification scope. Source review, hosted backend tests, core browser journeys and deployed smoke support this decision. Do not label it an unrestricted production launch: production SMTP and actual signup/recovery delivery remain blocking dependencies. The iOS implementation gate remains closed; no iOS completion or validation is claimed.
