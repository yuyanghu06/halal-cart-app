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

## Open verification

Website checks, mobile browser journeys, production deployment smoke test and independent evaluation remain pending.

Dependency security check: `npm audit --omit=dev --json` exited 0, with zero reported vulnerabilities in production dependencies on 2026-09-18. This advisory scan is not a comprehensive security audit.
