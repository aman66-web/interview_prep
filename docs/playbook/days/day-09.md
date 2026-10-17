# Day 9 of 90 · Sat 24 Oct 2026 · Test real money, privately

**Why today matters:** One real purchase and one real refund prove the money side works before any stranger pays.

About 70 minutes in total. 5 tasks, in order.

## d9-1: Approve merging the finished site into main, while production stays private behind your Vercel login.

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 10 minutes

**Steps**

1. This is your yes to the merge: production on casespar.app needs the finished site and the live keys before you can test a real purchase there.
2. Strangers still can't see it: Vercel Authentication stays on until tomorrow's check.
3. Wait for Claude to say the production build is Ready.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, I approve merging the PR branch claude/gifted-shannon-r42f73 into main today, following the checklist you gave me yesterday, so that production on casespar.app runs the finished site with the live Stripe keys for my private test purchase. Keep Vercel Authentication on for production: the site must stay private until I say so tomorrow (Day 10). Run all the tests first, then merge, then tell me when the production build is Ready and which address to test on.
````

## d9-2: Let Chrome make a one-use $1 test code for the refund test.

- **Who:** Claude in Chrome
- **Time:** about 10 minutes

**Steps**

1. A 100% code charges nothing, so there is nothing to refund. This $1 code gives you a real charge you can refund.
2. Cost: $1 plus Stripe's fee on it, which may not come back when you refund. Your decision.

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
In my live CaseSpar Stripe account (not test mode, and not the Preflight Pass accounts), first tell me Stripe's minimum charge for US dollars and stop if $1 is below it. Then create a coupon of $98 off, used once, and a promotion code FOUNDERREFUND for it, limited to 1 redemption, so the $99 90-Day Pass costs me $1. Don't change anything else.
````

## d9-3: Do one live purchase with FOUNDERTEST, one with FOUNDERREFUND, then refund the $1.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 30 minutes

**Steps**

1. Open https://casespar.app in Chrome. You're logged in to Vercel, so you can see it; strangers can't.
2. Sign in with your second email address from Day 5, not aman662002@gmail.com. Your main account still holds the test-mode purchase from the preview (Day 1), and live Stripe can't use that test record. The preview and the live site share one database.
3. Open Pricing, choose the 90-Day Pass, tick the box, and on Stripe's page enter the code FOUNDERTEST. The total should be $0. Complete it.
4. Check Account shows the 90-Day Pass ending about 90 days from today.
5. Buy the 90-Day Pass again with the code FOUNDERREFUND and pay $1 with your own card. Check Account now shows about 180 days.
6. Sign out, sign in with aman662002@gmail.com and open /admin. The $1 order should show as one paid order. The $0 FOUNDERTEST order is not counted: the site only counts orders that took money (that is how it's built).
7. In Stripe (live mode), open Payments, open the $1 payment, click Refund and refund the full amount.
8. Write down what Account (on the second address) shows now. It may not change until the site is public, because Stripe can't reach the site behind the Vercel login.

## d9-4: Ask Claude to add your key numbers to the admin page (build B7).

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 10 minutes

**Steps**

1. Paste the message below. You'll copy the 'this week's numbers' table into your playbook every Thursday.
2. If Claude lists test rows to remove, say yes only if you understand what each one is. Ask Claude anything that isn't clear.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, please add to the admin page: paying customers and revenue by first-touch source, campaign and keyword (utm_source, utm_campaign, utm_term), the share of sign-ups who finish the free interview, where unfinished interviews stop, and a 'this week's numbers' table I can copy into my playbook (sign-ups, finished free interviews, paid, revenue, AI cost). No new trackers or cookies. The preview and the live site share one database, so: count only live-mode purchases as revenue (my test-mode purchase from the preview must never count); leave my own accounts out of every number (the ADMIN_EMAILS address and any test addresses I list on the admin page); and tell me which test-mode rows from my preview tests (for example my main account's test Monthly plan and its test Stripe customer) you'd remove from the real database. Ask me before deleting anything.
````

## d9-5: Ask Claude how to finish the refund test once the site is public.

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 10 minutes

**Steps**

1. Paste the message below and keep Claude's steps for tomorrow (task d10-4).

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, signed in with my second email address, I bought the 90-Day Pass on casespar.app with FOUNDERTEST, then again for $1 with FOUNDERREFUND, then refunded the $1 in Stripe. While production is behind the Vercel login, Stripe's webhook can't reach the site. Tell me in plain steps how to re-send that refund event from Stripe once the site is public tomorrow, and exactly what my Account page should show before and after.
````

## Write down today

Write down: the merge to main done and the production build Ready (yes/no), the FOUNDERTEST order worked, the $1 order worked, the refund made in Stripe, and what Account showed after the refund.

---
[← Day 8](day-08.md) · [Day 10 →](day-10.md)
