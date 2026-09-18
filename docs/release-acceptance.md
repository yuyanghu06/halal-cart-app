# Website release acceptance

The current user instruction authorizes autonomous implementation and deployment through a production-quality website ready for human testing. Earlier documentation-only scope is superseded. The website remains a release candidate until the evidence below passes; iOS implementation must wait for website acceptance.

## Required experience

Guest visitors can discover owner-published NYC carts and inspect menus and directions without accounts. Community sightings are labeled unverified and timestamped. Empty data is presented honestly. An owner account can register its own cart but cannot claim another account's cart. Owner registration is not platform verification.

Customers authenticate to place pickup orders. Prices and availability are checked in the database, retries do not duplicate orders, and customers see order status. Payment is due at the cart; the application never implies online payment or adds unapproved fees or taxes.

Owners explicitly start location sharing and can stop it or go offline. A stale location stops accepting orders. Owner menu changes and incoming order transitions persist to the hosted project. Ownership is enforced by the backend, not a client display mode.

## Verification gate

- Hosted security/functional suite passes with isolated fixture identities and recorded cleanup.
- Production build and relevant static checks pass.
- Browser customer and owner journeys pass against the hosted backend at narrow and wide phone widths, including form validation, overflow, keyboard access and errors.
- Independent evaluation reviews authorization, order integrity, session handling, user-visible behavior and deployment readiness. Findings are fixed and retested.
- Deployed HTTPS URL is verified with the intended build and configured Auth redirects.
- Signup and recovery email delivery are verified or explicitly recorded as a release blocker. Test-fixture login cannot substitute for this check.

## Known deployment dependency

2026-09-18 dashboard inspection: email/password enabled, email confirmation enabled, anonymous sign-in disabled, external OAuth providers disabled, custom SMTP disabled. Supabase's default mail service restricts recipients to project-team addresses and is not intended for production. Keep verification enabled. General public signup/recovery requires a configured mail provider; see [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).

Implementation and tests should proceed independently of that dependency. Do not label the release production-ready while it remains unresolved.
