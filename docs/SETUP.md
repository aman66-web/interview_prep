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

### Make the sign-in email work for university students

Some university and company email systems open every link in an email to scan it for viruses. That uses up a normal one-click sign-in link before the student clicks it, and they see "link expired". The site is built to cope (the link goes to a page with a **Continue** button, and there is also a 6-digit code), but it needs the email text changed once:

1. **Authentication, Email Templates.**
2. Open **Magic Link**. Replace the whole message with:

   ```html
   <h2>Your sign-in link</h2>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
   <p>Or type this code on the sign-in page: <strong>{{ .Token }}</strong></p>
   <p>The link and code work once and expire soon. If you didn't ask for this, you can ignore this email.</p>
   ```

3. Open **Confirm sign up** and paste the same text. (New people get this one the first time.)
4. Send yourself a test sign-in **using the email address of your Supabase account (aman662002@gmail.com)**, because the built-in sender refuses anyone else, and tell Claude whether the link and the code both worked. This is the one piece that could not be tested without a real project.

### Email sending: needed before anyone but you can log in

Supabase's built-in email sender is for testing only. It refuses to send to anyone who is not a member of your Supabase team ("Email address not authorized"), and it is heavily limited. **Before you invite real students you need to connect an email-sending service.** Supabase works with Resend, AWS SES, Postmark, Brevo and others.

This is a new third-party service, so it needs your decision (and may cost money once you have volume). Tell Claude when you are ready and it will walk you through it. You will need a domain you own first, because good email needs it. Then: **Authentication, SMTP Settings** in Supabase.

Also worth doing before launch (P7): turn on **CAPTCHA** (Authentication, Attack Protection) so bots cannot use your sign-in form to flood strangers with emails.

## 2. Vercel (needed for the preview link)

1. Go to vercel.com, **Add New, Project**, and import the GitHub repo.
2. Framework should be detected as Next.js. Click **Deploy**.
3. Free "Hobby" is fine while you are building. **You must move to Pro before taking real payments**, because Hobby is for non-commercial use.
4. Open **Settings, Environment Variables** and add the three Supabase values from step 1 (see below). Tick **Production and Preview**.

## 2b. Anthropic (the AI interviewer)

1. Go to console.anthropic.com and sign in.
2. **Settings, Limits:** set a **monthly spend limit** first (for example $20 while testing). This is the safety net that stops a surprise bill.
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
| The real web address, once you have a domain (e.g. `https://mockpartner.com`) | `NEXT_PUBLIC_SITE_URL` | No |
| Optional: a separate key for share links (any long random text) | `SHARE_SIGNING_SECRET` | **Yes** |

- **In Vercel:** Settings, Environment Variables. Mark `SUPABASE_SECRET_KEY`, `CRON_SECRET` and `SHARE_SIGNING_SECRET` as **Sensitive**.
- **The daily clean-up** (deletes interview chats after 365 days) runs by itself once `CRON_SECRET` is set in Vercel (Production). Without it the clean-up refuses to run.
- **For Claude Code in a cloud session:** the cloud environment menu in the session's title bar, then **Edit**, then add them as environment variables. Start a new session afterwards so it picks them up.
- **On your own computer:** copy `.env.example` to `.env.local` and fill in the values. `.env.local` is never uploaded to GitHub.

Anything starting `NEXT_PUBLIC_` can end up in the browser, so it must never be a secret. The automated tests check this.

## 4. Try it

1. Run the site (`npm run dev`) or open your Vercel preview link.
2. Click **Start free, no card needed**, enter your email, and sign in.
3. On **Account** you should see your email and **Free** plan, a **Download my data** button, and the delete option.
