# Day 65 of 90 · Sat 19 Dec 2026 · Plan January's ads

**Why today matters:** January is the busiest stretch inside the 90 days (our estimate), so the ad plan is settled before Christmas, not during it.

About 115 minutes in total. 6 tasks, in order.

## d65-1: Daily routine

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 15 minutes

**Steps**

1. Write yesterday's six numbers. Alarms: Anthropic under 80% of the limit; ads this week under £105 (or your lower cap); no Vercel errors.
2. Answer the support inbox and admin enquiries.
3. In today's note: one user comment, and your minutes per channel.

## d65-2: Chrome exports the Google Ads numbers (only if January ads are allowed)

- **Who:** Claude in Chrome
- **Time:** about 20 minutes

**Steps**

1. Skip this and the next task if decision (b) on Day 61 was 'off'. Use the time for the search improvement list instead.
2. Send Chrome the message below.

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
In my Mock Partner Google Ads account (read only; change nothing), export for the last 28 days: the search terms report (search term, clicks, cost), the keywords report (keyword, match type, clicks, cost, average cost per click) and the total spend since the ads started. Save them as ads-search-terms.csv and ads-keywords.csv, and give me the total spend in one line.
````

## d65-3: Ask Claude for the January ads plan (only if January ads are allowed)

- **Who:** Claude Code cloud session (paste the message there)
- **Time:** about 15 minutes

**Steps**

1. Fill in your January daily total from decision (b): up to £25, or £10 to £15.
2. From the admin page, add free sign-ups and paying customers by utm_term and utm_campaign for the same 28 days.
3. Keep Claude's Chrome steps for tomorrow.

**Message to paste into the Claude Code cloud session** (copy exactly):

````text
Claude, the Day 60 gate allows Google Ads in January at up to £[your January daily total] a day in total from Saturday 2 January to Wednesday 13 January, and I'll confirm the caps on 31 December. Below are Chrome's export of the last 28 days and, from the admin page, free sign-ups and paying customers by utm_term and utm_campaign. Please write a January plan for my Mock Partner Google Ads account:
1. For each current keyword: keep, cut or change, using cost per free sign-up and per paying customer.
2. A US Search campaign for MBA first-years practising for internship case interviews (US only, ads shown during US daytime), and the UK campaign refocused on internship case interview practice.
3. How to split the daily total between them from Saturday 2 January.
4. Phrase and exact keywords only, plus negatives.
5. Ad text with no firm names, no promises of offers or results, nothing called free except the free first interview (no card needed), and only features that are live today.
6. Final URL suffix: utm_source=google&utm_medium=cpc&utm_campaign=jan-uk (or jan-us)&utm_term={keyword}.
7. The best landing page for each (the MBA last-week page, the deadlines page or the home page).
8. No firm names in any ad text. If you suggest a keyword that contains a firm's name, list it separately with the risk, and I'll decide; the ad and landing page must never suggest a firm backs us.
Then write the Claude in Chrome steps to build it all paused, with nothing switched on and no budget raised.

[paste Chrome's export and the admin numbers]
````

## d65-4: Post a short video

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 20 minutes

**Steps**

1. Only if short video is kept; otherwise send Claude the second message from task d62-3.
2. Next unused card from Claude's kit, portrait, to YouTube Shorts, TikTok and Instagram Reels with the caption below. Write the card number in today's note.

**Text to use (post, email or message)** (copy exactly):

````text
Case interview maths, no calculator. Pause the video and try it before the answer appears.

More free drills at mockpartner.com (I built it).

#caseinterview #consulting #mentalmaths
````

## d65-5: One helpful Reddit answer for MBA candidates, where the rules allow

- **Who:** You (Chrome prepares what it can, then hands over)
- **Time:** about 25 minutes

**Steps**

1. Find one recent question like 'how many cases should I do before first rounds?' in a subreddit whose saved rules allow it.
2. Adapt the answer below to the question. Keep the disclosure paragraph only if that subreddit allows self-promotion and it's relevant.
3. Own account only; never pose as a student; never ask for upvotes. If Reddit isn't kept, do the search improvement item instead.

**Text to use (post, email or message)** (copy exactly):

````text
There's no magic number, and quality beats count. What I'd suggest for the last couple of weeks (my view):

- Spread full cases across types (profitability, market entry, pricing, operations) rather than repeating your favourite.
- After every case, write down the single weakest moment and practise only that before the next one.
- Keep the maths warm daily without a calculator. McKinsey and Bain both say calculators aren't allowed in their interviews, so check your firms' own pages.
- Do some cases live with classmates or second-years. The back-and-forth matters.
- Stop the day before. One short warm-up on the day is plenty.

Disclosure: I built Mock Partner, a text-based AI case interviewer (maths checked by code, scored debrief). It isn't affiliated with or endorsed by McKinsey, Bain or any other firm. The first full interview is free if it helps fill gaps between live cases: https://mockpartner.com/?utm_source=reddit&utm_medium=social&utm_campaign=answer-d65
````

## d65-6: Only if the consent banner went live yesterday: Chrome creates the Google Ads conversions and gets the tag id

- **Who:** Claude in Chrome
- **Time:** about 20 minutes

**Steps**

1. Skip this if you didn't approve the banner and Google Ads tag (B19) yesterday.
2. Send Chrome the message below. The tag id and labels are not secret keys; they appear in every web page that uses them.
3. Then send Claude: 'Claude, here are the Google Ads tag id and conversion labels from Chrome: [paste]. Please set them in site.config.ts, run all the tests, then merge into main (I approve). On the live site, check that nothing from Google loads for a UK visitor before Accept, and that 'No thanks' keeps it off.'
4. Your ads still bid on clicks (Maximise clicks); this only lets Google count sign-ups and sales from now on.

**Message for Claude in Chrome (it is doing this task itself)** (copy exactly):

````text
Only for the Google Ads tag I approved: in my Mock Partner Google Ads account, create two website conversion actions, set up by hand with the Google tag (no automatic setup): 'Purchase' (Primary, use the value the site sends, count every one) and 'Free sign-up' (Secondary, count one). Don't turn on enhanced conversions or 'user-provided data', don't turn on automatic event detection, and don't create any remarketing audience. Don't change billing, budgets or any campaign. Then give me the tag id (it starts with AW-) and each conversion's label.
````

## Write down today

Yesterday's six numbers. Also: Google Ads spend since it started, and the January daily total you asked Claude to plan for.

---
[← Day 64](day-64.md) · [Day 66 →](day-66.md)
