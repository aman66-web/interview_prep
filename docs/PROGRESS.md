# Progress

Tick items off as they are done. Every milestone ends with tests passing, a Vercel preview link and a short plain-English report (rule 2.13).

**Current milestone:** P0, P1 and P2 built. Still open from P1: the Supabase project and a real sign-in test (see Handoff).

## Handoff (14 Oct 2026)

Read this first in a new session.

- **Vercel is done, apart from settings.** Project `interview-prep` (id `prj_rHyF4UXcRyr0HdTrS25EoRe9DrhT`, Hobby plan, personal account) is linked to the GitHub repo. The PR branch built successfully. Preview: `https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app`. Vercel Authentication is on, so only the founder (logged in to Vercel) can open it. Vercel labelled that first deployment "production"; nothing is public. The only environment variable set so far is `SHOW_DRAFT_CONTENT=1` for **Preview** (so draft cases can be reviewed on previews; never for Production). The Supabase variables are not set yet.
- **Supabase is not started.** The founder's first Supabase account (org "Aman's Org") already has menumacros, drone-test-prep (both live) and cscs-test-app (paused). **Do not touch those three.** The founder is using his second Supabase account instead (2 free project slots). The Supabase connector must be connected to that second account (claude.ai, Customize, Connectors) and a session started afterwards. **On 14 Oct a follow-up session (`session_01KDMgSC6YrKmbrpLCMhbG3o`) still saw only "Aman's Org", so the reconnect had not taken effect.** The founder needs to Disconnect Supabase there, sign out of supabase.com, sign in to the second account, Connect again and choose that account's organisation. Check that `list_organizations` shows the second account before doing anything.
- **Founder's earlier yes (rule 2.6), given in the previous session:** create the Supabase project, apply `supabase/migrations/*`, run `supabase/tests/rls.sql` (it rolls itself back), set Auth URL configuration and the two email templates from `docs/SETUP.md`, add the Vercel environment variables (Production and Preview), redeploy, and test a real sign-in with his own email. Because this is a new session, confirm with him in one line before the first change, and tell him the exact Supabase cost before creating the project.
- **Keys (rule 2.5):** the Supabase URL and publishable key can go straight to Vercel without appearing in chat. The secret key (`SUPABASE_SECRET_KEY`) must not pass through chat: if the connector cannot place it directly, the founder pastes it into Vercel himself, marked Sensitive.
- **Still the founder's:** paying for any Supabase upgrade, choosing an email-sending service for real students (and the domain it needs), Vercel Pro before payments.
- PR: https://github.com/aman66-web/interview_prep/pull/1 (CI green on the P0 + P1 commit).

## Milestones (kit section 13)

### P0 Setup
- [x] Split the kit into project files (kit section 0)
- [x] Scaffold Next.js in a temporary folder, then move it in (`create-next-app` refuses a non-empty folder)
- [x] Add `site.config.ts`
- [x] Add `.claude/settings.json`, `.gitignore` and `.env.example`
- [x] Add GitHub Actions to run lint, tests and build
- [x] Tests passing
- [x] Vercel project created and linked; preview builds on every push
- [x] Plain-English report

### P1 Login and database
- [x] Supabase migrations (`supabase/migrations/`, all 11 tables from kit section 9)
- [x] Row Level Security and its tests (`supabase/tests/rls.sql`, run by `npm test`)
- [x] Magic-link login (link plus 6-digit code; `/login`, `/auth/confirm`, `/auth/continue`)
- [x] Profiles (created automatically on signup)
- [x] Account deletion and data export (`/app/account`)
- [x] Tests passing (48), including a browser run of the whole login flow against a fake Supabase
- [ ] Founder: create the Supabase project, add the keys, apply the migration (`docs/SETUP.md`)
- [ ] Test a real sign-in email end to end (needs the project above; confirms the email template)
- [ ] Vercel preview link
- [ ] Plain-English report

### P2 Content engine
- [x] Case schema and `content:check` (validates the format, recomputes every maths answer and exhibit number; proven to catch mistakes)
- [x] 5 draft cases, including the free starter (profitability, market entry, market sizing, pricing, growth). **All are drafts until a person with consulting experience reads them.**
- [x] The drills generator: 240 mental-maths and 60 chart-reading drills by code, plus 12 market-sizing and 16 framework drills written by hand (328 in total)
- [x] `/cases`, `/cases/[slug]`, `/drills`, `/drills/[category]`, and a placeholder `/pricing`
- [x] Tests passing (147), browser test of every new screen, no answer key in any page's HTML
- [ ] Founder or a paid reviewer reads the 5 draft cases on the preview site and marks them reviewed (or asks for changes)
- [ ] Vercel preview link and plain-English report

