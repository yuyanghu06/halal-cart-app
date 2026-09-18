# Shared hosted backend contract

Project: `wbbnwbkpzoggffmvnqkh`. All writes require a permanent Supabase Auth user. Browse without sign-in; checkout and community reports require sign-in. Web sign-in uses Google or Apple OAuth only. The Email provider is disabled; password, email signup, magic-link and reset UI are removed. Existing Auth identities and application data are preserved; iOS shares Auth users, not browser sessions. Provider availability is read from hosted public Auth settings and unavailable buttons remain disabled with an explicit explanation. Configure web `/auth/callback` and eventual iOS deep-link in Supabase Auth redirect allowlist before enabling OAuth. Never put service-role keys in clients.

## Read API

- `carts`: id, owner_id, name, description, cuisine, address, latitude, longitude, is_online, location_updated_at, created_at, updated_at. Public. One cart per owner. Owner identity is bound in the database; it is self-registered, not platform-verified. `is_online` is effective only if location_updated_at > now minus 15 minutes; clients must label stale carts offline. Coordinates can be null before first owner location publication.
- `menu_items`: id, cart_id, name, description, price_cents, category, is_available, sort_order, created_at, updated_at. Public (including unavailable items); filter availability for checkout.
- `sightings`: id, submitted_by, name, address, latitude, longitude, notes, created_at. Public unverified community reports, never an owner's live location. Display timestamp and do not imply availability.
- `orders`: id, cart_id, customer_id, status, total_cents, payment_status (always unpaid), pickup_name, notes, idempotency_key, created_at, updated_at. Only customer or cart owner can read.
- `order_items`: id, order_id, menu_item_id, name, unit_price_cents, quantity. Immutable snapshot, same read permission as order. Use orders select `*,order_items(*)`.

## Mutation RPCs

All arguments named exactly as below. UUID result fields are JSON strings. Return values are JSON objects matching the relevant table row.

- `save_cart(p_name text, p_description text, p_cuisine text, p_address text)` creates or updates the caller's single cart. Returns cart.
- `set_cart_presence(p_cart_id uuid, p_is_online boolean, p_latitude double precision default null, p_longitude double precision default null, p_address text default null)` returns cart. Online requires valid NYC coordinates. Automatic location updates must be explicitly enabled by owner; call this periodically only while consent active. Offline retains last location.
- `save_menu_item(p_cart_id uuid, p_name text, p_description text, p_price_cents integer, p_category text, p_is_available boolean, p_sort_order integer default 0, p_item_id uuid default null)` returns item. Editing must supply p_item_id; no destructive deletion, use unavailable.
- `submit_sighting(p_name text, p_address text, p_latitude double precision, p_longitude double precision, p_notes text default '')` returns sighting. Limit 10 per user/hour.
- `place_order(p_cart_id uuid, p_items jsonb, p_pickup_name text, p_notes text, p_idempotency_key uuid)` returns order. p_items is `[{"menu_item_id":"uuid","quantity":1}]`, 1–20 distinct lines, quantity 1–20. Server takes price/name from current available menu, checks fresh online cart, totals in integer cents, snapshots lines atomically. Use a fresh UUID per intentional order and reuse on network retries. Reusing a key with changed payload fails. Max 10 orders/hour/customer. Payment remains unpaid; collect at cart. No fees/tax/card integration.
- `transition_order(p_order_id uuid, p_status text)` returns order. Owner: pending→accepted/rejected, accepted→preparing/cancelled, preparing→ready/cancelled, ready→completed. Customer: pending→cancelled only. Repeating current status is idempotent. No other updates allowed.

Direct writes to tables are denied to all API clients. RLS protects reads; private security-definer implementations enforce ownership, limits and transitions and are exposed only through security-invoker RPC wrappers with explicit authenticated EXECUTE grants and fixed empty search_path. No user_metadata authorization.

No sample carts are seeded or represented as real locations. Authentication provider configuration and actual OAuth round trips must be verified separately; provider-disabled behavior is not successful sign-in evidence.

## Deployment verification (2026-09-18)

Initial migration applied successfully using the dedicated project-scoped MCP. PostgreSQL 17.6. All five tables have RLS enabled, explicit read-only client grants; public wrappers are security invoker, private mutators validate permanent Auth identity and ownership. Security/performance advisors run after migration; independent hosted integration tests are recorded separately in docs/test-results.md.

Current auth direction (supersedes the initial email-based test setup): Google/Apple OAuth only. Email provider disabled by explicit user request; new-user signup remains enabled for OAuth, anonymous sign-in remains off, existing accounts/data are not deleted. Google and Apple provider configuration is tracked in docs/deployment.md. SMTP is no longer a release dependency for website sign-in. Earlier password-based integration tests remain historical authorization evidence, not evidence of the current sign-in UX. Production Site URL and allowed callback URLs remain the exact deployed web origin and localhost callback.

`orders.request_payload` stores the original request solely for idempotency matching and is visible only to the same RLS-authorized order participants. RPC responses omit this field. No location history is stored for owners: only their latest explicitly published cart location. User deletion and business deletion need an explicit retention/admin process because order history has restrictive foreign keys.

Migration history alignment: CLI-generated local migration filenames were renamed to the actual hosted MCP migration versions (`20260918165054`, `20260918165156`) immediately after application; SQL content was preserved, schema was not reapplied. This prevents later CLI deployments from considering the migrations unapplied. The second migration revokes API-role execution of the pre-existing platform bootstrap `rls_auto_enable()` event trigger (conditional so clean environments without it remain supported). Final security advisor result: zero findings. Performance advisor shows only expected unused indexes before traffic/tests; indexes retained for FK/RLS and recent-order access patterns.

## OAuth session contract

The website uses `@supabase/supabase-js` PKCE with automatic callback detection disabled and an explicit, deduplicated `exchangeCodeForSession` call in `/auth/callback`. Codes and provider error parameters are removed from the address bar before rendering. Return intent is kept in same-tab session storage for at most one hour and reconstructed from the known view enum and a cart UUID; arbitrary `next` destinations are ignored. User-facing errors are generic and do not echo tokens or provider response details. Guest bag storage contains only item IDs and quantities; saved unresolved order payloads remain account-scoped.

Google requests only `openid email profile`; Apple requests `name email`. Provider-verified identities feed the same Supabase Auth UUID and unchanged RLS/RPC authorization. Apple private relay email can produce a separate identity from an existing email account; do not manually merge or transfer carts/orders based solely on client-supplied email.
