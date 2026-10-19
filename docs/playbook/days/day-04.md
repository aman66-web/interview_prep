# Day 4 of 90 · Mon 19 Oct 2026 · Hire the reviewer and hand over the first 5 cases

**Why today matters:** No case can go live until a person with consulting interview experience signs it off, and the free starter case is the one every visitor sees first.

About 120 minutes in total. 5 tasks, in order.

## d4-1: Hire your reviewer on Upwork and agree the fee in writing.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 30 minutes

**Steps**

1. Pick the person with the strongest real case interview experience who can return the first 5 cases by Thursday 22 October.
2. Make the offer as a fixed-price contract with one milestone per batch of 5 cases. The fee is yours to set. Check the total Upwork shows, including any fees, before you pay.
3. Put the dates in the contract: batch 1 (the starter case and 4 more) by Thu 22 Oct, batch 2 by Thu 29 Oct, batch 3 by Thu 12 Nov, batch 4 by Thu 19 Nov.
4. Keep the other two shortlisted people's details. You may need a second reviewer on Day 10.

## d4-2: Ask Claude for the reviewer pack (build B4).

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 15 minutes

**Steps**

1. Paste the message below with your reviewer's name.
2. Claude tells you where the answer key files are. Download them.
3. Write down the 4 cases Claude picks for batch 1, and its order for the other 15.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, I've hired [reviewer's name] to review the cases. Please export the answer key for Harbourline Bakeries and the next 4 cases you think are strongest (facts, exhibits, maths with working, model answer), one file per case, plus a short cover note pointing to docs/REVIEWER_GUIDE.md and docs/CASE_REVIEW_NOTES.md. Then do the same for the other 15.
````

## d4-3: Make a share link so the reviewer can see the preview without a Vercel account.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 10 minutes

**Steps**

1. First tell Claude: 'Please switch off the preview quick log-in before I share a preview.' Wait until Claude says the new preview is ready, then make the link from that newest preview. (While the shortcut is on, anyone who opens the preview and types your email is signed in as you.)
2. In Vercel open project interview-prep, then Deployments.
3. Select the newest preview deployment and click Share.
4. Choose 'Anyone with the link' in the dropdown and copy the link.
5. The link shows that one deployment, so make a fresh one after big changes. To stop it working, switch the dropdown back to 'Only people with access'.

## d4-4: Send the reviewer the brief, the link and the answer keys.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 20 minutes

**Steps**

1. Send the message below as an Upwork message, so it is on record.
2. Attach REVIEWER_GUIDE.md, CASE_REVIEW_NOTES.md and the 5 answer key files (download the two guides from the docs folder on GitHub).

**Text to use (post, email or message)** (copy exactly):

````text
Hi [reviewer's name],

Welcome aboard, and thank you. Here's everything you need:
1. The preview site: [the share link]. Each case has its own page at /cases/ followed by the case name. All 20 drafts are there.
2. The brief (what I'd like you to answer for each case) and background notes on each case: attached (REVIEWER_GUIDE.md and CASE_REVIEW_NOTES.md).
3. The answer key for each of the first 5 cases (facts, exhibits, maths with working, model answer): attached, one file per case.

Please start with Harbourline Bakeries (the free starter case, the most important one), then [the 4 cases Claude picked]. For each, answer the six questions in the brief and finish with one of: 'Sign off as it is', 'Sign off after these small changes' or 'Needs rework'. Could you send the first 5 by Thursday 22 October?

Two rules: please don't copy or adapt cases from casebooks, firms or other prep sites into your suggestions (every case must stay original), and please keep the cases and answer keys confidential: don't share them or use them anywhere else.

Thanks,
[your name]
````

## d4-5: Test the tuned interviewer on a second case.

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 45 minutes

**Steps**

1. On the preview, start Wrenfield Hotels (an easy profitability case). Do it properly, about 25 minutes, no calculator.
2. Check: does the interviewer feel realistic? Is the debrief specific rather than general praise? Are the maths results right?
3. Send Claude the message below with anything that still felt off.

**Text to use (post, email or message)** (copy exactly):

````text
Claude, I did Wrenfield Hotels on the preview after your tuning. What still felt off: [your notes]. Please adjust lib/ai/prompt.ts if needed, run the tests and push to the PR branch.
````

## Write down today

Write down: the reviewer's name and agreed fee, the 5 cases in batch 1, the share link date, and what still felt off in Wrenfield Hotels.

---
[← Day 3](day-03.md) · [Day 5 →](day-05.md)
