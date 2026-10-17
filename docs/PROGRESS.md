# Progress

Tick items off as they are done. Every milestone ends with tests passing, a Vercel preview link and a short plain-English report (rule 2.13).

**Current milestone:** P0 to P6 built (new design across the whole site, 36 draft cases including bank and firm-style ones, firm and bank guides with practice pages, tools, dashboard, admin, share card, clean-up job, photos). The Supabase project is up and its tables are locked down. Keys checked in Vercel on 16 Oct 2026 (see Handoff): everything the preview needs is set, so the AI interviewer is live on the preview. Still open (founder): a first real interview, the sign-in email (waits for an email-sending service, Day 2), the Stripe webhook and `NEXT_PUBLIC_SUPPORT_EMAIL` (both wait for the domain), then a real test-mode purchase.

## Handoff (14 Oct 2026)

Read this first in a new session.

- **Vercel is done, apart from settings.** Project `interview-prep` (id `prj_rHyF4UXcRyr0HdTrS25EoRe9DrhT`, personal account; the founder has Vercel Pro) is linked to the GitHub repo. The PR branch built successfully. Preview: `https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app`. Vercel Authentication is on, so only the founder (logged in to Vercel) can open it. Vercel labelled that first deployment "production"; nothing is public. Environment variables set: `SHOW_DRAFT_CONTENT=1` for **Preview** only (so draft cases can be reviewed on previews; never for Production), and `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview. **Checked 16 Oct 2026 (read-only, names only):** the founder has also added `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY` and `CRON_SECRET` (all Sensitive, Production and Preview), plus `ANTHROPIC_MODEL=claude-sonnet-5-5` and `ADMIN_EMAILS=aman662002@gmail.com` (Production and Preview) and `PREVIEW_QUICK_LOGIN=1` (Preview only). Every build since 11:30 UTC on 16 Oct has them. Still missing: `STRIPE_WEBHOOK_SECRET` (the webhook needs a public address, so it waits for the domain; on previews the return page switches a plan on by itself) and `NEXT_PUBLIC_SUPPORT_EMAIL` (needs a support inbox). `SHARE_SIGNING_SECRET` is optional.
- **Founder's Claude in Chrome, 16 Oct 2026 (read-only, nothing changed):** the Anthropic monthly spend limit is $20 (it now lives under Billing, not Settings, Limits; $0 spent so far); Supabase URL Configuration already has the preview as Site URL and both redirect patterns; the UK IPO register has no live or dead text mark containing MOCK PARTNER or MOCKPARTNER (the "similar" search found only MEKOPARTNER and WorkPartner, both class 7 machinery). Text marks only, not legal advice.
- **Supabase project exists (14 Oct 2026).** Second account, organisation "aman662002@gmail.com's Org" (Free plan, $0). Project `interview-prep`, ref `jkvnarskslswdwrdzefa`, London (`eu-west-2`), URL `https://jkvnarskslswdwrdzefa.supabase.co`. The first account (menumacros, drone-test-prep, cscs-test-app) was never touched.
  - **Done with the founder's go ("try supabase now"):** created the project; applied the three files in `supabase/migrations/` in order; checked the real database with read-only queries (11 tables, all with Row Level Security and a policy, `anon` has no table access, `authenticated` has only the intended grants, the two interview functions and `handle_new_user` are not callable from browsers, the sign-up trigger exists); the security advisor returns no findings; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` added to Vercel (Production and Preview).
  - **`supabase/tests/rls.sql` could not be run through the connector:** it timed out after 60 s (scripts containing `delete` also stalled on the other project) and left nothing behind (checked). The same script passes on a local Postgres and in CI against the same migration files. The founder can also paste it into the Supabase SQL Editor for a belt-and-braces run.
  - **The connector cannot do these, so the founder does them in the dashboard (click-by-click in `docs/SETUP.md`):** Authentication, URL Configuration (Site URL and Redirect URLs); the Magic Link and Confirm sign up email templates; and adding `SUPABASE_SECRET_KEY` to Vercel himself (Sensitive, Production and Preview). The session's `api.supabase.com` connection returned "upstream auth failed", so the Management API was not usable either (not worked around).
  - **Then:** push (or redeploy) so the new variables reach a build, and test a real sign-in. **The built-in Supabase email sender only sends to members of the Supabase organisation**, which for this account is `aman662002@gmail.com`; test with that address (or invite another address to the organisation first).
