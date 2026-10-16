# Day 2 of 90 · Sat 17 Oct 2026 · Real address, real sign-in emails, first real interview

**Why today matters:** Until sign-in emails come from your own domain, nobody but you can log in, so today unblocks every later step.

About 155 minutes in total. 5 tasks, in order.

## d2-1: Ask Claude to prepare the domain, the sign-in emails, the support inbox and CAPTCHA (build B1).

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 10 minutes

**Steps**

1. Only if you bought mockpartner.com yesterday.
2. Open a Claude Code cloud session on the interview_prep repository and paste the message below.
3. Claude pushes its code changes to the PR branch and gives you click-by-click steps for Chrome. Copy those steps for the next task.
4. If something costs money (for example an email service plan), Claude tells you the price first. Your decision.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, I've bought mockpartner.com in Vercel. Please (1) make every code and settings change the site needs for the new address, (2) write click-by-click steps for Claude in Chrome to attach the domain to the interview-prep project, set up Resend so sign-in emails come from mockpartner.com and connect it to Supabase as the email sender, add ImprovMX forwarding for hello@mockpartner.com to my inbox, update Supabase's Site URL and Redirect URLs, and switch on CAPTCHA for sign-in, and (3) tell me before anything that costs money. Push to the PR branch, not main.
````

## d2-2: Let Chrome do Claude's domain, email, inbox and CAPTCHA steps.

- **Who:** Claude in Chrome
- **Time:** about 60 minutes

**Steps**

1. In your terminal (claude --chrome), paste the message below with Claude's steps pasted where shown.
2. Wait until Claude says its code changes are on the preview before Chrome switches CAPTCHA on in Supabase. If CAPTCHA goes on first, sign-in stops working until the new code is there.
3. Type logins, 2FA codes and any payment details yourself. Paste any secret key into Vercel yourself with Ctrl+V.
4. When ImprovMX says Active, send an email to hello@mockpartner.com from another address and check it reaches your inbox.

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
Do the domain, Resend, ImprovMX, Supabase and CAPTCHA steps Claude wrote (B1). Stop for logins, codes and anything that costs money. When hello@mockpartner.com forwarding works, also add NEXT_PUBLIC_SUPPORT_EMAIL with the value hello@mockpartner.com in Vercel, project interview-prep (Production and Preview, not sensitive). Here are Claude's steps:

[paste Claude's steps]
````

## d2-3: Check the ICO data protection fee and find 3 lawyers who do a fixed-fee review.

- **Who:** Claude in Chrome
- **Time:** about 25 minutes

**Steps**

1. Paste the message below into Chrome.
2. If MARTZEY LTD is not on the ICO register, pay the fee yourself on the ICO page. A micro organisation (turnover up to £632,000 or no more than 10 staff) pays £52 a year, or £47 by direct debit (https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/). Your decision; you type the payment details.
3. If MARTZEY LTD is already on the register, note the registration number and check with the ICO that the entry covers the new site.
4. Write down the registration number. Claude adds it to the privacy page tomorrow.
5. From Chrome's list of lawyers, pick the one whose fee and timing suit you best.

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
Two research jobs. Public pages only, don't contact anyone and don't pay anything. 1) Open https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/ and find the ICO's public register of fee payers. Search it for MARTZEY LTD (company number 14466643). Tell me whether there is a live entry, its registration number and its expiry date. 2) Find 3 UK solicitors or law firms that offer a fixed-fee review of website terms for an online consumer subscription business (refunds, the 14-day cancellation right for digital content, and email marketing rules). For each, give the firm's name, its published fixed fee (or 'not published') and its contact page. Put both answers in a short table.
````

## d2-4: Email the lawyer you picked and ask for a fixed fee.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 15 minutes

**Steps**

1. Send the email below from your usual address (or paste it into the firm's contact form).
2. Don't agree to anything yet. You decide once you see the fee.

**Text to use (post, email or message)** (copy exactly):

````text
Subject: Fixed-fee review: consumer terms for a UK online subscription site

Hello,

I run MARTZEY LTD (company number 14466643), which is about to launch Mock Partner, a UK website that sells online case-interview practice to students and graduates: $39 a month (a subscription) or $99 for a 90-day pass.

I'd like a short fixed-fee review of three points:
1. Our no-refunds policy: all sales are final, except where the law requires a refund.
2. The tick box before checkout, where buyers ask to start straight away and acknowledge that they lose the 14-day right to cancel for digital content. I'd like you to check its wording.
3. Whether I may email UK student consulting societies at their published sponsorship addresses, one at a time, to offer free access for their members.

I can send a one-page brief and the draft terms, refunds and privacy pages. Could you tell me your fixed fee and how soon you could reply? I'm hoping to open the site on Sunday 25 October.

Kind regards,
[your name]
MARTZEY LTD
````

## d2-5: Do your first real AI interview: the free starter case, Harbourline Bakeries, on the preview.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 45 minutes

**Steps**

1. Open the preview: https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app (log in to Vercel if asked). Sign in with aman662002@gmail.com.
2. From the dashboard, start Harbourline Bakeries. Treat it like a real interview: pen and paper, no calculator, about 25 to 30 minutes.
3. Ask clarifying questions, ask for the exhibits, do the maths, and finish with a recommendation.
4. Read the debrief carefully.
5. Write down 3 things that felt right and 3 that felt off (too kind, wrong, slow, confusing). You send these to Claude tomorrow.
6. If the site says you have used your free interview, open Account: yesterday's test payment should have given you the test Monthly plan. If it didn't, tell Claude.

## Write down today

Write down: ICO registration number (or 'paid today'), the lawyer you emailed, and your 3 good and 3 bad notes from the interview.

---
[← Day 1](day-01.md) · [Day 3 →](day-03.md)
