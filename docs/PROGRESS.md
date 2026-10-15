# Progress

Tick items off as they are done. Every milestone ends with tests passing, a Vercel preview link and a short plain-English report (rule 2.13).

**Current milestone:** P0 to P6 built (new design across the whole site, 20 draft cases, guides, tools, dashboard, admin, share card, clean-up job). The Supabase project is up and its tables are locked down. Still open (founder): the sign-in settings and secret key (see Handoff), an Anthropic key, Stripe test keys, and the new Vercel settings `CRON_SECRET`, `ADMIN_EMAILS` and `NEXT_PUBLIC_SUPPORT_EMAIL` (`docs/SETUP.md` section 3). Then a real sign-in test, a real interview and a real test-mode purchase.

## Handoff (14 Oct 2026)

Read this first in a new session.

- **Vercel is done, apart from settings.** Project `interview-prep` (id `prj_rHyF4UXcRyr0HdTrS25EoRe9DrhT`, Hobby plan, personal account) is linked to the GitHub repo. The PR branch built successfully. Preview: `https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app`. Vercel Authentication is on, so only the founder (logged in to Vercel) can open it. Vercel labelled that first deployment "production"; nothing is public. Environment variables set: `SHOW_DRAFT_CONTENT=1` for **Preview** only (so draft cases can be reviewed on previews; never for Production), and `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview. Still missing: `SUPABASE_SECRET_KEY` (founder), `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`, `CRON_SECRET` (without it the daily transcript clean-up refuses to run, so the 365-day promise is not kept), `ADMIN_EMAILS` (to open `/admin`) and `NEXT_PUBLIC_SUPPORT_EMAIL`.
- **Supabase project exists (14 Oct 2026).** Second account, organisation "aman662002@gmail.com's Org" (Free plan, $0). Project `interview-prep`, ref `jkvnarskslswdwrdzefa`, London (`eu-west-2`), URL `https://jkvnarskslswdwrdzefa.supabase.co`. The first account (menumacros, drone-test-prep, cscs-test-app) was never touched.
  - **Done with the founder's go ("try supabase now"):** created the project; applied the three files in `supabase/migrations/` in order; checked the real database with read-only queries (11 tables, all with Row Level Security and a policy, `anon` has no table access, `authenticated` has only the intended grants, the two interview functions and `handle_new_user` are not callable from browsers, the sign-up trigger exists); the security advisor returns no findings; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` added to Vercel (Production and Preview).
  - **`supabase/tests/rls.sql` could not be run through the connector:** it timed out after 60 s (scripts containing `delete` also stalled on the other project) and left nothing behind (checked). The same script passes on a local Postgres and in CI against the same migration files. The founder can also paste it into the Supabase SQL Editor for a belt-and-braces run.
  - **The connector cannot do these, so the founder does them in the dashboard (click-by-click in `docs/SETUP.md`):** Authentication, URL Configuration (Site URL and Redirect URLs); the Magic Link and Confirm sign up email templates; and adding `SUPABASE_SECRET_KEY` to Vercel himself (Sensitive, Production and Preview). The session's `api.supabase.com` connection returned "upstream auth failed", so the Management API was not usable either (not worked around).
  - **Then:** push (or redeploy) so the new variables reach a build, and test a real sign-in. **The built-in Supabase email sender only sends to members of the Supabase organisation**, which for this account is `aman662002@gmail.com`; test with that address (or invite another address to the organisation first).
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
- [x] Supabase project created and migrations applied (14 Oct, see Handoff); public keys in Vercel
- [ ] Founder: Auth URL configuration, the two email templates and `SUPABASE_SECRET_KEY` in Vercel (`docs/SETUP.md`)
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
- [x] Session stages, exhibit reveals, maths checks, debrief scoring, limits and usage logging (`lib/ai/`; every model call goes through it, and only `lib/ai/llm-anthropic.ts` imports the SDK)
- [x] The free starter case works from start to finish: `/app/start/[slug]`, `/app/interview/[id]` (chat, stage bar, exhibits, notes, calculator, timer), `/app/debrief/[id]`. Proven in a browser against a fake model; **not yet run with a real model**
- [x] The debrief stores its maths results inside `case_sessions.scores` when the interview finishes, so the debrief page reads only that and `math_checks` (which holds answer keys) is never readable by browsers
- [x] **Estimated cost per session reported** (see below)
- [x] Tests passing, browser test passing
- [ ] Founder: Anthropic key and monthly spend limit, then set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` (a model ID such as `claude-sonnet-5-5`) in Vercel
- [ ] First real run with a real model: read the transcript and debrief of the free starter case and tune the prompts in `lib/ai/prompt.ts` if needed
- [ ] Vercel preview link and plain-English report

**Cost estimate (14 Oct 2026, from `lib/ai/pricing.ts`, prices per million tokens; prompt caching on).** A typical 20-turn interview with the debrief, then the 40-turn limit with long answers:

| Model | Typical session | Long session (40 turns) | 60 typical sessions in a month (the plan's limit) |
|---|---|---|---|
| `claude-sonnet-5-5` ($2 in / $10 out) | about $0.12 | about $0.37 | about $7.00 (18% of $39) |
| `claude-opus-5-5` ($4 / $20) | about $0.23 | about $0.73 | about $14 (36%) |
| `claude-haiku-5-5` ($0.10 / $0.50) | under $0.01 | about $0.02 | about $0.35 (1%) |

Recommendation: start with `claude-sonnet-5-5`. A real student doing 10 to 15 interviews a month would cost about $1.20 to $1.75. The hard caps are 3 a day, 60 a month, 40 turns, 2,000 characters a message and 900,000 tokens per session. Prices are our own table (check `lib/ai/pricing.ts` against Anthropic's price page before launch); Anthropic's invoice is the source of truth.

### P4 Payments
- [x] Stripe checkout for both plans (`/api/stripe/checkout`; Monthly $39 subscription, 90-Day Pass $99 one-time; the price is created inline unless `STRIPE_PRICE_*` are set). Built on Stripe's REST API with no extra package; everything is in `lib/stripe/`
- [x] Webhooks and entitlements (`/api/stripe/webhook`: signature checked, 5-minute replay window, each event recorded once; subscription messages are never trusted for their content, the code asks Stripe for the subscription's current state)
- [x] Customer Portal (`/api/stripe/portal`, "Manage billing" on the account page)
- [x] Paywall states: pricing page with notices, account page plan and billing, a ready-to-go "Add 90 more days" link
- [x] A pass that extends correctly when bought again (database function `grant_pass_purchase`, each checkout counted once; a full refund takes its 90 days back once)
- [x] Account deletion deletes the Stripe customer first (which cancels any subscription); if Stripe cannot be reached nothing is deleted
- [x] Check on `entitlements.status` (Stripe's subscription states plus `refunded`)
- [x] After paying, the page they land on (`/api/stripe/return`) asks Stripe and switches the plan on at once, so access never depends on webhook timing
- [x] Tests: 269 unit and database tests, and a browser run with a pretend Stripe (74 checks: buying, extending, refunds, forged and replayed webhooks, other people's checkouts, the billing portal, deleting an account). **Not yet run with the real Stripe.** Migration `20261014170000_payments.sql` applied to the real Supabase project (14 Oct); functions are server-only and the security advisor is clean
- [ ] Founder: Stripe test keys and the webhook (`docs/SETUP.md` section 2c), then one real test-mode purchase with the test card
- [ ] Decide on Stripe Tax with an accountant (`stripeTaxEnabled` in `site.config.ts` is off)
- [ ] Vercel preview link and plain-English report

### P5 Content and search
- [x] 20 cases written (case-001 to case-020: profitability, market entry, market sizing, M&A, pricing, growth, operations), every number recomputed by tests. **All drafts until a person with consulting experience reads them**
- [x] Case-type guides: 10 guides (the seven case types plus structuring, case maths and practising alone), every worked number recomputed by tests; a 60-term glossary
- [x] Firm guides (verified facts only): Bain and BCG from their own careers pages (checked 15 Oct 2026). McKinsey is hidden: its site could not be reached, see `docs/RESEARCH_TODO.md`
- [x] Free tools: market sizing, break-even, mental maths trainer, growth rate (`/tools`)
- [x] Sitemap, robots, page titles and descriptions, structured data, default and per-score share images
- [x] Tests passing (725 unit tests, database security checks in CI, four browser suites), Vercel preview link and plain-English report (15 Oct 2026)

### P6 Polish
- [x] New design across the whole site (light and dark, phone first; rules in `docs/DESIGN.md`)
- [x] Dashboard and progress (skill scores, recent interviews, recommended next step)
- [x] Share card (signed link with scores only; a first name only if the person types one)
- [x] Universities page and leads (`/for-universities`, `/api/leads`)
- [x] Admin page (`/admin`, only for `ADMIN_EMAILS`): funnel, AI cost, enquiries
- [x] Retention cron (`/api/cron/cleanup`, daily via `vercel.json`; needs `CRON_SECRET` in Vercel)
- [x] Legal pages (drafts for the founder to review): terms, privacy, refunds, disclaimer, plus about and FAQ
- [x] Tests passing (725 unit tests, database security checks in CI, four browser suites), Vercel preview link and plain-English report (15 Oct 2026)

### P7 Launch checklist
- Founder:
  - [ ] Vercel Pro
  - [ ] Custom domain
  - [ ] Stripe live mode
  - [ ] A real test purchase **and** refund
  - [ ] An Anthropic monthly spend limit
  - [ ] A final read of the legal pages, and fill in their square-bracket placeholders (company name, address, effective date, minimum age)
  - [ ] A lawyer checks the refund policy (7 days, 2 or fewer interviews) against the UK 14-day right to cancel, and the wording of the "start straight away" tick box before checkout
  - [ ] `CRON_SECRET`, `ADMIN_EMAILS` and `NEXT_PUBLIC_SUPPORT_EMAIL` set in Vercel (Production), then check the daily clean-up has run successfully (Vercel, project, Cron Jobs)
  - [ ] Approve the About and FAQ pages (fill in their square-bracket notes, then set `"status": "approved"`). Until then they show a draft notice and are left out of Google and the sitemap
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

- [ ] **1. Brand:** name chosen: **CaseSpar** (14 Oct 2026; `site.config.ts` updated). casespar.com was free at $11.25 a year on 14 Oct; the founder buys it. A web search found no product with this name, but that is not a trademark check: check the UK and US trademark registers before launch.
- [ ] **2. GitHub:** create a new private repo, add the kit and open it with Claude Code.
- [x] **3. Supabase:** done on 14 Oct using the second account (free plan, $0): project `interview-prep` in London.
- [ ] **4. Vercel:** import the repo.
  - [ ] Add the environment variables for Production and Preview, and mark the secret ones "Sensitive".
  - [ ] Move to the Pro plan before taking real payments.
- [ ] **5. Stripe (UK account):**
  - [ ] Test keys and webhook (`docs/SETUP.md` section 2c). No products needed: checkout creates the prices.
  - [ ] Decide on Stripe Tax with an accountant.
  - [ ] Switch to live mode only at P7.
- [ ] **6. Anthropic:** create an API key in the console and set a monthly spend limit.
- [ ] **6b. Email sending for login:** Supabase's built-in sender only emails your own team. Pick an email service (needs your approval) before real students sign up. See `docs/SETUP.md`.
- [ ] **7. Support email:** a separate inbox just for this site.
- [ ] **8. Case reviewer (recommended):** someone with consulting experience to check the 20 launch cases before they go live.
- [ ] **9. Never paste secret keys into any chat.** Add them yourself in Vercel and `.env.local` (or, in a cloud session, the environment settings).
