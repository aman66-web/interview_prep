# Setup guide (for Aman)

Click-by-click steps for the accounts the site needs. Do them in order; stop when you reach something you have not decided yet.

**The golden rule:** never paste a secret key into a chat with Claude. You add keys yourself, in the places named below. If a menu is called something slightly different from what is written here, the screens move around from time to time: tell Claude what you see and it will adjust this guide.

## 1. Supabase (needed for P1: login and database)

1. Go to supabase.com and sign in.
2. **Make room first.** The free plan allows 2 active projects and you already have 2 (menumacros and drone-test-prep). Either open one of them, go to **Project Settings, General**, and choose **Pause project**, or upgrade to Pro (about $25 a month).
3. Click **New project**. Give it a name, choose a region close to your students (London for the UK, an East Coast US region for the US), and make up a strong database password. Save that password in a password manager. You will not need it day to day.
4. Wait a couple of minutes until the project says it is ready.
5. Find three values:
   - **Project URL**, in **Project Settings, Data API** (looks like `https://abcd1234.supabase.co`).
   - **Publishable key**, in **Project Settings, API Keys** (starts with `sb_publishable_`). This one is safe for browsers.
   - **Secret key**, in the same place (starts with `sb_secret_`). **This one is private.** Treat it like a password.
6. Add them (see section 3 below).

### Create the tables and check they are locked down

Claude Code has written the database set-up in `supabase/migrations/`. The easiest way to apply it, with no extra tools:

1. In Supabase, open **SQL Editor, New query**.
2. Open each file in `supabase/migrations/` on GitHub **in order** (oldest date first: `20261014140000_initial_schema.sql`, then `..150000_explicit_deny_policies.sql`, then `..160000_interview_state.sql`), copy everything, paste it in, and click **Run**. Each should say "Success".
3. Open a new query, paste the contents of `supabase/tests/rls.sql`, and click **Run**. The result should show **ALL RLS CHECKS PASSED**. This script checks that nobody can see anyone else's data. It tidies up after itself and leaves nothing behind.

If either step shows an error, copy the red error text to Claude (it contains no secrets).

You can also ask Claude Code to apply it for you. It will ask before touching your project.

### Tell Supabase where your site lives

1. **Authentication, URL Configuration.**
2. **Site URL:** your real address once you have a domain. Until then use `https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app`.
3. **Redirect URLs:** add each of these (one per line):
   - `http://localhost:3000/**`
   - `https://interview-prep-*-aman-moneysave.vercel.app/**` (this covers every Vercel preview of this project)
   - your real domain, `https://yourdomain.com/**`, when you have it

### Make the sign-in email send a code (founder's choice, 16 Oct 2026)

People sign in by typing a one-time code from the email, not by clicking a link. A code works on any device (read the email on your phone, type the code on your laptop), and it can't be used up by the virus scanners some university email systems run on every link. Supabase's own email only contains a link, and **Supabase lets you change the email only once a custom email sender is connected** (see the next section; on the playbook this is Day 2). Then:

1. **Authentication, Email Templates.**
2. Open **Magic Link**. Replace the whole message with:

   ```html
   <h2>Your CaseSpar sign-in code</h2>
   <p>Type this code on the sign-in page:</p>
   <p style="font-size:32px;font-weight:700;letter-spacing:6px;font-family:monospace">{{ .Token }}</p>
   <p>It works once and expires soon. You can read this email on your phone and type the code on your computer.</p>
   <p>If you didn't ask for this, you can ignore this email.</p>
   ```

3. Open **Confirm sign up** and paste the same text. (New people get this one the first time.)
4. Send yourself a test sign-in and type the code on the sign-in page.

Until the template is changed, the email has only a link, and that link works only in the browser where the sign-in was started (the site says so). The sign-in page asks for the code first and explains this.

### Email sending: needed before anyone but you can log in

Supabase's built-in email sender is for testing only. It refuses to send to anyone who is not a member of your Supabase team ("Email address not authorized"), and it is heavily limited. **Before you invite real students you need to connect an email-sending service.** Supabase works with Resend, AWS SES, Postmark, Brevo and others.

This is a new third-party service, so it needs your decision (and may cost money once you have volume). Tell Claude when you are ready and it will walk you through it. You will need a domain you own first, because good email needs it. Then: **Authentication, SMTP Settings** in Supabase.

Also worth doing before launch (P7): turn on **CAPTCHA** (Authentication, Attack Protection) so bots cannot use your sign-in form to flood strangers with emails.

### Sign in with Google and Apple (founder's request, 18 Oct 2026)

The login page can show "Continue with Google" and "Continue with Apple" above the email box. Supabase does the sign-in; a button appears only once its provider is switched on. The click-by-click for Claude in Chrome is `docs/CHROME_SETUP.md`, parts J (Google) and K (Apple).

1. **Google** is free. Run part J. Then set `NEXT_PUBLIC_SIGNIN_PROVIDERS=google` in Vercel (Preview first) and redeploy.
2. **Apple** is built but switched off (founder, 18 Oct 2026: "leave out Apple for now"). The founder already has an Apple Developer account. When he wants it: run part K, add Apple to the privacy paragraph about Google, then set `NEXT_PUBLIC_SIGNIN_PROVIDERS=google,apple`.
3. **Apple's secret key lasts at most six months.** Make a new one every five months (Supabase's tool, or `node scripts/apple-client-secret.mjs <AuthKey file> <Team ID> <Key ID> app.casespar.signin`, which prints only the secret so it can be piped to the clipboard) and paste it into Supabase, Authentication, Sign In / Providers, Apple. Put the reminder in your calendar when you first set it up. If the secret runs out, the Apple button stops working; email sign-in keeps working.
4. People who choose Apple's "Hide My Email" get a private address. Emails to it (receipts, if we send any) only arrive after the sending domain is registered under Apple Developer, Services, Sign in with Apple for Email Communication.

