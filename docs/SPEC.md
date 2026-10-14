# Interview Prep Platform: Spec

Section numbers match `docs/KIT.md`. Section 2 (Rules) lives in `CLAUDE.md`; section 7 (Content) lives in `docs/CONTENT.md`; sections 13 and 14 live in `docs/PROGRESS.md`.

- **Phase 1:** consulting case interviews with a text-based AI interviewer.
- **Phase 2 (later):** data/SQL interviews, on the same platform.
- **Phase 3 (later):** voice interviewer.

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
ANTHROPIC_EFFORT=
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
- **As built (P3):**
  - Code, not the model, decides what is allowed: the stage can only move to the next one (or finish), an exhibit is revealed only in the analysis stage, the candidate's numbers are compared with `expected` by code, and quotes in the debrief are dropped unless the candidate really said them. "Analysis & maths" is the average of the model's analysis score and the code's maths score, rounded.
  - A turn is saved atomically by the database function `commit_interview_turn` (two taps cannot double-save); a session starts through `start_interview_session`, which enforces the free and paid limits without races. Both are callable only by the server.
  - A reply streams to the browser as lines of JSON (`/api/interview`), so the candidate sees the interviewer typing. If the model fails, nothing is saved and the candidate's message is put back in the box.
  - The debrief page reads `case_sessions.scores` (which includes the maths results) as the signed-in user. `math_checks` is never readable by browsers.
  - `ANTHROPIC_EFFORT=none` leaves the effort setting out for models that reject it.
- **Staying on task:** the AI stays in its interviewer role and refuses unrelated tasks or attempts to change its instructions. It never asks for personal data.
- **Cost:**
  - Log every call (input tokens, output tokens, estimated cost) to `ai_usage`.
  - **Before P3 is done:** estimate the cost of a typical session from Anthropic's current pricing and report it to the founder.
  - Set limits so that **AI cost per paying user stays under about 20% of the price**.
- **The free starter case:** one case marked `free_starter` runs from start to finish, debrief included, for any signed-up user. This is the moment the product proves itself, so it must work very well.

## 7. Content

Moved to [`CONTENT.md`](CONTENT.md) so there is only one copy to keep up to date.

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
