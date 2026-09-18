# Halal Cart milestones

## Current scope

Supabase preparation first, then a mobile-first Next.js website with browser testing, then Swift iOS with Xcode Simulator testing. Both clients share Supabase data and Auth. Android and Stripe implementation are out of scope. Current pass: implementation authorized on 2026-09-18; user requests autonomous delivery through at least a production-quality website ready for human testing.

The primary agent coordinates and evaluates. Separate agents implement, test, and independently review; see `AGENTS.md`.

## Status

### OAuth-only change — in progress, 2026-09-18

- User replaced email/password authentication with Google and Apple OAuth only and authorized browser setup using the base Chrome account. The previous email/SMTP handoff below is historical, not the current release target.
- Implementation agent owns app/provider configuration and dedicated Google Cloud OAuth setup. A paid Google Workspace subscription is not required for this sign-in integration.
- Separate testing and evaluation agents are checking the new flows; prior password-based results do not establish OAuth readiness. Existing identities/data must be preserved.
- Apple Developer opened in Chrome and is signed out. User sign-in/2FA and access to an enrolled developer team are prerequisites; Team ID, enabled App ID, Services ID, and signing key must then be configured. No Apple provider success is claimed.
- Dedicated Google Cloud project `halal-cart-nyc-2026` created using the base Chrome account. Consent setup prepared for Halal Cart with External audience. Required Google API Services User Data Policy agreement is unchecked, pending explicit action-time approval under computer-control rules; no OAuth client credential or working Google sign-in is claimed yet.
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

1. Obtain the pending Google policy/client approval, finish the prepared dedicated OAuth client, connect it to Supabase, and test a genuine production Google sign-in round trip.
2. After user signs in to Apple Developer with an enrolled team, configure Apple identifiers/signing key and Supabase provider; test a genuine Apple sign-in. Store secrets privately and document rotation.
3. Verify authenticated customer/owner journeys under OAuth, complete physical-phone location/keyboard checks where available, and grant website acceptance only with recorded evidence. Old password fixture credentials have been retired; existing hosted identities remain preserved.
4. Begin Swift iOS after that gate using the shared backend/Auth contract. No iOS app is claimed complete. SMTP is no longer a release prerequisite for the removed email authentication flow.

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