## 2. Vercel (needed for the preview link)

1. Go to vercel.com, **Add New, Project**, and import the GitHub repo.
2. Framework should be detected as Next.js. Click **Deploy**.
3. Free "Hobby" is fine while you are building. **You must move to Pro before taking real payments**, because Hobby is for non-commercial use.
4. Open **Settings, Environment Variables** and add the three Supabase values from step 1 (see below). Tick **Production and Preview**.

## 2b. Anthropic (the AI interviewer)

1. Go to console.anthropic.com and sign in.
2. **Billing:** set a **monthly spend limit** first (for example $20 while testing). This is the safety net that stops a surprise bill. (Checked 16 Oct 2026: the spend limit is under Billing; the "Limits" page holds only rate limits.)
3. **API keys, Create key.** Copy it once; it is shown only one time.
4. Add `ANTHROPIC_API_KEY` (private) and `ANTHROPIC_MODEL` (for example `claude-sonnet-5-5`) in Vercel, Production and Preview. Sonnet costs about 12 cents per interview; see `docs/PROGRESS.md` for the full cost table.
5. Until both are set, the site shows "The AI interviewer isn't switched on yet" and nothing is charged.

## 2c. Stripe (payments, test mode first)

Nothing is charged for real until you switch Stripe to live mode at launch (P7). Everything below is in **test mode**: keep the "Test mode" switch on, top right in Stripe.

1. Go to stripe.com and sign in (or create the account for this business).
2. **Developers, API keys:** copy the **Secret key** (starts `sk_test_`). Add it in Vercel as `STRIPE_SECRET_KEY` (Sensitive, Production and Preview). You do **not** need to create products: the site creates the $39 and $99 prices itself when someone pays. (If you would rather use prices you made in Stripe, add their ids as `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_PASS90`.)
3. **Billing, Customer portal:** open it and click **Activate test link** (or Save). Tick "Customers can cancel subscriptions" and "update payment methods". Without this, "Manage billing" shows an error.
4. **Developers, Webhooks, Add endpoint.** Address: `https://YOUR-SITE/api/stripe/webhook`. Choose these events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`. After saving, reveal the **Signing secret** (starts `whsec_`) and add it in Vercel as `STRIPE_WEBHOOK_SECRET` (Sensitive).
   - While the site is only on Vercel preview links (behind your Vercel login), Stripe cannot reach the webhook. That is fine for testing: when someone pays, the page they land on asks Stripe about the payment and switches the plan on straight away. The webhook is what handles renewals, cancellations and refunds later, so point it at the real address before launch.
5. Try it: on the pricing page click **Get the 90-Day Pass**, pay with the test card `4242 4242 4242 4242` (any future date, any 3 digits), and check **Account** shows the pass.
6. To test without paying, in Stripe create a **Coupon** (100% off, once) and a **Promotion code** for it, then type that code on the Stripe payment page.

Money rules in the code: card details never touch this site (Stripe's page takes them); a refund of a 90-Day Pass in Stripe takes its 90 days back; deleting an account first deletes the person's Stripe customer, which cancels any subscription.

## 3. Where the keys go

| Value | Name to use | Private? |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | No |
| Publishable key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No |
| Secret key | `SUPABASE_SECRET_KEY` | **Yes** |
| Anthropic key | `ANTHROPIC_API_KEY` | **Yes** |
| Stripe secret key | `STRIPE_SECRET_KEY` | **Yes** |
| Stripe webhook secret | `STRIPE_WEBHOOK_SECRET` | **Yes** |
| Model name | `ANTHROPIC_MODEL` | No |
| Clean-up password: any long random text you make up (a password manager can generate one) | `CRON_SECRET` | **Yes** |
| Your own email, so you can open `/admin` (several emails: separate them with commas) | `ADMIN_EMAILS` | No, but keep it to yourself |
| Support inbox shown on the site | `NEXT_PUBLIC_SUPPORT_EMAIL` | No |
| The real web address, once you have a domain (e.g. `https://casespar.app`) | `NEXT_PUBLIC_SITE_URL` | No |
| Optional: a separate key for share links (any long random text) | `SHARE_SIGNING_SECRET` | **Yes** |
| Temporary, **Preview only**: `1` lets an `ADMIN_EMAILS` address sign in on the preview with no email. Delete it before sharing a preview link. Never for Production (it is ignored there) | `PREVIEW_QUICK_LOGIN` | No |

- **In Vercel:** Settings, Environment Variables. Mark `SUPABASE_SECRET_KEY`, `CRON_SECRET` and `SHARE_SIGNING_SECRET` as **Sensitive**.
- **The daily clean-up** (deletes interview chats after 365 days, usage events after 180 days and university enquiries after 24 months) runs by itself once `CRON_SECRET` is set in Vercel (Production). Without it the clean-up refuses to run.
- **For Claude Code in a cloud session:** the cloud environment menu in the session's title bar, then **Edit**, then add them as environment variables. Start a new session afterwards so it picks them up.
- **On your own computer:** copy `.env.example` to `.env.local` and fill in the values. `.env.local` is never uploaded to GitHub.

Anything starting `NEXT_PUBLIC_` can end up in the browser, so it must never be a secret. The automated tests check this.

## 4. Try it

1. Run the site (`npm run dev`) or open your Vercel preview link.
2. Click **Start free, no card needed**, enter your email, and sign in.
3. On **Account** you should see your email and **Free** plan, a **Download my data** button, and the delete option.
