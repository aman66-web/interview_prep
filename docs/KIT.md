# Interview Prep Platform: Build Kit

**For Claude Code.** The founder (Aman) is a non-developer. He drops this one file into an empty GitHub repo and asks you to build the product from it. Read the whole file before doing anything.

- **Phase 1:** consulting case interviews with a text-based AI interviewer.
- **Phase 2 (later):** data/SQL interviews, on the same platform.
- **Phase 3 (later):** voice interviewer.

---

## 0. First steps (Claude Code: do this before anything else)

1. Read this file from top to bottom.
2. Split it into these project files:
   - `CLAUDE.md`: short project memory. Section 2 (Rules), the commands in section 3, and a table pointing to the docs below. Keep it under about 150 lines.
   - `docs/SPEC.md`: sections 1 and 3–12.
   - `docs/CONTENT.md`: section 7, plus the case JSON schema.
   - `docs/PROGRESS.md`: section 13 as a checklist, plus the founder checklist from section 14.
   - `docs/KIT.md`: this file, unchanged, for reference.
   - `.claude/settings.json`: from rule 2.10.
   - `.gitignore`: must include `.env*`, then `!.env.example`.
   - `.env.example`: from section 3.
3. Reply to the founder in plain English with:
   - a 5–10 line plan for milestone **P0 + P1**
   - anything he must set up first (see section 14)

   Then **wait for him to say "go"**. Don't write app code before that.

---

## 1. The product

**What it is.** A website where students and graduates practise **consulting case interviews**, the kind used by big consulting firms. An **AI interviewer** runs a realistic mock case in a chat window, then gives a **scored debrief** that shows exactly what to fix.

**Free vs paid.**
- **Free:** practice drills, plus **one full AI mock case with a scored debrief**.
- **Paid:** every case, unlimited drills, AI interview sessions (fair-use limits), progress tracking and model answers.

**Who it's for.**
- University students and recent graduates applying to consulting, in the US and UK first.
- MBA applicants and career switchers.
- English only.

**Pricing.**
- **Free:** no card needed.
- **Monthly:** $39 a month, cancel anytime.
- **90-Day Pass:** $99 one-time. It gives 90 days of access and never auto-renews.
- **Universities and consulting clubs:** group pricing on request, through a contact form.

**Why this should sell.** Small sellers of this model have verified revenue on TrustMRR (Stripe-verified, checked 14 Oct 2026):
- **Road to Offer** (consulting case prep): about $4.4K in the last 30 days, up from $79 a month in Feb 2026.
- **Dataford** (tech interview prep): about $46.4K in the last 30 days.

**Their funnel, which we copy:**
1. Free, useful content that ranks on Google.
2. A free account with no card.
3. One free full mock interview with a scored breakdown. This is the moment users see their weak spots.
4. Paywall.
5. Simple pricing, including a "sprint" pass that matches how long people prepare.

**One platform, many tracks.** Build it so that tracks (consulting, later data/SQL), cases and drills are **data, not code**. One subscription unlocks every track.

---

## 2. Rules (these go in CLAUDE.md)

**2.1 Original content only.**
- Never copy or paraphrase cases, questions, exhibits or model answers from anywhere else. That includes university club casebooks, books, competitor sites, firm practice materials and forums.
- Write original cases with invented, internally consistent numbers.

**2.2 No invented facts.**
- Guides about firms, interview formats, online tests and dates must come only from official firm career pages or reputable sources, with the URL and the date checked.
- If a fact can't be verified, leave it out and add it to `docs/RESEARCH_TODO.md`.

**2.3 Trademarks and affiliation.**
- Use firm names only to describe something, e.g. "McKinsey-style case". Never show firm logos.
- The footer, every firm page and the pricing page must say: *"Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site."*

