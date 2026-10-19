# Day 5 of 90 · Tue 20 Oct 2026 · Prove other people can sign in

**Why today matters:** Sign-in for other people's email addresses is the first item on the Day 10 launch check; until it works the site can serve nobody but you.

About 150 minutes in total. 5 tasks, in order.

## d5-1: Test sign-in with an email address that isn't your Supabase one.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 30 minutes

**Steps**

1. On the preview, open Account and sign out.
2. Click Start free and enter a second address you own (for example your Hotmail, or a new Gmail).
3. Check the email arrives within a couple of minutes (look in spam too), that it comes from casespar.app, and that the Sign in link works.
4. Sign out, start again with the same address, and this time type the 6-digit code instead of clicking the link.
5. Check the CAPTCHA check appears on the sign-in page and lets you through.
6. If a friend or relative with a university email is happy to help, send them yesterday's share link and ask them to try signing in. (They will see draft cases on the preview; that's fine.)
7. If anything fails, send Claude the message below.

**Text to use (post, email or message)** (copy exactly):

````text
Claude, signing in with an address that isn't my Supabase one didn't work on the preview. What I did: [your steps]. What I saw: [the error or what happened]. Please find out why and fix it, or give me the steps for Chrome.
````

## d5-2: Fact-check search page 1: case interview maths without a calculator.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 45 minutes

**Steps**

1. Open Claude's draft (the link it gave you on Day 3).
2. Open each firm page it links to and check the sentence about that firm says the same thing as the firm's page.
3. Redo every number with your phone calculator.
4. Check it reads easily and has the 'not affiliated' line wherever a firm is named.
5. Send Claude your notes.

**Text to use (post, email or message)** (copy exactly):

````text
Claude, here are my fact-check notes on the page 'Case interview maths without a calculator': [your notes]. Please fix them and keep the page unpublished until the site goes live.
````

## d5-3: Check Claude's changes to the legal pages on the preview.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 20 minutes

**Steps**

1. On the preview, open /legal/terms, /legal/privacy, /legal/refunds and /legal/disclaimer.
2. Look for any square brackets left, and check MARTZEY LTD's details and the ICO number are right.
3. Send Claude the message below.

**Text to use (post, email or message)** (copy exactly):

````text
Claude, I've read the terms, privacy, refunds and disclaimer pages on the preview. Square brackets still left: [list them, or 'none']. Other changes: [your notes, or 'none']. Please fix them and push to the PR branch.
````

## d5-4: Book the lawyer if their fee suits you.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 15 minutes

**Steps**

1. If the lawyer has quoted, decide (your decision). If yes, send the Day 3 email (task d3-5) with the brief attached.
2. If nobody has replied, email the second firm on Chrome's list with the Day 2 email (task d2-4).

## d5-5: Do one more full practice interview on a different case type: How big is the US dog-walking market? (market sizing).

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 40 minutes

**Steps**

1. On the preview, start the US dog-walking market case. Do it properly, about 25 minutes, no calculator.
2. Check the interviewer handles your assumptions sensibly, pushes back where it should, and that the debrief's maths results are right.
3. Send Claude the message below with anything that felt off.

**Text to use (post, email or message)** (copy exactly):

````text
Claude, I did the US dog-walking market case on the preview. What felt off: [your notes, or 'nothing']. If it needs it, please adjust lib/ai/prompt.ts for market sizing cases, run the tests and push to the PR branch.
````

## Write down today

Write down: sign-in with a second address (link worked yes/no, code worked yes/no, CAPTCHA showed yes/no), search page 1 checked, legal pages checked, the lawyer booked yes/no.

---
[← Day 4](day-04.md) · [Day 6 →](day-06.md)
