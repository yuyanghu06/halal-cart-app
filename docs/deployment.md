# Website deployment

Status: production Next.js website deployed September 18, 2026. Public root route independently verified in Chrome by the coordinator after the final deployment. The testing agent records hosted HTTPS functional smoke and fixture cleanup in `test-results.md`.

- Public URL: https://halal-cart-app.vercel.app
- Vercel project: `halal-cart-app` / `prj_yaEQUwwlgvjbvWlUnRM6lPnS73Gm`
- Vercel team: `team_sIVk8dkyqMJIRQ2e4uTa4w0O`
- Production deployment: `dpl_GfY6GLS1WPe6nCv98GsMZvadC1Nf`
- Inspector: https://vercel.com/yuyanghu06s-projects/halal-cart-app/GfY6GLS1WPe6nCv98GsMZvadC1Nf
- Deployed application source: `fc21d243e25d93a73c125308d47e43c8507cfc5c`
- Source repository: https://github.com/yuyanghu06/halal-cart-app
- GitHub default branch and Vercel production branch: `web`
- Framework preset: Next.js. Root directory: repository root. Node runtime: 24.x. Default Next.js build/output behavior, no static-export override.

## Configuration verified

The project has exactly two application environment variables, scoped to Production: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Their values point to the dedicated Halal Cart backend. No database password, service-role key, or secret Supabase API key was configured in Vercel. A temporary file containing only those two public values was used for preparation and removed after configuration.

Supabase project `wbbnwbkpzoggffmvnqkh` Auth URL configuration was saved and then read back in the dashboard:

- Site URL: `https://halal-cart-app.vercel.app`
- Redirect URL: `https://halal-cart-app.vercel.app/auth/callback`
- Redirect URL: `http://localhost:3000/auth/callback`
- Exactly two redirect URLs; no broad wildcard or unrelated preview origins.

Email confirmation remains enabled. OAuth remains unconfigured and is not advertised by the app. Custom SMTP remains off; unrestricted production signup/confirmation/password-reset delivery requires a verified sender and mail provider configuration. Existing confirmed human-test accounts can use password sign-in. Do not describe default mail-provider behavior as verified broad production email delivery.

## Deployment verification and recovery

Vercel reported the final deployment `READY`, target `production`, source branch `web`, and the exact source SHA above. The public alias was independently opened in Chrome and rendered the app with hosted directory data and active sign-in controls. This closes an earlier packaging failure: the repository-link tool initially chose `main` and framework `Other`, so an intermediate deployment built but returned a Vercel 404. Production tracking was corrected to `web`, framework preset to Next.js, and the final source was deployed under those settings. The earlier two deployments are not known-good rollback targets.

For future releases, push reviewed website changes to `web`, then verify the deployment state, public root route, hosted directory request, and authenticated critical paths. A successful build alone is not release verification. Keep shared backend migrations coordinated with `main` and the eventual iOS client.

Only the dedicated Halal Cart Vercel project and dedicated Halal Cart Supabase Auth URLs were changed during website deployment. No unrelated projects, access protections, credentials, billing plans, or provider settings were modified.
