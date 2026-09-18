# Halal Cart milestones

## Current scope

Supabase preparation first, then a mobile-first Next.js website with browser testing, then Swift iOS with Xcode Simulator testing. Both clients share Supabase data and Auth. Android and Stripe implementation are out of scope. Current pass: implementation authorized on 2026-09-18; user requests autonomous delivery through at least a production-quality website ready for human testing.

The primary agent coordinates and evaluates. Separate agents implement, test, and independently review; see `AGENTS.md`.

## Status

### Browser setup resumed

- User requested another retry; main Chrome computer control is now working. Apple Developer sign-in was reopened and preserved as a handoff. Meta Business opened successfully but Facebook login is signed out; both accounts await user login/2FA. Google setup continues under the existing approval.
- Pending Vercel deployment `dpl_9ZhE68qMTYzodYtitrZyPpWvn9w7` now reports READY for `4e712dd` (application `db02c75`). Tester observed the new WhatsApp privacy disclosure at the public origin and is completing final browser smoke. Earlier initialization blocker below is historical.
- Final public-origin smoke passed: new privacy disclosure, four routes HTTP200, seven hosted disabled-state/endpoint checks, and actual Chrome guest/dialog QA at 320/390/430×844 with no overflow or application errors. Enabled WhatsApp checkout and real delivery remain untested.
- Dedicated Google OAuth client was created and connected privately to Supabase; dashboard readback shows Google enabled, Email and Apple disabled, and nonce checks retained. Audience is initially External Testing while branding/test-user setup completes; genuine sign-in verification remains in progress. No client secret was written to Git or chat.
- Hosted OAuth configuration/denial checks pass 6/6 with Google on, Email/Apple off. The production Google button is enabled. First real sign-in is prepared in Chrome but awaits action-time approval for accepting Halal Cart's own Terms/Privacy policy; this is distinct from the Google setup approval already granted. Real OAuth completion is not yet claimed.
- Google configuration is complete: one dedicated web client, exact production/localhost origins and Supabase callback, basic email/profile/openid scopes only, production branding URLs, and audience verified **In production** with no test-user restriction. Google sign-in still requires the pending genuine round-trip check before authenticated acceptance.

### WhatsApp order notifications — in progress

- User requested WhatsApp Business API integration using the base Facebook account, optional customer WhatsApp numbers, and order notifications. Scope is transactional order updates, not marketing.
- Primary coordinates a backend integration with explicit opt-in, private recipient data, recipient verification, server-held Meta credentials, queued order events, authenticated dispatch, signed delivery/opt-out webhooks, and honest disabled behavior until provider setup is complete. Implementation, testing, and evaluation remain separate.
- Computer control currently reports no connected Chrome browser, preventing the requested Apple tab reopening and Google/Facebook dashboard setup. User was asked to reconnect main Chrome. Google approval persists; Apple sign-in has not been completed.
- A business sending number is required; user was asked whether an existing Meta number or a dedicated new number is available. No personal saved number is assumed and no real WhatsApp messages have been sent.
- Implemented source includes private per-order consent, number-bound verification challenges, order-confirmed/ready/cancelled event queue, signed Meta webhook and authenticated background worker, customer withdrawal/STOP, bounded retry and unknown-outcome handling, and privacy/retention documentation. Delivery stays off and checkout hides phone collection while unavailable.
- Independent source review passed the disabled-install gate after fixes for exact retry during a feature toggle, verification-link recovery, large order lists, and worker scheduling. Hosted migration/deployment/tests are in progress; source approval is not evidence of real Meta delivery.
- Hosted migration `20260918200120` and `whatsapp-worker`/`whatsapp-webhook` are installed. Availability is false, business number null, and worker Vault secret absent; maintenance cron runs without outbound dispatch. No Meta messages have been sent.
- Verification passed: 25/25 hosted rollback-only database-role checks, 11/11 mocked-transport handler checks, 7/7 live endpoint denial/disabled-state checks, website build/typecheck and a 97-file/18-bundle secret scan. Fixtures were rolled back. These tests do not establish genuine OAuth, real Meta delivery, concurrent-worker stress behavior, or new WhatsApp mobile-browser QA; browser control remains unavailable.
- Reviewed website source is committed as `db02c75` on `web`; shared backend/contract is on `main` and `ios` at `2c6efd1`. Initial website push did not create a Vercel deployment despite later shared-branch hooks arriving. A documentation push is being used as one bounded retry; no project recreation or credential change is needed. Deployed website confirmation remains pending.
- Retry commit `4e712dd` created production deployment `dpl_9ZhE68qMTYzodYtitrZyPpWvn9w7`, but repeated bounded checks still report INITIALIZING without build logs. The previous website remains live; updated website HTTP smoke is not claimed. Backend installation/testing is complete independently of this pending website deployment.

