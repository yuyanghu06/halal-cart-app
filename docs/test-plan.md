# Website acceptance and hosted integration plan

## Current additions — OAuth and optional WhatsApp

OAuth-only: Email must remain disabled. Confirm Google provider configuration and complete a real production OAuth round trip before accepting authenticated human testing; Apple stays visibly unavailable until separately configured. Test callback cancellation, missing/invalid code, safe app-only return context, same-tab PKCE, guest bag handoff, private state clearing and sign-out. Existing password-backed tests are historical and must not trigger Email re-enablement.

WhatsApp: optional contact/consent must not block ordinary pickup ordering. A submitted phone alone is not proof of control: only an unexpired, order/account-bound activation challenge arriving from the exact submitted E.164 sender may activate notifications. Test mismatches, expiry, replay, duplicate inbound events, STOP suppression, explicit revocation, and no delivery without consent/verification. Phone/challenge data must stay private from guest and cart-owner reads. Test created/ready/cancelled event uniqueness, worker authorization and claims, bounded retry of definitive throttling, and no blind retry of ambiguous sends. Signed webhook HMAC must bind the raw request body; malformed or unsigned events must fail closed.

Use hosted PostgreSQL role/claims fixtures inside transactions that are always rolled back for new database authorization tests while OAuth is unavailable. This verifies database roles, not a real OAuth session. Worker/webhook transport tests must mock Meta; no real WhatsApp send without an explicitly identified opted-in recipient. Never infer consent or reuse a saved personal phone number. Final live delivery remains separately unverified until provider configuration, approved templates and an authorized recipient are available.

Status: planned, 2026-09-18. Target only hosted Supabase project `wbbnwbkpzoggffmvnqkh`. No local Supabase or Docker. Tests use disposable, clearly prefixed records; cleanup removes only records created by this suite.

## Backend acceptance

- Anonymous discovery returns published cart/menu information without a session, and never customer orders or private owner data.
- Two independently authenticated owners can create and edit only their own cart, menu, availability and location. Direct API requests cannot forge ownership, reassign records, or edit another owner's data.
- A customer submits pickup orders against available items at an online cart. Database prices determine totals; untrusted totals and identity fields cannot override authoritative values. Orders remain unpaid. Invalid quantities, unavailable items, offline/stale carts and mixed-cart items are rejected.
- Duplicate and concurrent order submission with the same idempotency key creates one order. Reusing a key with changed content follows the documented safe behavior.
- Only the ordering customer and relevant owner can read an order. The owner processes valid transitions; unrelated owners and customers cannot change fulfillment status. Terminal states and invalid skips are protected.
- Community sightings remain distinct from owner-controlled locations and presence. Invalid coordinates and excessive writes are rejected according to the contract.
- Missing/invalid/expired authentication and direct table writes fail safely. Public API grants and RLS cover every exposed table; privileged RPCs validate caller identity.

## Website acceptance

- Production build and static checks succeed. No secret credentials enter source, committed files, logs or browser bundles.
- Guest discovery supports search/filter, empty and error states, cart detail/menu, location/directions, and honest availability. No fabricated live cart data is presented.
- Customer authentication, order creation, confirmation and order history/status use the live backend. Duplicate-submit controls and failure recovery preserve order integrity.
- Owner sign-in, cart setup, menu CRUD, explicit location sharing, online/offline switching and incoming-order processing work against hosted data. Signing out clears access.
- Mobile browser QA runs at 320, 390 and 430 CSS pixel widths, recording screenshots and viewport metrics. Test touch targets, horizontal overflow, keyboard navigation/focus, labeled forms, validation, loading/error states, long content and navigation.
- Geolocation requires an explicit user action; denied permission has a recoverable manual path. Published location accuracy and age are understandable.
- Deployment URL serves the production build over HTTPS, auth return/reset URLs work for the configured domain, and failures do not reveal internal details.

## Evidence and release gate

Record commands, timestamps, counts, screenshots, failures, repairs and retests in `docs/test-results.md`. Fixtures and simulated geolocation are labeled as such. A successful build alone does not establish readiness. Independent review must assess security, correctness and user-visible behavior; unresolved blockers remain explicitly open.

Auth email delivery and any configured external OAuth provider require separate live verification. Admin-created test accounts can verify sign-in and authorization, but do not prove signup email delivery.
