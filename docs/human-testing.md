# Human testing guide

Open [Halal Cart](https://halal-cart-app.vercel.app). The production source `fc21d24` passed the recorded local/mobile and deployed smoke checks. This is a restricted human-testing candidate: general public signup and password recovery remain blocked on production email delivery.

Two empty test accounts are available in the local, ignored `tests/.env.human-testing` file (owner and customer). The file is readable only by the local user and is not published to GitHub or Vercel. Use those credentials to sign in while SMTP is configured. Public QA carts, menus, sightings and orders were removed; the clean directory starts empty.

## Accounts and real data

Browsing does not require an account. Ordering, reporting a sighting, and managing a cart require sign-in. Use separate customer and owner accounts when testing ownership boundaries. Email confirmation must remain enabled. Public sign-up and password recovery need the mail-delivery dependency in `docs/release-acceptance.md` resolved first.

Automated test credentials are never committed. Development fixtures are disposable and must not be presented as real carts. An empty discovery page is expected until an owner registers or a user reports a sighting; no invented operating locations are seeded.

## Suggested walkthrough

1. Open discovery without signing in. Check list/map navigation, search, online filtering, and empty states. Community reports should show their age and unverified status.
2. Sign in as an owner. Register a cart you operate, add a menu item and price, then edit the item and toggle availability.
3. Publish a service location manually or explicitly start automatic location updates. Confirm that discovery shows its location and availability. Stop automatic updates and then go offline; orders should no longer be accepted.
4. Bring the cart online for the test. In a separate customer session, open its menu, add items, enter a pickup name and note, and place an order. Confirm the total and the unpaid/pay-at-cart wording.
5. In the owner session, accept the order, mark it preparing, ready, and completed. In the customer session, verify that status updates arrive. Test cancelling a separate order before owner acceptance.
6. Verify that an unrelated signed-in account cannot see those orders or manage that cart. The automated backend suite covers direct API attempts as well.
7. Repeat core navigation and forms on a phone. Check keyboard visibility, readable errors, reachable buttons, and no horizontal scrolling.
8. After testing, take the cart offline. Remove only clearly identified disposable fixtures through the test cleanup workflow; preserve real business records.

No card is charged. This release does not implement Stripe, platform fees, tax calculation, Android, or a verified-business certification process.