### OAuth-only change — in progress, 2026-09-18

- User replaced email/password authentication with Google and Apple OAuth only and authorized browser setup using the base Chrome account. The previous email/SMTP handoff below is historical, not the current release target.
- Implementation agent owns app/provider configuration and dedicated Google Cloud OAuth setup. A paid Google Workspace subscription is not required for this sign-in integration.
- Separate testing and evaluation agents are checking the new flows; prior password-based results do not establish OAuth readiness. Existing identities/data must be preserved.
- Apple Developer opened in Chrome and is signed out. User sign-in/2FA and access to an enrolled developer team are prerequisites; Team ID, enabled App ID, Services ID, and signing key must then be configured. No Apple provider success is claimed.
- Dedicated Google Cloud project `halal-cart-nyc-2026` created using the base Chrome account. Consent setup prepared for Halal Cart with External audience. Initially paused at Google API Services User Data Policy acceptance; approval has since been received, but disconnected browser control prevents confirming the latest form state. No OAuth client credential or working Google sign-in is claimed yet.
- User subsequently replied "done" and clarified "for google not for apple". Google setup resumed with that approval/completion signal; implementation agent is inspecting current browser state and connecting the dedicated client. Apple remains pending, with no new Apple action authorized by this reply.
- New OAuth build/typecheck, eight focused callback/return-destination tests, and secret scan passed. Independent source review accepted after browser-back retry correction. These checks do not replace live provider round trips.
- Browser OAuth dialog and guest/callback checks passed at 320/390/430 pixels. Hosted Email provider disabled and read back; new-user signup remains enabled, anonymous sign-in disabled, existing identities/data preserved. Google and Apple remain disabled until their setup is complete.
- Hosted OAuth configuration checks passed 6/6, including rejection of direct password sign-in and preserved guest reads. Production OAuth-only source `8ba78e3` reached READY as `dpl_9xQAp1jQuYv3PcbXsKpF4x7UL97k` at https://halal-cart-app.vercel.app. Live authenticated acceptance remains blocked by provider setup, not by SMTP.
- Final deployed smoke passed all four routes, provider-only unavailable UI, guest browsing, and cancellation/missing/invalid callback cleanup/retry. Latest secret scan checked 85 files/18 bundles without a database-password match. Google consent tab is preserved as a browser handoff. Neither Google nor Apple login is complete; no production authenticated acceptance or iOS implementation is claimed.
- Production acceptance and iOS remain gated on verified website OAuth integration. Email/password removal must include hosted provider settings, not just hidden forms.

### Historical email/password handoff — superseded by OAuth-only change above

**Ready for restricted human testing:** https://halal-cart-app.vercel.app

Website source and test tools live on `web`; `main` and `ios` contain the shared backend and handoff documentation. Use `web` for local website/test commands.

- Functional smoke verified application source `fc21d24` on `web`, deployment `dpl_GfY6GLS1WPe6nCv98GsMZvadC1Nf`. Subsequent documentation-only `2d8a145` also reached production READY with unchanged application code. Next.js preset and production branch `web`; non-production builds are now skipped so shared/iOS branches do not create broken website previews.
- Final production build/typecheck pass; hosted backend 25/25; browser customer/owner ordering lifecycle; phone-width Chrome QA at 320/390/430; HTTPS deployed smoke and Auth URL configuration verified. Independent evaluation accepts this limited handoff. Full evidence: `docs/test-results.md`, `docs/independent-review.md`, `docs/deployment.md`.
- Public QA records removed: all five application tables contain zero rows. Two empty disposable test accounts remain, with zero sessions; credentials only in ignored mode-0600 `tests/.env.human-testing`. Follow `docs/human-testing.md`.
- **Production launch blocker:** custom SMTP is not configured. General public signup and genuine recovery-mail/token flows are not verified and cannot be described as ready. Keep email confirmation enabled. Configure a verified sender in the dedicated project's Auth SMTP settings, then verify signup and recovery end to end.
- Physical-device soft keyboards/GPS and browser network-fault injection were not available; desktop Chrome at phone dimensions and live backend tests are the recorded evidence.
- iOS implementation remains gated on website release acceptance; Android and Stripe remain excluded.
- A requested blocker-reminder attempt could not be completed: Reminders connector did not return and native desktop app access failed with no available window. No reminder or text was created; this is not a successful-completion alert.

### Implementation evidence — 2026-09-18

