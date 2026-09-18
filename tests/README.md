# OAuth-only verification

The application now supports only Google and Apple sign-in. Do not enable Email to run old fixture tests.

```sh
node --test tests/oauth.test.mjs
node tests/oauth-hosted.mjs
node tests/check-secret-exposure.mjs --require-bundle
```

`oauth.test.mjs` executes the actual `lib/oauth.ts` module in an isolated mocked browser/Auth environment. It checks return-route whitelisting, one-use callback exchange, code/error scrubbing, invalid/expired context, unavailable providers/storage, limited identity scopes and authorize-destination validation. These tests do not prove real provider login.

`oauth-hosted.mjs` reads the dedicated hosted project's public Auth settings and checks Email is disabled, its password endpoint rejects requests, only Google/Apple providers can be enabled, and guest discovery works. Add `--require-google` once configured. Results explicitly separate provider configuration from successful OAuth exchange.

The secret scan compares non-public values from ignored `.env` against candidate repository files and built `.next/static`, without printing values. Run after a production build. Tests require installed root dependencies; historical SQL tools additionally use `npm ci --prefix tests`.

## Historical evidence

`live-backend-results.json` records 25 passing hosted security/functional checks before the OAuth-only change. It is backend evidence, not current OAuth sign-in evidence. `live-backend.mjs` and `browser-fixtures.mjs` used confirmed password fixtures and now stop before fixture creation when Email is disabled. Never re-enable Email to run them.

Public fixture carts, menu items, orders and sightings were removed. Two historical identities are preserved at the coordinator's direction; their sessions were revoked. Obsolete local passwords were removed. Only IDs/roles/emails remain in ignored mode-0600 `tests/.env.historical-fixtures`; this is not a usable login credential.

Test-only SQL verifies TLS using `supabase-root-ca.crt`, downloaded from the official dashboard certificate link. No database credentials are used by the website.
