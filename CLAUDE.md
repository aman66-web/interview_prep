# Interview Prep Platform: project memory

Consulting case-interview practice with a text AI interviewer and a scored debrief. Phase 1 = consulting; Phase 2 = data/SQL; Phase 3 = voice. Tracks, cases and drills are **data, not code**.

The founder (Aman) is a non-developer. Follow rule 2.13 when talking to him.

**Start of every session:** read `docs/PROGRESS.md` to see which milestone we are on. **End of every milestone:** tick it off there and report (rule 2.13).

## Docs

| File | What is in it |
|---|---|
| `docs/SPEC.md` | Product, pricing, stack, site config, pages and routes, AI interviewer design, payments and access, data model, growth features, design, analytics (kit sections 1 and 3-12) |
| `docs/CONTENT.md` | Case file format (the case JSON schema), `content:check` tests, launch targets, writing and review rules (kit section 7) |
| `docs/PROGRESS.md` | Milestone checklist P0-P7 and the founder's setup checklist |
| `docs/KIT.md` | The original build kit, unchanged. Reference only; do not edit |
| `docs/RESEARCH_TODO.md` | Facts that could not be verified (rule 2.2). Create when first needed |

Section numbers in the docs match `docs/KIT.md`, so "rule 2.6" and "section 14" mean the same everywhere.

## Rules (numbers match docs/KIT.md)

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

## Code conventions

- Next.js 16: the old `middleware.ts` is now `proxy.ts`. Current Next.js docs are bundled in `node_modules/next/dist/docs/`; read them before using an API you are unsure of.
- Database access: `lib/supabase/server.ts` acts as the logged-in user (Row Level Security applies; the default). `lib/supabase/admin.ts` uses the secret key and ignores Row Level Security: server actions and route handlers only, and only after checking who the caller is.
- Every page, server action and route handler that needs a login calls `requireUser()` or `getUser()` from `lib/auth/session.ts` itself. The proxy and layouts are not the only gate.
- Database changes go in a new file in `supabase/migrations/`. Any new table needs Row Level Security, the minimum grants, and a case in `supabase/tests/rls.sql`. `npm test` runs those checks when `RLS_TEST_DATABASE_URL` points at a Postgres (CI always does).
- Tables holding answer keys (`math_checks`) are never readable by browsers.
- Never log email addresses or other personal data.

## Commands (available once P0 has scaffolded the app)

- `npm run dev`
- `npm test` (set `RLS_TEST_DATABASE_URL` to also run the database security checks)
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run content:check` (validates all content and recomputes all case maths)

---

## 15. Never do these

- Use firm logos, claim affiliation, or say users got offers without proof and their permission.
- Scrape or copy competitor or casebook content.
- Invent testimonials, ratings, user counts or results.
- Send marketing emails without opt-in.
- Store card details (Stripe handles payments).
- Push, deploy to production, change databases or spend money without asking.
- Add paid third-party services without asking.
