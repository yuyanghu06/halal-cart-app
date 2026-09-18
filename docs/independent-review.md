# Independent release review — 2026-09-18

Status: backend and frontend source review accepted for a restricted human-testing release candidate. Functional/browser/deployed acceptance remains pending evidence; public-production release is blocked by mail delivery.

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

These corrections were re-read independently. No remaining concrete blocking source defect was identified at this checkpoint. Targeted browser checks are still required, especially identity switching, safe retry recovery, offline ordering and valid/invalid recovery callback behavior.

## Release dependencies and remaining evidence

- **High — public signup/recovery delivery:** custom SMTP is disabled and email confirmation remains enabled. Configure a production sender and verify real signup and recovery delivery. Do not weaken verification. Until resolved, only preverified accounts can exercise authenticated human testing reliably.
- Production build/static checks on the final source, narrow/wide mobile journeys, keyboard/forms/error states, deployed HTTPS smoke and Auth redirects must be recorded in `docs/test-results.md` before functional release acceptance.
- A genuine recovery-session browser check is required to establish that Auth initialization/event timing opens the new-password form; generated test links can check UI behavior but cannot prove mail delivery.

## Additional observations

The map creates popup text with DOM textContent, avoiding HTML injection from cart names. Only the current published owner location is retained, including when offline; this behavior must remain disclosed in the consent UI/privacy policy. Public owner/reporter UUIDs are exposed by the documented table contract, but email/password credentials and private orders are not. Owner registration is self-asserted rather than platform verification. No sample data, payments, fees or taxes should be claimed as live functionality.

Native modal uses `dialog.showModal()` rather than merely setting `open`, so browser-provided modal focus containment applies. Escape handling and an accessible title/close button are present. Browser QA must still verify Tab/Shift+Tab, focus restoration, small-screen visibility and scrolling. Owner tracking begins only with explicit button action, polls no faster than once/minute, and invalidates pending geolocation acquisition on cleanup via a generation guard; the already-issued-RPC race is addressed by the serialized presence promise. Sighting coordinates require explicit collection or manual entry, and public/unverified status is disclosed.

Main application discards order responses when their captured user ID differs from the current session, clears private order state on identity change, and keys the owner component by identity. Cart-detail also uses identity-keyed remounts after the correction above. Navigation away from the owner view unmounts its tracking effect. Guest near-me coordinates stay in React/browser memory rather than being written to the backend. Privacy and terms explain unpaid reservations, owner-provided claims, retained locations, and unverified sightings. Controls retain visible focus indicators, labeled fields, reduced-motion CSS, and semantic native dialogs. These source findings do not replace real browser validation.

Deployment security headers exist; unsafe-eval was removed during implementation review. CSP still permits unsafe-inline scripts, a defense-in-depth limitation rather than evidence of an injection flaw. The database supports no account/business deletion flow because retained-order foreign keys require an explicit retention/admin process; that limitation is documented in the contract and privacy page.

## Acceptance decision

Backend security/functional evidence is positive within the tested scope. Frontend code review accepts the corrected source for deployment as a restricted human-testing candidate. This does not grant production readiness or claim unrecorded functional/browser/deployment passes. Public-production acceptance and the iOS implementation gate remain blocked until the required evidence and mail delivery are resolved.
