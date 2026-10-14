# Progress

Tick items off as they are done. Every milestone ends with tests passing, a Vercel preview link and a short plain-English report (rule 2.13).

**Current milestone:** P0 built, P1 in progress

## Milestones (kit section 13)

### P0 Setup
- [x] Split the kit into project files (kit section 0)
- [x] Scaffold Next.js in a temporary folder, then move it in (`create-next-app` refuses a non-empty folder)
- [x] Add `site.config.ts`
- [x] Add `.claude/settings.json`, `.gitignore` and `.env.example`
- [x] Add GitHub Actions to run lint, tests and build
- [x] Tests passing
- [ ] Vercel preview link (founder imports the repo into Vercel, then it appears on the pull request)
- [ ] Plain-English report

### P1 Login and database
- [ ] Supabase migrations
- [ ] Row Level Security and its tests
- [ ] Magic-link login
- [ ] Profiles
- [ ] Account deletion and data export
- [ ] Tests passing, Vercel preview link, plain-English report

### P2 Content engine
- [ ] Case schema and `content:check`
- [ ] 5 draft cases, including the free starter
- [ ] The drills generator
- [ ] `/cases` and `/drills` pages
- [ ] Tests passing, Vercel preview link, plain-English report

### P3 AI interviewer
- [ ] Session stages, exhibit reveals, maths checks, debrief scoring, limits and usage logging
- [ ] The free starter case works from start to finish
- [ ] **Report the estimated cost per session** to the founder
- [ ] Tests passing, Vercel preview link, plain-English report

### P4 Payments
- [ ] Stripe test mode, checkout for both plans
- [ ] Webhooks and entitlements
- [ ] Customer Portal
- [ ] Paywall states
- [ ] A pass that extends correctly when bought again
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
- [ ] **7. Support email:** a separate inbox just for this site.
- [ ] **8. Case reviewer (recommended):** someone with consulting experience to check the 20 launch cases before they go live.
- [ ] **9. Never paste secret keys into any chat.** Add them yourself in Vercel and `.env.local` (or, in a cloud session, the environment settings).
