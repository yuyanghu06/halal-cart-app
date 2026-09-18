# Human testing guide

Open [Halal Cart](https://halal-cart-app.vercel.app). The current authentication model is **Google and Apple only**. Email/password sign-in, signup and recovery have been removed. Provider setup and a genuine OAuth round trip must pass before authenticated human testing is accepted; see `docs/test-results.md` for current evidence.

Use your own Google or Apple identity once that provider is enabled. Unavailable providers are honestly shown and cannot be clicked. There are no local password credentials for this flow. Historical fixture identities were preserved, their sessions revoked, and their obsolete local passwords removed. Public QA carts, menus, sightings and orders were removed; the directory starts empty.

## Accounts and real data

Browsing does not require an account. Ordering, reporting a sighting, and managing a cart require Google/Apple sign-in. Use separate provider accounts when testing customer/owner isolation. Email provider must remain disabled. SMTP is no longer the signup dependency; Google/Apple credentials, consent setup and exact callback allowlists are the relevant dependencies.

Automated test credentials are never committed. Development fixtures are disposable and must not be presented as real carts. An empty discovery page is expected until an owner registers or a user reports a sighting; no invented operating locations are seeded.

## Suggested walkthrough

1. Open discovery without signing in. Check list/map navigation, search, online filtering, and empty states. Community reports should show their age and unverified status.
2. Choose **Sign in → Continue with Google/Apple**. Complete provider sign-in in the same tab and verify the intended app view returns. Register a cart you operate, add a menu item and price, then edit the item and toggle availability.
3. Publish a service location manually or explicitly start automatic location updates. Confirm that discovery shows its location and availability. Stop automatic updates and then go offline; orders should no longer be accepted.
4. Bring the cart online for the test. In a separate customer session, open its menu, add items, enter a pickup name and note, and place an order. Confirm the total and the unpaid/pay-at-cart wording.
5. In the owner session, accept the order, mark it preparing, ready, and completed. In the customer session, verify that status updates arrive. Test cancelling a separate order before owner acceptance.
6. Verify that an unrelated provider account cannot see those orders or manage that cart. The historical backend suite verified direct API isolation before the OAuth-only change; current provider account-switch journeys still require a real OAuth round trip.
7. Repeat core navigation and forms on a phone. Check keyboard visibility, readable errors, reachable buttons, and no horizontal scrolling.
8. After testing, take the cart offline. Remove only clearly identified disposable fixtures through the test cleanup workflow; preserve real business records.

No card is charged. This release does not implement Stripe, platform fees, tax calculation, Android, or a verified-business certification process.

## Optional WhatsApp order updates

WhatsApp delivery is currently **off**. Normal pickup ordering does not require a phone number. Meta business setup, approved templates, server secrets, webhook verification and an explicitly opted-in test recipient are still required before real delivery can be tested. No notification has been sent or demonstrated.

Once enabled, opt in during checkout with your own international-format WhatsApp number. After placing the order, open the supplied WhatsApp verification link and send its exact verification command from that same number. The code expires after 30 minutes; return to your order to renew it when eligible. No order notification may send before verification. The phone is private to notification processing and is not shared with the cart owner.

Test created, ready and cancelled updates with a disposable order. Disable updates from the order, or send STOP to the business, then confirm later updates stop. Do not enter someone else's number. A failed or uncertain delivery must not change the order or imply that a message was delivered. Real recipient testing remains pending; automated transport tests use mocks only.
