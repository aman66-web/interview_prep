# Day 8 of 90 · Fri 23 Oct 2026 · First sign-offs in, live payments set up

**Why today matters:** The reviewer's first batch and a live Stripe account are the two things the Day 10 launch check needs most.

About 120 minutes in total. 4 tasks, in order.

## d8-1: Record the reviewer's first batch: Harbourline Bakeries and 4 more (build B5).

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 15 minutes

**Steps**

1. Send one message per case, or list all 5 in one message, each with its own date and changes.
2. Skip any case marked 'Needs rework': ask Claude to make the changes and send them back to the reviewer.
3. Aim: 5 reviewed cases by today.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
The reviewer [reviewer's name] signed off [case name] on [date]. Their changes: [paste the reviewer's notes]. Please make the changes, mark it reviewed, run npm run content:check and push to the PR branch.
````

## d8-2: Ask Claude for the go-live pack (build B6).

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 10 minutes

**Steps**

1. Paste the message below.
2. Copy Claude's Stripe steps for the next task, and keep its merge checklist for tomorrow.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, the reviewer has signed off the starter case and 4 more. Please get the site ready to go public on mockpartner.com: write the Claude in Chrome steps to create a separate 'Mock Partner' Stripe account for MARTZEY LTD (statement descriptor MOCK PARTNER, like Preflight Pass), activate live mode, add the live webhook for mockpartner.com, make a one-use 100% FOUNDERTEST promotion code and put the live keys into Vercel for Production only, so Preview keeps test-mode keys and previews never take real money (I paste the secret keys myself); turn on Vercel Web Analytics; add the IndexNow key and script; write the Search Console and Bing steps; and give me the checklist for merging the PR into main. Tell me before anything costs money. Don't merge or push to main: I'll approve that.
````

## d8-3: Let Chrome set up the live Mock Partner Stripe account with Claude's steps.

- **Who:** Claude in Chrome
- **Time:** about 75 minutes

**Steps**

1. Paste the message below with Claude's steps where shown.
2. You type every bank, phone, identity and card detail yourself.
3. You paste the live secret keys into Vercel yourself with Ctrl+V. Chrome never reads or types them.
4. If Stripe asks for documents to verify the company, upload them yourself. Verification can take a while; carry on with the rest.
5. Check at the end: in Vercel, STRIPE_SECRET_KEY for Production is the live key and Preview still has a test key (Chrome can say which without reading either).

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
Do the Stripe live-mode steps Claude wrote (B6). I'll type all bank, identity and card details. Never read or type a secret key. Also activate the live Customer portal with the same settings as in test mode (cancel at the end of the billing period; customers can update payment methods). Put the live keys in Vercel for Production only; Preview must keep a test-mode key. If the test-mode key now in Vercel's Preview came from a different Stripe account, replace it with this Mock Partner account's test-mode key (Preview only) and activate this account's test-mode Customer portal too, so previews and the live site use the same Stripe account. Here are Claude's steps:

[paste Claude's steps]
````

## d8-4: Pay batch 1 and book batch 2 with the reviewer.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 20 minutes

**Steps**

1. If you're happy with batch 1, approve and pay its milestone on Upwork (the amount you agreed; your decision).
2. Send the message below with the next 5 cases from Claude's list.
3. If the reviewer hasn't sent batch 1, ask for a firm date today. If they can't finish Harbourline Bakeries by Saturday, hire your next shortlisted person for half of the cases (your decision on the fee).

**Text to use (post, email or message)** (copy exactly):

````text
Hi [reviewer's name], thank you for the first 5, that's really helpful. Could you do these 5 next, by Thursday 29 October: [the next 5 cases from Claude's list]? Same brief as before. Thanks, [your name]
````

## Write down today

Write down: reviewed cases so far (aim 5), and whether the live Stripe account is set up.

---
[← Day 7](day-07.md) · [Day 9 →](day-09.md)
