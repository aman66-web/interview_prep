# Go-live pack (playbook Day 8, build B6)

Written 19 Oct 2026. Nothing here switches anything on by itself. The founder approves the merge (Day 9) and the opening (Day 10). Claude Code never pushes or merges to `main` without that yes (CLAUDE.md rule 2.6).

## The order

1. **Day 8:** the live Stripe account and keys (part 1), Web Analytics switched on (part 4), search tools (part 5).
2. **Day 9:** the founder says yes to the merge (part 6). The site on casespar.app is then a production build, **still behind the Vercel login**. Test one real purchase and one refund (playbook Day 9).
3. **Day 10:** the launch check. If it passes, the founder switches the Vercel login off for production (part 7). The site is public.
4. **Straight after opening:** submit the Google brand check (`docs/CHROME_SETUP.md` part L, step 5) and send the sitemap (part 5).

## 1. Live Stripe account (Claude in Chrome, the founder at the keyboard)

Rules: Chrome never types or reads a secret key, bank details, ID or a card. The founder types those. Stop and ask before anything that costs money.

1. Open https://dashboard.stripe.com. The Preflight Pass (Martzey) account is MARTZEY LTD's. Use **a separate new account for CaseSpar** (Stripe recommends one account per independently run website, and it keeps CaseSpar's statement and receipts apart): in the account menu choose **New account**, name `CaseSpar`, country United Kingdom, business MARTZEY LTD.
2. **Activate live mode.** Stripe asks for the company details, the bank account for payouts and identity checks for the directors. Reuse MARTZEY LTD's details exactly as in the Preflight Pass account (company number 14466643, registered office 86-90 Paul Street, London, England, EC2A 4NE, VAT GB495392446). The founder types the bank, phone and identity details.
3. **Public details** (Settings, Business, Public details): public name `CaseSpar`, website `https://casespar.app`, statement descriptor `CASESPAR`, support email: the address the site shows (`hello@casespar.app` once it works, else the founder's choice), terms `https://casespar.app/legal/terms`, privacy `https://casespar.app/legal/privacy`.
4. **Customer portal** (Settings, Billing, Customer portal): turn it on in **live mode**; tick "Customers can cancel subscriptions" and "update payment methods". Without it "Manage billing" fails.
5. **Live secret key.** Developers, API keys, **Create restricted key**, name `CaseSpar site`. Permissions: **Checkout Sessions write, Customers write, Customer portal write, Products write, Prices write, Subscriptions read, Invoices read, Charges read, Payment Intents read**; everything else None. Chrome stops before Create. **The founder clicks Create, copies the key and pastes it into Vercel himself** (step 7). If the first live test purchase fails with a permissions error, add what Stripe's error names and try again.
6. **Live webhook.** Developers, Webhooks, **Add endpoint**: URL `https://casespar.app/api/stripe/webhook`; events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`. Chrome stops before it reveals the **Signing secret**; the founder copies it into Vercel himself.
7. **Vercel, Production only** (the founder adds these himself; the Environment Variables page is not for Chrome): `STRIPE_SECRET_KEY` (the live key, Sensitive, **Production only**) and `STRIPE_WEBHOOK_SECRET` (Sensitive, Production only). Preview keeps the **test** keys, so previews never take real money.
8. **One-use test codes** (Products, Coupons): a coupon `FOUNDERTEST`, 100% off, once, with a promotion code of the same name (for the free purchase test); and on Day 9 a second coupon for the $1 refund test (playbook Day 9).

## 2. Vercel variables for Production

Today Production holds the Supabase keys, `SUPABASE_SECRET_KEY`, the Anthropic settings, `CRON_SECRET`, `ADMIN_EMAILS` and a **test** Stripe key. Before the merge the founder sets, for **Production**:

| Name | Value | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://casespar.app` | No |
| `NEXT_PUBLIC_SIGNIN_PROVIDERS` | `google` | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | the public Turnstile site key (in `docs/PROGRESS.md`) | No |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | the support address | No |
| `STRIPE_SECRET_KEY` | the **live** key (replace the test one) | Yes |
| `STRIPE_WEBHOOK_SECRET` | the **live** signing secret | Yes |

Never set `SHOW_DRAFT_CONTENT` or `PREVIEW_QUICK_LOGIN` for Production (draft cases would show). The Turnstile widget already allows `casespar.app`; Supabase already allows `https://casespar.app/**` for sign-in.

## 3. The domain

`casespar.app` currently points at the newest preview of the PR branch. After the merge, in Vercel, Settings, Domains, `casespar.app`, set it to the **Production** environment (and `www.casespar.app` to redirect to it). Until Day 10 the site stays behind the Vercel login.

## 4. Page-view counts

`@vercel/analytics` is in the code (`app/layout.tsx`), cookie-free, as the privacy page says. It only records once switched on: Vercel, project, **Analytics**, **Enable**. Until then its script returns a harmless 404.

## 5. Search tools

- **Search Console:** the Domain property for `casespar.app` is already verified (18 Oct). After opening: Sitemaps, add `https://casespar.app/sitemap.xml`. Request indexing for the home page and one guide.
- **Bing Webmaster Tools:** import the site from Google Search Console (one click, same Google login).
- **IndexNow:** the key file is `public/891d648cf77600298d13406372f69d40.txt` (not a secret). After opening, and after later deploys that add pages: `node scripts/indexnow.mjs` sends the live sitemap. Ask Claude Code to run it.

## 6. Checklist before the merge into `main` (Day 9)

- [ ] At least 5 cases are reviewed and show a reviewer name and date (`npm run content:check` passes).
- [ ] Production variables set (part 2) and live Stripe keys in Production only.
- [ ] `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` pass on the PR branch, and CI is green.
- [ ] Privacy, terms, refunds and disclaimer: no square-bracket notes left except those the founder accepts; the support email is set. About and FAQ approved or left as drafts (they stay out of Google while draft).
- [ ] ICO fee paid (or the founder accepts the risk), lawyer's view on the no-refunds wording received or accepted.
- [ ] Vercel Authentication still on **All Deployments**.
- [ ] The founder has said yes to the merge in this chat.

## 7. Opening the site (Day 10)

Only after the Day 10 launch check passes: Vercel, Settings, Deployment Protection, Vercel Authentication, switch to **Standard Protection** (production public, previews still private). Open https://casespar.app in a private window and check: home, a free case, sign-in with a second address (code and Turnstile), pricing. Then the Google brand check (step 5) and the sitemap.

If anything looks wrong, put the setting back to **All Deployments**.