**2.4 No fake proof.**
- Never invent testimonials, ratings, user counts, offer rates or "users landed offers at" claims. Fake reviews are banned under US FTC rules and the UK's DMCC Act.
- Show real numbers and real quotes only once they exist and the person has agreed.

**2.5 Secrets stay on the server.**
- Never put secret keys in client code or logs.
- Never ask the founder to paste a key into chat. He adds keys to Vercel and `.env.local` himself.
- Only `NEXT_PUBLIC_*` variables may reach the browser.

**2.6 Ask before:**
- `git push`, `supabase db push` or `supabase link`, or any Stripe, Vercel or Supabase change made through a connector or CLI.
- Anything that costs money, deploys to production or emails real users.

**2.7 Privacy (UK GDPR).**
- Collect only the data needed.
- Delete interview transcripts after 365 days (configurable).
- Users can export their data and delete their account and data.
- No data selling. Analytics must not use cookies (Vercel Web Analytics).
- No advertising pixels until the founder decides. If he adds them, add a consent banner first.

**2.8 AI cost control.**
- Every AI call goes through one server module (`lib/ai/`).
- That module enforces per-user limits and per-session token caps, and logs usage to `ai_usage`.

**2.9 Maths must be right.**
- Every numeric question in a case has an expected answer that is **recomputed by tests**.
- Maths in the debrief is scored by code checks, not by the model's opinion.

**2.10 Claude Code permissions (`.claude/settings.json`).**
- **Allow:** `npm run *`, `npx vitest`, `npx next lint`, `git status`, `git diff`, `git log`.
- **Deny:** reading any `.env*` file except `.env.example`.
- **Ask first:** `git push`, `supabase db push`, `supabase link`, `stripe *`, `vercel *`.

**2.11 Dependencies.**
- Use only the stack in section 3, plus a small safe maths-expression evaluator (for example `expr-eval`).
- Ask before adding anything else.

**2.12 Quality.**
- Mobile-first, keyboard-accessible, labelled inputs, good contrast, light and dark themes.
- TypeScript strict mode. Lint and tests pass before every report.

**2.13 Talking to the founder.**
- Use plain English with no jargon.
- After every milestone, report what was built, what to click to see it, and anything he needs to do. Keep it to a few lines.

---

## 3. Stack

| Part | Choice |
|---|---|
| App | Next.js (latest stable, App Router, TypeScript strict), Tailwind CSS, zod |
| Tests | Vitest, plus a few Playwright smoke tests (optional, ask first) |
| Database and login | Supabase: Postgres, Auth (email magic link at launch, Google sign-in later), Row Level Security on every table |
| Payments | Stripe Checkout (subscription and one-time), Customer Portal, webhooks; Stripe Tax behind a config flag |
| AI | Anthropic API through `@anthropic-ai/sdk`, server-side only. Model ID comes from the `ANTHROPIC_MODEL` env var; check Anthropic's docs for current model IDs and prices. Stream responses |
| Hosting | Vercel (**Pro plan needed before taking payments**, because Hobby is non-commercial), Vercel Web Analytics, Vercel Cron |
| Email | Supabase Auth emails for login at launch. Any other email provider is optional and needs the founder's approval |

**Commands:**
- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run content:check` (validates all content and recomputes all case maths)

**`.env.example`** (names only, no values):
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_PASS90=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
CRON_SECRET=
ADMIN_EMAILS=
NEXT_PUBLIC_SUPPORT_EMAIL=
```

---

## 4. Site config (`site.config.ts`)

Everything brand- or business-specific lives here, so it can change without touching the app:

- `brandName` (placeholder `"TODO Brand"` until the founder picks one), `tagline`, `supportEmail`.
- `prices` (display only; real prices come from Stripe): monthly $39, 90-day pass $99.
- `limits`:
  - free: 1 AI case in total, 20 drills a day
  - paid: 3 AI cases a day and 60 a month
  - 40 candidate turns per session
