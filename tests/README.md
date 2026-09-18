# Hosted integration checks

Run `npm ci --prefix tests`, then:

```sh
TEST_DB_HOST=aws-0-us-west-2.pooler.supabase.com TEST_DB_USER=postgres.wbbnwbkpzoggffmvnqkh node tests/live-backend.mjs
```

The suite reads the ignored root `.env` for `SUPABASE_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. It refuses any project other than the dedicated Halal Cart project. It creates four confirmed disposable Auth fixtures, signs them in through hosted GoTrue, tests REST/RPC authorization and behavior, then signs out and removes only those fixture IDs. `live-backend-results.json` contains credential-free results.

Test-only SQL setup verifies the pooler TLS certificate using `supabase-root-ca.crt`, downloaded from the [official dashboard certificate link](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt). No database credentials are used by the website.

`node tests/browser-fixtures.mjs` creates two confirmed disposable browser accounts and stores their credentials in ignored `tests/.env.browser-qa` with mode 0600. Browser journeys must use these accounts and label any cart as QA. `node tests/browser-fixtures.mjs --cleanup` removes exact fixture records, sessions and accounts; run after browser sign-out. Never leave a fake online cart in public discovery.

For the authorized human-testing handoff, `node tests/browser-fixtures.mjs --handoff` removes all public fixture data and prior sessions but retains the two disposable accounts. Their credentials move to ignored mode-0600 `tests/.env.human-testing`, never a report or Git. To remove those accounts and any subsequently created test data by exact IDs, run `node tests/browser-fixtures.mjs --cleanup-human`.

Run `node tests/check-secret-exposure.mjs --require-bundle` after a production build. It compares non-public credential values against candidate repository files and production static bundles without displaying values.

These confirmed fixtures do not establish email delivery. Human account creation follows the website's **Sign in → Create an account** flow after production SMTP and allowed auth callback URLs are configured. Use separate owner/customer accounts; sign into the owner account, open the owner dashboard, create a cart and menu, publish a real location and go online. Sign into the customer account to place an unpaid pickup order, then switch back to the owner account to process it. Do not represent these orders as paid.