- Dedicated Supabase MCP verified with successful live `list_tables(public)` and `get_project_url` calls. Intended project confirmed; public schema initially empty.
- GitHub authentication and Vercel team access verified; dedicated deployment details are recorded in `docs/deployment.md`.
- Created and checked out `web` from the initial `main` commit. `android` remains excluded. Shared backend commits will also be retained on `main`; web source remains on `web`.
- Backend implementation agent owns schema, migrations, security rules, and shared contract. Separate testing agent owns live tests and evidence. Website implementation agent owns Next.js source. Independent evaluation is required before acceptance.
- `.env` is now ignored by backend agent's `.gitignore`; no credentials staged.
- Brand asset visually inspected: green cart icon suitable for reuse.
- Chosen checkout identity: authenticated customer account; browsing remains public. Orders remain unpaid, with payment at cart. No fees, taxes, or Stripe processing implemented.
- Shared backend and logo committed as `e3ea153`; `main`, `ios`, and current `web` include that shared base. No iOS application has been implemented. Personal agent instructions/configuration and credentials were excluded from staging.
- Hosted backend suite passed 25/25 checks using four genuine Auth sessions and scoped fixture cleanup; see `docs/test-results.md`. Independent SQL/test review found no backend blocker within tested scope. The full suite passed again with certificate verification enabled using the dashboard-provided CA. Production dependency audit reports zero advisories.
- Website independent review findings were fixed and accepted within the restricted human-testing scope; production email delivery remains open.

| Milestone | Status | Evidence / remaining work |
| --- | --- | --- |
| Repository linked | Verified | `origin` points to `https://github.com/yuyanghu06/halal-cart-app.git`; website application source through `fc21d24` is pushed on `web`, with later handoff/test-report commits. `main` and `ios` contain shared backend base `e3ea153` plus handoff documentation. Remote default branch is `web`. Historical local `android` remains untouched. |
| Discard initial implementation | Verified | Initial Swift prototype and Xcode project were moved to `/tmp/halal-cart-generated.F15m40`; they were not restored. The new website implementation is separate. |
| Brand asset generated | Reviewed and integrated | Supplied green-and-white cart asset visually inspected and reused by website implementation. |
| Supabase skill preparation | Installed and read | Official `supabase` and `supabase-postgres-best-practices` skills installed under `.agents/skills/`; relevant references must be loaded by assigned agents before implementation. |
| Project-scoped MCP configuration | Verified | Dedicated project confirmed through successful live table and project URL queries on 2026-09-18. |
| MCP browser OAuth | Verified | Previously completed OAuth now supports live project calls. |
| Shared Supabase schema and Auth | Backend verified; email dependency open | Five RLS tables/RPCs; security advisor zero findings; 25/25 hosted checks and independent SQL/test review passed. Public signup/recovery requires custom SMTP; email verification remains enabled. |
| Website implementation | Implemented; source review accepted for testing | Next.js client on `web`; guest discovery, customer pickup ordering, owner menus/presence/order management. Identified retry/account/presence issues corrected. |
| Website testing and independent evaluation | Accepted for restricted human testing | Build/typecheck, private-credential scan, guest/owner/customer journeys, identity and focus regressions, phone-width QA and final deployed smoke passed. Limits recorded above; public SMTP blocks full release acceptance. |
| Website deployment | Verified | https://halal-cart-app.vercel.app; deployed `fc21d24`, live Supabase integration and exact Auth redirects verified. |
| iOS implementation | Not started | Swift client consuming the verified shared backend; implementation agent required after web acceptance. |
| iOS testing and independent evaluation | Not started | Build and manually test guest and cart-owner workflows through Xcode Simulator/computer control. |

## Next actions

1. Restore the main Chrome computer-control connection, finish the approved dedicated Google OAuth setup, connect it to Supabase, and test a genuine production Google sign-in round trip. Google approval already exists; do not ask again for the same prepared setup.
2. After user signs in to Apple Developer with an enrolled team, configure Apple identifiers/signing key and Supabase provider; test a genuine Apple sign-in. Store secrets privately and document rotation.
3. Inspect the base Facebook account once browser access returns, identify the dedicated business sender, configure Meta credentials/approved templates/webhook and run a deliberately opted-in real delivery/STOP test. Keep WhatsApp off until verified and complete new mobile UI QA.
4. Verify authenticated customer/owner journeys under OAuth, complete physical-phone location/keyboard checks where available, and grant website acceptance only with recorded evidence. Old password fixture credentials have been retired; existing hosted identities remain preserved.
5. Begin Swift iOS after that gate using the shared backend/Auth contract. No iOS app is claimed complete. SMTP is no longer a release prerequisite for the removed email authentication flow.