- **Keys (rule 2.5):** the Supabase URL and publishable key can go straight to Vercel without appearing in chat. The secret key (`SUPABASE_SECRET_KEY`) must not pass through chat: if the connector cannot place it directly, the founder pastes it into Vercel himself, marked Sensitive.
- **Still the founder's:** paying for any Supabase upgrade, choosing an email-sending service for real students (and the domain it needs; decided 15 Oct to set this up later).
- **Growth playbook (15 Oct 2026):** the founder follows a 90-day, day-by-day plan from Fri 16 Oct (Day 1) at https://claude.ai/artifact/1kgsULhHkJX4bh7mdQmNzq; a copy is in `docs/playbook/`. Its honest view: $10,000 a month is very unlikely inside 90 days; the 90-day goal is going live by Day 10, 30 reviewed cases, about 70 paying customers and a run rate of about $3,000 a month in early January, with the first $10,000 month aimed at November 2027.
- **Preview quick log-in (16 Oct 2026, founder's request):** until real sign-in emails work on his own domain, typing an `ADMIN_EMAILS` address (today only aman662002@gmail.com) on the preview's Log in page signs straight in to the dashboard, with no email or code (`lib/auth/preview-login.ts`). It only works when `VERCEL_ENV` is `preview` **and** the Vercel setting `PREVIEW_QUICK_LOGIN=1` (Preview only, set 16 Oct) is present; production and local runs ignore it. Everyone else still gets the emailed code. **Switch it off** (delete `PREVIEW_QUICK_LOGIN` in Vercel, then push or redeploy) once custom email sending works (Day 2) and before any preview link is shared (Days 4, 38 and 59). Deleting it only affects deployments built afterwards, so share only a preview built after the switch-off.
- **Founder's account has full access (16 Oct 2026, his request):** `entitlements` for aman662002@gmail.com set by hand to `plan = 'group'`, `status = 'active'`, no end date, no Stripe link. It is not a sale (no Stripe customer, no purchase event, so the admin page's paying count is unchanged). A `group` account cannot buy, so test purchases need a second address; to undo, set the row back to `plan = 'free'`.
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
- [x] Founder: Auth URL configuration (checked 16 Oct) and `SUPABASE_SECRET_KEY` in Vercel
- [ ] Founder: the two email templates (Supabase only allows this once a custom email sender is connected; Day 2)
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
- [x] Start choice and warm-up (17 Oct 2026, founder's request): **Full interview** (hello, small talk, how it works, then the case; default) or **Straight to the case**, chosen on the start page; the interviewer explains every stage as it begins. `lib/ai/interview.ts`, `lib/ai/prompt.ts`, SPEC section 6. Not yet tried with a real model: read a real transcript and tune the wording in `lib/ai/prompt.ts` if the interviewer rambles or over-explains
- [x] Session stages, exhibit reveals, maths checks, debrief scoring, limits and usage logging (`lib/ai/`; every model call goes through it, and only `lib/ai/llm-anthropic.ts` imports the SDK)
- [x] The free starter case works from start to finish: `/app/start/[slug]`, `/app/interview/[id]` (chat, stage bar, exhibits, notes, calculator, timer), `/app/debrief/[id]`. Proven in a browser against a fake model; **not yet run with a real model**
- [x] The debrief stores its maths results inside `case_sessions.scores` when the interview finishes, so the debrief page reads only that and `math_checks` (which holds answer keys) is never readable by browsers
- [x] **Estimated cost per session reported** (see below)
- [x] Tests passing, browser test passing
- [x] Founder: Anthropic key and monthly spend limit ($20), `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL=claude-sonnet-5-5` in Vercel (checked 16 Oct)
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
- [x] Every case reviewed and rewritten by Claude, then checked again by separate skeptical checkers (15 Oct 2026): more realistic numbers, real-world claims checked or removed, one real product name taken out (case-015 is now Orvessa, at `/cases/orvessa-subscriber-growth`). What changed and the open questions for the human reviewer: `docs/CASE_REVIEW_NOTES.md`
- [x] Case-type guides: 10 guides (the seven case types plus structuring, case maths and practising alone), every worked number recomputed by tests; a 60-term glossary
- [x] Firm guides (verified facts only): Bain, BCG and McKinsey, each from the firm's own careers pages (checked 15 Oct 2026); facts that could not be verified are in `docs/RESEARCH_TODO.md`
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
- [x] Site photos (16 Oct 2026): 53 of the 62 site images from `docs/IMAGE_BRIEF.md` placed (home sections, 17 case photos, 8 guide banners, 3 drill and 3 tool cards, 13 page banners and panels, 3 on `/for-universities`); 9 rejected by the reviewer keep the plain design. One registry (`lib/images.ts`), checked by `tests/images.test.ts`; how to add one is in `docs/DESIGN.md` ("Photos")
- [x] Tests passing (725 unit tests, database security checks in CI, four browser suites), Vercel preview link and plain-English report (15 Oct 2026)

### P7 Launch checklist
- Founder:
  - [x] Vercel Pro (already on Pro, 15 Oct 2026)
  - [ ] Custom domain (mockpartner.com; the founder buys it once the site is finished)
  - [ ] Stripe live mode
  - [ ] A real test purchase **and** refund
  - [x] An Anthropic monthly spend limit ($20, checked 16 Oct 2026; raise it before launch if needed)
  - [ ] A final read of the legal pages and their remaining square-bracket notes. Company details (MARTZEY LTD, chosen 15 Oct 2026) and the minimum age (18) now come from `site.config.ts`; the effective date is set when the pages are approved
  - [ ] A lawyer checks the no-refunds policy (founder, 15 Oct 2026: all sales final, except where the law requires a refund) and the wording of the "start straight away" tick box before checkout
  - [ ] ICO data protection fee for MARTZEY LTD (due once the site collects sign-ups; the founder plans to pay it at launch, 15 Oct 2026)
  - [ ] A trade mark attorney's view on "Mock Partner": no registered mark found in the UK, EU or US on 15 Oct 2026, but a US firm trades as "MOCK Partners" (mockpartners.com) and "mock" is descriptive. The founder's Claude in Chrome searched trademarks.ipo.gov.uk directly on 16 Oct 2026: no text mark containing MOCK PARTNER or MOCKPARTNER, live or dead
  - [ ] `CRON_SECRET`, `ADMIN_EMAILS` and `NEXT_PUBLIC_SUPPORT_EMAIL` set in Vercel (Production), then check the daily clean-up has run successfully (Vercel, project, Cron Jobs)
  - [ ] Approve the About and FAQ pages (fill in their square-bracket notes, then set `"status": "approved"`). Until then they show a draft notice and are left out of Google and the sitemap
  - [ ] Real email sending connected to Supabase (its built-in sender only reaches your own team) and CAPTCHA switched on for sign-in (`docs/SETUP.md`)
- Claude Code:
  - [ ] Check every funnel event fires
  - [ ] `PREVIEW_QUICK_LOGIN` is not in Vercel (the founder's preview shortcut, 16 Oct 2026)

### Phase 2: data/SQL track (only after a "Go" at day 30)
- [ ] SQL practice that runs in the browser (DuckDB-WASM or sql.js) on small invented datasets; no code runs on the server
- [ ] AI interviewer modes for product-sense and metrics questions
- [ ] Same entitlements: one subscription unlocks both tracks
- [ ] Later: Python practice through Pyodide

### Phase 3 (only if usage justifies the cost)
- [x] Free browser voice mode (16 Oct 2026, founder's request): a "Voice mode" switch in the interview room uses the browser's own speech (`lib/voice/`, `components/app/voice-mode.tsx`); no new service or dependency, no audio recorded or kept by us, `lib/ai` unchanged. Two independent review rounds fixed echo, nods, thinking pauses and phone behaviour (1,081 tests pass). **Not yet tried with a real microphone**: laptop speakers vs headphones, Android, iPhone Safari with Dictation off. The privacy page has a draft "Voice mode in interviews" section; what Chrome and Safari do with audio is listed in `docs/RESEARCH_TODO.md`. The pause before an answer is sent (about 2.5 to 3.5 s) is `DEFAULT_TIMING` in `lib/voice/text.ts`; tune it after real use.
- [ ] Paid real-time voice (research only, 16 Oct 2026, nothing signed up for): the best fit found is ElevenLabs Agents with our own Claude as its "custom LLM", about $0.08 a minute (about $2 for a 25-minute interview, against about $0.12 typed), audio stored in the US, zero-retention is Enterprise-only, and whether ElevenLabs adds a charge for a custom LLM is unconfirmed. It needs the founder's yes (rule 2.6 and 2.11), its own monthly cap per student, and a new row on the privacy page. Runner-up: Deepgram Voice Agent (about $1.63 an interview, EU endpoint).

## Founder checklist (kit section 14, Aman)

Claude Code: give click-by-click steps whenever he asks.

- [ ] **1. Brand:** name chosen: **Mock Partner** (15 Oct 2026, replacing CaseSpar; `site.config.ts` updated). mockpartner.com and mockpartner.ai were free on 15 Oct ($11.25 a year for the .com on Vercel); the founder wants to finish the site before buying. A web search found no product with this exact name, but that is not a trademark check: check the UK and US trademark registers before launch.
- [ ] **2. GitHub:** create a new private repo, add the kit and open it with Claude Code.
- [x] **3. Supabase:** done on 14 Oct using the second account (free plan, $0): project `interview-prep` in London.
- [ ] **4. Vercel:** import the repo.
  - [ ] Add the environment variables for Production and Preview, and mark the secret ones "Sensitive".
  - [x] Move to the Pro plan before taking real payments (the founder already has Vercel Pro, 15 Oct 2026).
- [ ] **5. Stripe (UK account):**
  - [ ] Test keys and webhook (`docs/SETUP.md` section 2c). No products needed: checkout creates the prices.
  - [ ] Decide on Stripe Tax with an accountant.
  - [ ] Switch to live mode only at P7.
- [x] **6. Anthropic:** API key in Vercel and a $20 monthly spend limit (checked 16 Oct 2026).
- [ ] **6b. Email sending for login:** Supabase's built-in sender only emails your own team. Pick an email service (needs your approval) before real students sign up. See `docs/SETUP.md`.
- [ ] **7. Support email:** a separate inbox just for this site.
- [ ] **8. Case reviewer (recommended):** someone with consulting experience to check the 20 launch cases before they go live.
- [ ] **9. Never paste secret keys into any chat.** Add them yourself in Vercel and `.env.local` (or, in a cloud session, the environment settings).