- `refundWindowDays: 7` and `refundMaxAiSessions: 2`. The refund applies only if the user has used 2 or fewer AI sessions.
- `transcriptRetentionDays: 365`.
- `tracksEnabled: ["consulting"]`. Phase 2 adds `"data"`.
- `disclaimer` text (rule 2.3).
- `stripeTaxEnabled: false`. The founder turns it on after talking to an accountant.

---

## 5. Pages and routes

### Public pages (these bring in Google traffic)

- **`/` (home).**
  - Headline along the lines of "Practise consulting case interviews with an AI interviewer that scores you".
  - Main button: "Start free, no card needed".
  - Then: a 3-step "how it works" section, a real screenshot of a debrief, a pricing teaser and a FAQ.
- **`/cases`.** The case library, filterable by type, industry and difficulty.
  - **`/cases/[slug]`:** each case's prompt and first stage are visible to everyone; the rest is locked.
- **`/drills`.** Mental maths, market sizing, frameworks and charts. Free up to a daily limit.
- **`/guides`.** One guide per case type (market sizing, profitability, market entry, M&A, pricing, growth, operations).
  - **`/guides/firms/[firm]`:** firm guides, using verified facts only (rule 2.2).
- **`/tools`.** Free tools that need no login: market sizing calculator, break-even calculator, mental maths trainer, growth rate calculator. Each one links to a related free case or drill.
- **`/pricing`, `/for-universities`** (group pricing contact form), `/blog` (MDX), `/faq`, `/about`.
- **`/legal/terms`, `/legal/privacy`, `/legal/refunds`, `/legal/disclaimer`.**

### App pages (logged in)

- **`/app` dashboard:** a skill score per area, recent sessions and a recommended next case.
- **`/app/interview/[sessionId]`:** the AI interviewer chat. A side panel (tabs on mobile) holds exhibits, a notes scratchpad, a calculator and a timer. Buttons for "Ask for data" and "Move to next stage".
- **`/app/debrief/[sessionId]`:** scores, strengths, fixes, maths check results, a model answer outline (paid only) and a shareable score-card image.
- **`/app/account`:** plan status, "Manage billing" (Stripe portal), export data, delete account.

### API routes

| Route | Purpose |
|---|---|
| `/api/interview` | POST a message; streamed reply |
| `/api/stripe/checkout` | Start a Stripe checkout |
| `/api/stripe/webhook` | Receive Stripe events |
| `/api/stripe/portal` | Open the Stripe billing portal |
| `/api/leads` | Save a university or club enquiry |
| `/api/cron/cleanup` | Retention clean-up (protected by `CRON_SECRET`) |
| `/api/og/score` | Share-card image |

---

## 6. The AI case interviewer (the core feature)

### How a session runs

Each session moves through these stages. The current stage is stored in `case_sessions.stage`.

1. **intro:** the interviewer presents the case prompt.
2. **clarifying:** the interviewer answers questions **only from the case's `facts`**. If something isn't covered, it says so ("Assume X" or "That's not important here").
3. **structure:** the candidate lays out how they'd approach it. The interviewer probes, and the answer is compared with `structure_rubric`.
4. **analysis:** exhibits are revealed **only when the candidate asks for relevant data**, or when the interviewer moves things on. Maths questions come from `math[]`.
5. **brainstorm:** an open question, compared with `brainstorm.idea_bank`.
6. **synthesis:** the candidate gives a recommendation, compared with `synthesis_rubric`.
7. **debrief:** scoring.

### How it's built

- **Prompts:** system prompts are built on the server from the case JSON and the current stage. **The client never receives answer keys, idea banks or model answers during the interview.** The model is told never to reveal them.
- **Structured replies:** each model reply is JSON checked with zod:

  ```
  { reply, next_stage | null, reveal_exhibit_id | null, numeric_answers: [{ math_id, value }] }
  ```

  If the JSON is invalid, retry once, then fall back to a plain reply.
