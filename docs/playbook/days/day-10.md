# Day 10 of 90 · Sun 25 Oct 2026 · Launch check, then open the doors

**Why today matters:** If all seven checks pass, mockpartner.com opens to the public today, in time for the UK case interview season.

About 100 minutes in total. 4 tasks, in order.

## d10-1: Go through the launch check and write yes or no next to each item.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 45 minutes

**Steps**

1. 1. Sign-in: your Day 5 test worked for a second address (and a university address if you managed one), and CAPTCHA is on.
2. 2. Cases: Harbourline Bakeries and at least 4 more are signed off and show on mockpartner.com (you can see it while logged in to Vercel).
3. 3. Money: yesterday's FOUNDERTEST purchase worked, the $1 refund shows in Stripe, and the live webhook points at mockpartner.com (Stripe, Developers, Webhooks). The site's side of the refund is checked straight after opening (task d10-4).
4. 4. ICO: the fee is paid for MARTZEY LTD, or you have confirmed the existing entry covers this site.
5. 5. Legal: no square brackets left on the terms, privacy, refunds and disclaimer pages, and the lawyer's view on no-refunds and the tick box is in, or you have written down your decision to open without it.
6. 6. Support and settings: an email to hello@mockpartner.com arrives; NEXT_PUBLIC_SUPPORT_EMAIL, CRON_SECRET and ADMIN_EMAILS are in Vercel; /admin opens.
7. 7. AI: you read a real interview, Claude tuned the prompts, and the Anthropic monthly limit is set.

## d10-2: If all 7 are yes: approve merging the last changes into main.

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 10 minutes

**Steps**

1. Only if every item in task d10-1 is yes.
2. Wait for Claude to say the production build is Ready.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, the Day 10 launch check passed. I approve merging the latest changes on the PR branch into main (yesterday's admin numbers, the signed-off cases, the About and FAQ pages, the three fact-checked guide pages, and any clean-up of my preview test data that I've said yes to). Run all the tests first, then merge, and tell me when the production build is Ready. Don't change Vercel Authentication; Chrome will do that.
````

## d10-3: Let Chrome make production public (previews stay private).

- **Who:** Claude in Chrome
- **Time:** about 15 minutes

**Steps**

1. Only after task d10-2 is Ready.
2. Previews must stay behind the login, because they show draft cases.
3. Say yes in the chat only when Chrome shows you the right setting.

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
In Vercel, project interview-prep, open Settings, then Deployment Protection. Change Vercel Authentication so it protects preview deployments only, not production (previews must stay behind the login, because they show draft cases). Show me the setting before you save, and wait for my yes. Then open https://mockpartner.com in a new private window and tell me whether it loads without a Vercel login.
````

## d10-4: Check the live site as a stranger would, and finish the refund test.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 30 minutes

**Steps**

1. On your phone, turn off Wi-Fi and open https://mockpartner.com. It should load with no Vercel login.
2. Check the footer shows the line 'Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site', and that /cases shows only the reviewed cases.
3. Follow Claude's steps from yesterday (task d9-5) to re-send the refund event from Stripe. Sign in with your second email address and check Account shows about 90 days left, not 180.
4. If something is badly wrong (sign-in fails, draft cases show, or the refund never arrives), tell Chrome: 'In Vercel, project interview-prep, Settings, Deployment Protection: switch Vercel Authentication back on for production now.' Then tell Claude exactly what you saw.

## Write down today

Write down: each of the 7 checks (yes or no), the time the site went public, and the reviewed cases live.

## Decision point

**Check:** Is the site ready for strangers? All 7 checks in task d10-1 are yes: sign-in works for other people's addresses with CAPTCHA on; Harbourline Bakeries plus at least 4 more cases signed off and on production; one live FOUNDERTEST purchase and one refund done, live webhook on mockpartner.com; ICO fee paid or confirmed; legal placeholders filled and the lawyer's view in (or your recorded decision); hello@mockpartner.com works and NEXT_PUBLIC_SUPPORT_EMAIL, CRON_SECRET and ADMIN_EMAILS are set, /admin opens; a real AI interview read, prompts tuned and the Anthropic limit set.

- **If yes:** Approve the merge to main and make production public today (tasks d10-2 and d10-3). Soft launch tomorrow (Day 11).
- **If no:** Don't open yet. Fix what failed. If the reviewer is the hold-up, hire a second reviewer today and split the cases. Re-check every day and open by Day 15 at the latest with whatever is reviewed, as long as the free starter case is signed off. If even that isn't signed off by Day 15, don't open: all effort goes into a second reviewer. Until you open, skip the posts and messages in the days that follow and do only the build and fix tasks.

---
[← Day 9](day-09.md) · [Day 11 →](day-11.md)