## Known constraints and open dependencies

- `.env` is user-owned and must be preserved and excluded from Git. Its previously observed variable names include the public Supabase URL/key and a database password; do not record values here.
- OAuth permission requests apply to the selected organization; the MCP endpoint itself is restricted to the dedicated project.
- Web domain and exact callbacks are verified. OAuth provider configuration and iOS signing remain future dependencies; no provider login or successful iOS build is claimed.
- User requested notification if work needs input; do not represent blocked work as task completion.

## Historical preparation snapshot — before implementation on 2026-09-18

The following snapshot preserves the earlier handoff for context; the current status above supersedes it.

- Workspace: `/Users/yuyang/Documents/halal-cart-app`.
- Current branch: `ios`.
- `main`, `ios`, and `android` all point to `29344a9` (`Initialize Halal Cart app`), an empty initial commit. `web` does not yet exist.
- Remote `origin` fetch/push URL: `https://github.com/yuyanghu06/halal-cart-app.git`. Latest `git ls-remote --heads origin` returned no heads. Nothing has been pushed during this task.
- All present deliverables are untracked: `.agents/`, `.codex/`, `.env`, `AGENTS.md`, `Assets/`, `milestone.md`, and `skills-lock.json`.
- `.gitignore` is currently absent because the initial scaffold was moved aside. The future implementation agent must protect `.env` before staging anything. Do not use a blanket `git add .` first.
- Existing source assets: `Assets/halal-cart-logo.png`. No application source, package manifest, web scaffold, active Xcode project, database migrations, or automated tests remain in the workspace.
- Installed project skills: `.agents/skills/supabase/SKILL.md` and `.agents/skills/supabase-postgres-best-practices/SKILL.md`, plus their supporting references and `skills-lock.json`.
- Active repo MCP file: `.codex/config.toml`; server name `supabase_halal_cart`, Streamable HTTP URL `https://mcp.supabase.com/mcp?project_ref=wbbnwbkpzoggffmvnqkh`, OAuth auth, `required = true`, write-approval policy. `codex mcp get supabase_halal_cart` confirms the enabled HTTP configuration.
- The generic global `supabase` entry was removed. The unrelated `calendly-flow-supabase` and `internal-tooling-supabase` connections were preserved. Do not use them for this app.
- Xcode 26.6 and XcodeGen were present; an iOS 26.5 Simulator runtime with iPhone devices was listed. Chrome extension control and native Xcode computer control are available. No simulator UI test was completed.
- Supabase CLI was not installed on PATH at the time checked. No Docker/local Supabase stack was started.
- Initial prototype build failed with missing braces in SwiftUI view declarations. The attempted fix failed to apply; the whole prototype was then moved aside at user request. This is historical context, not an active build failure in the now-empty app workspace.
- Generated source backup remains at `/tmp/halal-cart-generated.F15m40`; temporary storage is not durable. The workspace logo was retained separately.
- No completion or blocker reminder has been created.

## OAuth recovery notes

The earlier assertion that a PAT was required was incorrect. The working command was:

```sh
codex mcp login supabase_halal_cart --scopes organizations:read,projects:read,database:read,database:write,analytics:read,edge_functions:read,edge_functions:write,environment:read,environment:write,storage:read,storage:write
```

It completed successfully after browser authorization. Do not repeat OAuth or request credentials unless the new session actually fails authentication. Do not copy OAuth authorization URLs, codes, or tokens into repository documentation.

## Fresh-session delivery sequence

1. Read `AGENTS.md`; act as coordinator/evaluator and assign bounded implementation, testing, and independent review tasks to separate agents.
2. Inspect the live project's existing schema/configuration before changes; confirm shared Auth and RLS requirements. Preserve any data already present.
3. Implement and test the shared hosted backend. Test owner isolation, guest visibility, server-trusted order totals, online/location behavior, menus, and order lifecycle. Document any provider configuration dependencies.
4. Build the Next.js web client on `web`, exercise customer and owner flows against the hosted backend, and perform real mobile browser QA. Review evidence and fix failures before web acceptance/deployment.
5. Build Swift iOS on `ios` using the accepted shared backend. Run Xcode and manually test in Simulator using computer control; obtain independent review.
6. Update this file with exact validation evidence, branch/commit state, deployment URLs, and blockers. Never turn incomplete functionality into a completion claim.

The final user message said “all three branches,” following an explicit cancellation of Android. Working interpretation: `main` (shared), `web`, and `ios`. Android remains excluded unless the user explicitly reinstates it.