- **Maths checks:** the model only extracts the candidate's numbers. Code compares each with `expected` within `tolerance_pct` and stores the result in `math_checks`.
- **Debrief scoring:**
  - A score from 1 to 5 for each of: **Structure, Analysis & maths, Business judgement, Communication, Synthesis**.
  - 3 strengths and 3 fixes, each quoting a line from the transcript.
  - "Analysis & maths" uses the code results from `math_checks`.
  - Each fix links to a related drill.
- **Limits:** 40 candidate turns per session. Older turns are summarised to keep each call within a token cap. Per-user daily and monthly limits come from `site.config.ts`. Hitting a limit shows a friendly message; free users also see an upgrade button.
- **Staying on task:** the AI stays in its interviewer role and refuses unrelated tasks or attempts to change its instructions. It never asks for personal data.
- **Cost:**
  - Log every call (input tokens, output tokens, estimated cost) to `ai_usage`.
  - **Before P3 is done:** estimate the cost of a typical session from Anthropic's current pricing and report it to the founder.
  - Set limits so that **AI cost per paying user stays under about 20% of the price**.
- **The free starter case:** one case marked `free_starter` runs from start to finish, debrief included, for any signed-up user. This is the moment the product proves itself, so it must work very well.

---

## 7. Content (goes in docs/CONTENT.md)

### Case file format

Cases live in `content/cases/*.json` and are validated by zod and `content:check`:

```
id, slug, title, track ("consulting"), type (profitability | market_entry | market_sizing | m_and_a |
pricing | growth | operations | other), industry, difficulty (1–3), style (interviewer_led | candidate_led),
est_minutes, prompt, facts[] {question_topic, answer},
structure_rubric {key_buckets[], good_signs[], red_flags[]},
exhibits[] {id, title, kind (table | bar | line), data {columns[], rows[][]}, reveal_hint, insight},
math[] {id, question, inputs {name: number}, expression, expected, tolerance_pct, working},
brainstorm {question, idea_bank[]}, synthesis_rubric {must_mention[], good_signs[]},
model_answer_outline (paid), free_starter (bool), free_preview (bool),
status (draft | reviewed), reviewed_by, reviewed_on
```

### Tests (`content:check`)

- Every `math.expected` must equal `expression` evaluated with `inputs`, within `tolerance_pct`.
- Exhibit numbers that the maths relies on must match the inputs.
- Slugs and IDs must be unique.
- Only `status: "reviewed"` cases are shown to users. Drafts stay hidden.

### Launch targets

- **20 original cases:** at least 2 of each type, with 1 marked `free_starter` and 3–5 marked `free_preview`.
- **300+ drills:**
  - mental maths drills generated by code
  - market sizing prompts with model approaches
  - framework drills
  - chart-reading drills using generated charts

### Writing rules

- Original, realistic but **invented** companies and numbers.
- A mix of US and UK settings.
- Numbers that work well for mental maths.
- Write in plain English.
- Each case must have a clear "right answer zone".

### Review

The founder or a paid reviewer with consulting experience reads each case before it is set to `reviewed`. Claude Code writes the drafts and runs `content:check`. A human approves.

### Guides

Guides are factual and cite their sources. Firm-specific facts come only from official career pages (rule 2.2).

---

## 8. Payments and access

### Stripe products

The founder creates these in **test mode** first. Claude Code gives click-by-click steps, or uses the API only with permission.

- **Monthly:** $39, recurring. Users cancel through the Customer Portal.
- **90-Day Pass:** $99, one-time. Sets `expires_at = max(now, current expires_at) + 90 days`, so buying again extends access. No auto-renew.

### Access

- The `entitlements` table holds `user_id, plan (free | monthly | pass90 | group), status, expires_at, stripe_ref`.
- **One** server function, `hasAccess(user, feature)`, decides every paywall.

### Webhooks

