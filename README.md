# Halal Cart

A mobile-first Next.js website for NYC halal-cart discovery and unpaid pickup reservations. Guests can browse owner-shared locations, explore menus, and read clearly marked community sightings. Signed-in customers can order and track pickup; cart owners can manage their profile, menu, service location, availability, and incoming tickets.

## Run locally

Use Node.js 22 or newer and npm. Copy `.env.example` to `.env.local`, then set the **public** Supabase publishable key for the dedicated project. Existing local `.env` files are also supported and ignored by Git.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Hosted Supabase is used directly; do not start local Supabase or Docker. `npm run build` creates the production build and `npm start` serves it. `npm run typecheck` checks TypeScript.

## Deploy to Vercel

Import the repository's `web` branch into Vercel using the Next.js preset and repository root. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the intended environment. Never add the database password, service-role key, or secret key to a public variable or the browser.

Set Supabase Auth's site URL to the deployed HTTPS origin. Add that origin's `/auth/callback` and `http://localhost:3000/auth/callback` to its redirect allowlist. Sign-in is Google and Apple only; email/password, email signup, magic-link, and password-reset flows are removed. Configure each provider in Supabase before it is usable. The website reads provider availability from hosted Auth settings and visibly disables unavailable providers. See [OAuth deployment prerequisites](docs/deployment.md). No SMTP provider is needed for these social sign-in flows.

## Behavioral details

- OAuth uses browser PKCE: the callback explicitly exchanges the one-use code once, removes callback parameters, restores only an allowlisted local view/cart destination, and preserves guest item quantities across the full redirect. Identity and private order state remain scoped to the Supabase account. Returning with the browser Back button resets the provider buttons for another attempt. No provider client secret belongs in the website environment.

- Owner location sharing is opt-in. Automatic sharing updates about once a minute only while the owner view remains mounted; leaving the page stops updates. Browser background throttling can delay updates. Online status expires after 15 minutes without a fresh location; the last public coordinates remain visible as a last-shared location.
- “Near me” uses browser geolocation only to sort the current cart list. Owners and community reporters can enter NYC coordinates manually.
- Orders are server-priced immutable item snapshots. All payment statuses remain unpaid; customers pay the cart directly. No Stripe, card collection, platform fee, or tax computation is implemented.
- Order submission uses a per-attempt UUID and persists unresolved attempts in session storage per account/cart for safe retries after navigation or a lost response. The exact saved payload is retried. Order lists poll every 15 seconds while visible and include every active ticket plus recent terminal history.
- Owner controls are only a UI. The shared hosted database binds owners to carts, authorizes every mutation, protects private order reads, and enforces status transitions. See [the backend contract](docs/backend-contract.md).
- Maps use OpenStreetMap tiles with attribution and external Google Maps links for directions. Map requests disclose the requested map area and visitor IP to tile servers. No API key is required. Do not prefetch tiles or use this default public tile service for bulk traffic.
- No pretend carts or sample production orders are seeded. The supplied logo is a brand illustration; dish artwork uses generic icons and makes no photographic food claim.

## Verification and release notes

See [test results](docs/test-results.md), [independent review](docs/independent-review.md), [human-testing guide](docs/human-testing.md), and [milestones](milestone.md). The hosted integration runner uses isolated, clearly labeled temporary records and cleans them up. Actual Google/Apple sign-in round trips and operational limits must be verified separately from build success; disabled-provider tests are not successful OAuth evidence.

Only the website is implemented here. The iOS client must consume the same Auth/backend contract after the website passes its required evaluation. Android and payment processing are out of scope.