### P3 AI interviewer
- [ ] Session stages, exhibit reveals, maths checks, debrief scoring, limits and usage logging
- [ ] The free starter case works from start to finish
- [ ] Debrief page reads `math_checks` with the admin client after the session finishes; browsers cannot read that table because it holds answer keys
- [ ] **Report the estimated cost per session** to the founder
- [ ] Tests passing, Vercel preview link, plain-English report

### P4 Payments
- [ ] Stripe test mode, checkout for both plans
- [ ] Webhooks and entitlements
- [ ] Customer Portal
- [ ] Paywall states
- [ ] A pass that extends correctly when bought again
- [ ] Account deletion (`app/app/account/actions.ts`) must first cancel the user's Stripe subscription and delete or anonymise the Stripe customer
- [ ] Add a check on `entitlements.status` once the Stripe states are known (the P1 migration leaves it free text)
- [ ] Tests passing, Vercel preview link, plain-English report

### P5 Content and search
- [ ] 20 cases ready for review
- [ ] Case-type guides
- [ ] Firm guides (verified facts only)
- [ ] Free tools
- [ ] Sitemap, metadata and OG images
- [ ] Tests passing, Vercel preview link, plain-English report

### P6 Polish
- [ ] Dashboard and progress
- [ ] Share card
- [ ] Universities page and leads
- [ ] Admin page
- [ ] Retention cron
- [ ] Legal pages (drafts for the founder to review)
- [ ] Tests passing, Vercel preview link, plain-English report

### P7 Launch checklist
- Founder:
  - [ ] Vercel Pro
  - [ ] Custom domain
  - [ ] Stripe live mode
  - [ ] A real test purchase **and** refund
  - [ ] An Anthropic monthly spend limit
  - [ ] A final read of the legal pages
  - [ ] Real email sending connected to Supabase (its built-in sender only reaches your own team) and CAPTCHA switched on for sign-in (`docs/SETUP.md`)
- Claude Code:
  - [ ] Check every funnel event fires

### Phase 2: data/SQL track (only after a "Go" at day 30)
- [ ] SQL practice that runs in the browser (DuckDB-WASM or sql.js) on small invented datasets; no code runs on the server
- [ ] AI interviewer modes for product-sense and metrics questions
- [ ] Same entitlements: one subscription unlocks both tracks
- [ ] Later: Python practice through Pyodide

### Phase 3 (only if usage justifies the cost)
- [ ] Voice interviewer (speech-to-text plus text-to-speech)

## Founder checklist (kit section 14, Aman)

Claude Code: give click-by-click steps whenever he asks.

- [ ] **1. Brand:** pick a name and domain. Check the domain is free and the name isn't someone else's trademark. Tell Claude Code so it can update `site.config.ts`.
- [ ] **2. GitHub:** create a new private repo, add the kit and open it with Claude Code.
- [ ] **3. Supabase:** the free plan allows 2 active projects and you already have 2 (menumacros and drone-test-prep). Either pause one or upgrade to Pro (about $25 a month) before creating this project.
- [ ] **4. Vercel:** import the repo.
  - [ ] Add the environment variables for Production and Preview, and mark the secret ones "Sensitive".
  - [ ] Move to the Pro plan before taking real payments.
- [ ] **5. Stripe (UK account):**
  - [ ] Create both products in test mode, then add the webhook endpoint.
  - [ ] Decide on Stripe Tax with an accountant.
  - [ ] Switch to live mode only at P7.
- [ ] **6. Anthropic:** create an API key in the console and set a monthly spend limit.
- [ ] **6b. Email sending for login:** Supabase's built-in sender only emails your own team. Pick an email service (needs your approval) before real students sign up. See `docs/SETUP.md`.
- [ ] **7. Support email:** a separate inbox just for this site.
- [ ] **8. Case reviewer (recommended):** someone with consulting experience to check the 20 launch cases before they go live.
- [ ] **9. Never paste secret keys into any chat.** Add them yourself in Vercel and `.env.local` (or, in a cloud session, the environment settings).