- Handle: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`.
- Always check the Stripe signature.
- Store processed event IDs in `stripe_events` so no event is handled twice.

### Refunds and tax

- **Refunds:** 7 days, only if the user has used 2 or fewer AI sessions. The founder handles refunds manually in the Stripe dashboard at launch. The `/legal/refunds` page explains the policy clearly.
- **Tax:** `automatic_tax` in Checkout, behind `stripeTaxEnabled`. The founder confirms UK VAT, EU digital-services VAT and US sales-tax obligations with an accountant before turning it on.
- **Currency:** USD at launch. Stripe Adaptive Pricing is optional and the founder decides.

### Group sales

The universities form saves to `leads`, and the founder follows up by email. Later: coupon codes or Stripe invoices.

---

## 9. Data model (Supabase migrations)

**Content lives in the repo** (versioned and reviewed through git). **User data lives in the database.** Turn on Row Level Security on every table and give no public access by default. Users can read and write only their own rows. Webhooks and cron jobs use the secret key on the server only.

| Table | Columns / purpose |
|---|---|
| `profiles` | `id` (= auth user), created_at, country, marketing_opt_in (default false) |
| `entitlements` | as in section 8 |
| `case_sessions` | id, user_id, case_id, stage, turns, started_at, completed_at, scores jsonb, summary |
| `session_messages` | id, session_id, role, content, created_at (deleted after the retention period) |
| `math_checks` | session_id, math_id, given, expected, correct |
| `drill_attempts` | user_id, drill_id, correct, ms, created_at |
| `ai_usage` | user_id, session_id, input_tokens, output_tokens, cost_estimate_usd, created_at |
| `stripe_customers` | user_id, stripe_customer_id |
| `stripe_events` | id, type, processed_at |
| `leads` | org, email, size, message, created_at |
| `events` | name (signup, case_started, case_completed, paywall_viewed, checkout_started, purchase), path, utm_source, utm_medium, utm_campaign, utm_term, created_at, user_id nullable. No IP addresses stored |

Write a SQL check script and tests proving Row Level Security works: a user can't read another user's rows, and anonymous visitors can't read anything private.

Cron job: delete `session_messages` older than the retention period, and `events` older than 180 days.

---

## 10. Growth features built in (all faceless)

- **Search pages:**
  - case-type guides
  - firm guides (verified facts only)
  - free case previews
  - free tools
  - drills
  - glossary
  - blog
- **Search basics:** every page gets a unique title and description, sensible internal links, `sitemap.xml`, `robots.txt` and OG images. FAQ schema only where the FAQ is real.
- **Clear answers:** pages give plain, direct answers to common questions (e.g. "How do I practise case interviews alone?") so search engines and AI assistants can quote them.
- **Share card:** after a debrief, users can share a score image to LinkedIn or X. It shows no personal data unless they choose to add their name.
- **Universities and consulting clubs page** with group pricing.
- **UTM tracking without cookies:** UTM tags from the first visit are held in `sessionStorage` and attached to the signup event.
- **Referral programme:** P6, optional, and only if the founder asks.

---

## 11. Design

- Credible, calm and fast, like a professional prep tool. Not flashy.
- Mobile-first, with light and dark themes.
- **Interview screen:** chat on the left; exhibits, notes and calculator on the right (tabs on mobile). A clear stage indicator ("Clarifying → Structure → Analysis → Brainstorm → Recommendation").
- **Debrief:** a simple bar chart of the 5 skill scores, then "What to fix next" with buttons that open the matching drill.

---

## 12. Analytics and the 30-day decision

**Funnel to track:** visit → free signup → started free case → finished free case → saw paywall → started checkout → paid.

**Admin page `/admin`:** only for emails listed in `ADMIN_EMAILS`. Shows funnel counts and AI cost for the last 7 and 30 days.

**30 days after launch** (the founder's bar; these are targets, not data):

| Outcome | Result |
|---|---|
| **Go** | 300+ free signups **and** 15+ paying customers, or 3%+ of signups paying |
| **Adjust** | 100–299 signups or 5–14 paying. Fix the funnel and run 2 more weeks |
| **Stop or pivot** | Under 100 signups **and** under 5 paying |

---

## 13. Milestones

Every milestone ends with tests passing, a Vercel preview link and a short plain-English report.

- **P0 Setup.**
  - Split this kit into files (section 0).
  - Scaffold Next.js **in a temporary folder, then move it in**, because `create-next-app` refuses a non-empty folder.
  - Add `site.config.ts`, `.claude/settings.json`, `.gitignore` and `.env.example`.
  - Add GitHub Actions to run lint, tests and build.
- **P1 Login and database.** Supabase migrations, Row Level Security and its tests, magic-link login, profiles, account deletion and data export.
- **P2 Content engine.**
  - Case schema and `content:check`.
  - 5 draft cases, including the free starter.
  - The drills generator.
  - `/cases` and `/drills` pages.
- **P3 AI interviewer.**
  - Session stages, exhibit reveals, maths checks, debrief scoring, limits and usage logging.
  - The free starter case works from start to finish.
  - **Report the estimated cost per session.**
- **P4 Payments.** Stripe test mode, checkout for both plans, webhooks, entitlements, Customer Portal, paywall states, and a pass that extends correctly when bought again.
- **P5 Content and search.** 20 cases ready for review, case-type guides, firm guides (verified), free tools, sitemap, metadata and OG images.
- **P6 Polish.** Dashboard and progress, share card, universities page and leads, admin page, retention cron, legal pages (drafts for the founder to review).
- **P7 Launch checklist.**
  - Founder: Vercel Pro, custom domain, Stripe live mode, a real test purchase **and** refund, an Anthropic monthly spend limit, a final read of the legal pages.
  - Claude Code: check every funnel event fires.

**Phase 2: data/SQL track** (only after a "Go" at day 30):
- SQL practice that runs **in the browser** using DuckDB-WASM or sql.js on small invented datasets. No code runs on the server.
- AI interviewer modes for product-sense and metrics questions.
- The same entitlements: one subscription unlocks both tracks.
- Python practice through Pyodide comes later.

**Phase 3:** voice interviewer (speech-to-text plus text-to-speech), only if usage justifies the cost.

---

## 14. Founder checklist (Aman)

Claude Code: give click-by-click steps whenever he asks.

1. **Brand:** pick a name and domain. Check the domain is free and the name isn't someone else's trademark. Tell Claude Code so it can update `site.config.ts`.
2. **GitHub:** create a new private repo, add this file and open it with Claude Code.
3. **Supabase:** the free plan allows **2 active projects** and you already have 2 (menumacros and drone-test-prep). Either pause one or upgrade to Pro (about $25 a month) before creating this project.
4. **Vercel:** import the repo.
   - Add the environment variables for **Production and Preview**, and mark the secret ones "Sensitive".
   - Move to the **Pro** plan before taking real payments.
5. **Stripe (UK account):**
   - Create both products in test mode, then add the webhook endpoint.
   - Decide on Stripe Tax with an accountant.
   - Switch to live mode only at P7.
6. **Anthropic:** create an API key in the console and **set a monthly spend limit**.
7. **Support email:** a separate inbox just for this site.
8. **Case reviewer (recommended):** someone with consulting experience to check the 20 launch cases before they go live.
9. **Never paste secret keys into any chat.** Add them yourself in Vercel and `.env.local`.

---

## 15. Never do these

- Use firm logos, claim affiliation, or say users got offers without proof and their permission.
- Scrape or copy competitor or casebook content.
- Invent testimonials, ratings, user counts or results.
- Send marketing emails without opt-in.
- Store card details (Stripe handles payments).
- Push, deploy to production, change databases or spend money without asking.
- Add paid third-party services without asking.
