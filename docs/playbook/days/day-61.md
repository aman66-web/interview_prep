# Day 61 of 90 · Tue 15 Dec 2026 · Write down the Day 60 decisions and start January's builds

**Why today matters:** Yesterday's gate decided which channels and how much ad money January gets; today you write those decisions down and start what they allow, two weeks before BCG London's internship window opens on 1 January (https://careers.bcg.com/global/en/locations/united-kingdom/associate-jobs).

About 130 minutes in total. 5 tasks, in order.

## d61-1: Daily routine and today's LinkedIn post

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 25 minutes

**Steps**

1. Write yesterday's six numbers in the Numbers tab: visitors, free sign-ups, free interviews finished, new paying customers, revenue, ad spend.
2. Alarms: Anthropic under 80% of this month's limit ($150); ads this week (Fri 11 to Thu 17 Dec) under £105, or the lower cap you set; no Vercel errors.
3. Reply to every email in hello@casespar.app and every admin enquiry within 24 hours. Be honest; never promise offers or results.
4. Post the text below this morning (UK). Skip it if you're on 2 posts a week, or if LinkedIn isn't one of the channels you kept yesterday.
5. Then leave a genuinely helpful comment on 2 or 3 posts by other people about case interviews. No links and no selling in those comments.
6. In today's note: one user comment, and your minutes per channel.

**Text to use (post, email or message)** (copy exactly):

````text
Revenue up 20%. Costs up 25%. Is profit up or down?

The quick answer is 'down, because costs grew faster'. Try it with numbers first.

Made-up example:
Last year: revenue £100, costs £80, profit £20.
This year: revenue £120 (+20%), costs £100 (+25%), profit £20.

Profit hasn't moved. Costs grew faster in percentage terms, but from a smaller base, so the extra £20 of cost exactly matches the extra £20 of revenue.

In a case, turn percentages into amounts before you judge them. Pick an easy base like 100, say the numbers out loud, and the answer often surprises you.

Free mental maths drills: https://casespar.app/drills/mental-maths?utm_source=linkedin&utm_medium=social&utm_campaign=post-d61
(I built CaseSpar.)
````

## d61-2: Catch-up: write down the Day 60 decisions and anything that slipped

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 20 minutes

**Steps**

1. Open yesterday's note and copy these five decisions to the top of your Numbers tab: (a) the 2 or 3 free channels you're keeping (search and the email list always stay); (b) January Google Ads: up to £25 a day if a paying customer from ads cost $60 (about £45) or less, £10 to £15 a day if $60 to $88 (about £45 to £66), off if more or if ads were already off; (c) the Reddit Ads test (up to £80, Sat 2 to Mon 11 Jan): yes only if the Day 60 gate passed; (d) the consent banner and Google Ads tag (B19): yes or no; (e) a 12-month plan (B20): yes or no, and your price.
2. Then check what should already be done: 25 reviewed cases live (Day 52); the UK internship batch (5 UK internship cases) sent to the reviewer on Sun 13 Dec (Day 59), with sign-offs asked for by Fri 8 Jan (Day 85); group passes built (only if Day 45 said Go or a partner asked); the Day 59 re-check (only if Day 45 said Adjust). Anything not done goes first on today's list.
3. One rule for the rest of this month: when a task is for a channel you dropped yesterday, skip it and spend those minutes on the next item of the search improvement list (you make it tomorrow, task d62-3).
4. If the Day 60 gate failed (under $1,500 in Days 31 to 60): no ad increase in January, stop ads if a paying customer costs over $88, and give your time to the 2 channels with the most sign-ups per hour. You re-check on Thu 31 Dec (Day 77).

## d61-3: Send Claude this week's search pages and the optional builds you said yes to

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 15 minutes

**Steps**

1. Message 1 always. Message 2 only if (d) was yes: ads stay at £15 a day or more in January and you want Google to learn which clicks lead to sales. Message 3 only if (e) was yes.
2. For message 1, paste in the 4-week search plan Claude gave you on Monday 14 December (task d60-5). A new Claude conversation can't see old ones, so the message also asks Claude to save it in the project as docs/SEARCH_PLAN.md for the later weeks.
3. For message 2: the tag stays switched off until you have its id from Google Ads. Chrome gets that on Saturday (task d65-6), after the banner is live.
4. For message 3, replace [your price] with your price. Rivals' one-year prices (their pricing pages, read 15 Oct 2026; open them again before you decide, because prices change): PrepLounge $69 (peer practice, no AI interviewer), RocketBlocks $155, CaseCoach $199, Road to Offer and CaseTutor $249, MConsultingPrep $399. Our guess (an assumption, not research): about $149 to $179 sits below most rivals and below two 90-Day Passes ($198). Your decision.
5. Nothing goes live until you approve it on the preview (Day 64).

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Message 1:
Claude, please write this week's 2 new guide pages. (1) 'The last week before an MBA first-round case interview: a day-by-day plan' (I need this one whatever your Day 60 search plan says; I'd like it live on Friday 18 December). School dates only from the schools' own pages, with links: NYU Stern, Duke Fuqua, UNC Kenan-Flagler, Wharton and Kellogg. (2) The next page in the 4-week search plan you gave me on Monday 14 December (here it is, in case you can't see it: [paste Claude's Day 60 search plan]); if it doesn't name one, 'Operations case example: capacity and bottlenecks' (original). Please also save that 4-week plan as docs/SEARCH_PLAN.md on the PR branch, so later weeks can use it. Original worked examples only, every number recomputed by tests, plain English, a link to the matching free drill or tool, no firm logos, our 'not affiliated' line wherever a firm is named, and facts about firms only from their own pages. Show me the drafts on the preview link before publishing.

Message 2 (only if I said yes to the ads tag):
Claude, I've decided to allow the Google Ads tag on CaseSpar. Please propose the CLAUDE.md rule 2.7 change for me to approve, then build the consent banner (UK, EEA and Switzerland: nothing loads until Accept), load the tag only after consent, report sign-up and purchase conversions with no personal data, and update the privacy page. Same approach as Preflight Pass. Leave the tag switched off (empty id) until I send you the Google Ads tag id and conversion labels. Show me the rule change, the banner and the privacy wording on the preview; don't merge until I approve.

Message 3 (only if I said yes to a 12-month plan):
Claude, please add a 12-month plan at $[your price] as a third option on the pricing page: one payment, the same access as Monthly, using the same pass logic. Update the pricing page, FAQ and terms. Keep the same 'start straight away' tick box and no-refunds wording at checkout as the other plans. If the pass logic needs a database change, show me the migration and ask before applying it. Run the tests and show me on the preview; don't merge until I approve.
````

## d61-4: Partners: turn January-session replies into dates

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 40 minutes

**Steps**

1. Open your partner list (societies, clubs and careers services with a club code). On Day 50 you asked each about a January session.
2. For each partner who replied with a date: confirm it with the first message below and write the date in your list.
3. For each partner who hasn't answered: send the second message once, one at a time. Partners already work with you, so one short reminder is fine; never send a third.
4. Committees are leaving: LSE and Imperial terms ended on 11 December and Warwick's on 12 December (their term-date pages), so some replies will come in January.

**Text to use (post, email or message)** (copy exactly):

````text
First message (partner who suggested a date):

Hi [first name],

Brilliant, thank you. [Date] works for me. I'll send the case-workshop pack, your members' page and your code a week before, so there's time to read the facilitator notes.

If the date moves, just let me know.

Aman
hello@casespar.app


Second message (partner who hasn't answered, once only):

Hi [first name],

A quick one before the break: would a case practice session early in the spring term be useful for [society name]? I can send a ready-to-run case-workshop pack (one reviewed case with facilitator notes), and your members' code [CODE] keeps working (two extra free AI interviews and 20% off a first purchase). Just reply with a date that suits, or 'not this term', and I'll plan around it. If you'd rather I didn't email about this, just say and I won't.

Aman
hello@casespar.app
````

## d61-5: One helpful Reddit answer, where the rules allow

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 30 minutes

**Steps**

1. Find one recent question like 'how do I know if I'm ready for case interviews?' in a subreddit whose saved rules (the Day 13 file) allow answers like this.
2. Adapt the answer below to the question. Keep the disclosure paragraph only if that subreddit allows self-promotion and it's relevant; otherwise delete it.
3. Post from your own account. Never post as a student, never use a second account, never ask anyone to upvote. If 2 of your posts were removed in one subreddit, don't post there again.
4. If Reddit isn't one of your kept channels, skip this and spend the time on task d61-4.
5. In today's note: the link.

**Text to use (post, email or message)** (copy exactly):

````text
A rough checklist I'd use (my view, not a firm's rule):

- You can give a clear structure for a new case within about a minute, and say why each part is there.
- You can do two-step maths by hand without losing a zero (for example 3.2 million × $45).
- When you get a chart or table, you say the one thing that matters before reading numbers back.
- You finish with the answer first, then the reasons, the risks and the next steps.
- You've done several full cases out loud and timed, ideally some with a person.

If one of these feels shaky, practise that skill on its own for a few days rather than doing more full cases.

Disclosure: I built CaseSpar, a text-based AI case interviewer that scores skills like these (the maths is checked by code). The first full interview and the drills are free: https://casespar.app/?utm_source=reddit&utm_medium=social&utm_campaign=answer-d61
````

## Write down today

Yesterday's six numbers. Also: your five Day 60 decisions (a to e), partners with a January date, and partners reminded.

---
[← Day 60](day-60.md) · [Day 62 →](day-62.md)
