# Hiring and briefing a case reviewer

Every practice case stays a hidden draft until a person with real consulting interview experience has read it and signed it off (CLAUDE.md: "Never set a case to `reviewed` yourself; a human reviewer does that"). This page has a job post the founder can paste, and the brief to send the reviewer.

## Job post (paste into Upwork, LinkedIn or similar)

> **Title:** Former strategy consultant to review 20 practice case interviews
>
> I run Mock Partner, a website where students practise consulting case interviews with an AI interviewer. I have 20 original practice cases (profitability, market entry, market sizing, M&A, pricing, growth and operations) and need someone who has given or passed real case interviews at a strategy consulting firm to review them before they go live.
>
> For each case you will read the prompt, the facts and exhibits, the maths and the model answer on a private preview site, and tell me:
> - whether it is realistic and fair for a first- or second-round interview,
> - anything confusing, wrong or unrealistic, and
> - whether you would sign it off as it is, or what must change first.
>
> All cases use invented companies and numbers, and the maths is already checked by automated tests. A case takes about 20 to 30 minutes to review. Please tell me your consulting background (firm type and years, no client details needed) and your fee per case or for all 20.

The fee is the founder's decision. Agree it in writing before the reviewer starts.

## How the reviewer sees the cases

The preview site is protected by Vercel's login. To let the reviewer in without a Vercel account (Vercel's "Shareable Links", available on all plans; docs: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links, checked 15 Oct 2026): in Vercel open project **interview-prep**, then **Deployments**, select the newest preview deployment, click **Share**, choose **Anyone with the link** in the dropdown, and send that link. To revoke it later, switch the dropdown back to **Only people with access**. The link shows that one deployment, so share a fresh one after big changes. Drafts are visible on previews.

Each case has its own page at `/cases/<case>`, and the full case can be run as an AI interview after signing in. The reviewer also gets this brief and, for each case, the answer key (Claude can export one per case on request: the facts, exhibits, maths with working, and model answer).

## Brief for the reviewer

For each case, please answer these in a few lines:

1. **Realistic?** Would this work as a real first- or second-round case? Are the client, the numbers and the industry facts believable?
2. **Clear?** Is the question clear from the prompt? Is anything ambiguous, contradictory or missing?
3. **Fair?** Can a strong candidate reach the answer from what they can ask for? Are the maths questions reasonable to do by hand?
4. **The answer:** Is the model recommendation what you would expect from a strong candidate? Would you change it?
5. **Difficulty and time:** Do the difficulty (1 to 3) and the estimated minutes fit?
6. **Verdict:** "Sign off as it is", "Sign off after these small changes", or "Needs rework".

Please don't copy or adapt cases from casebooks, firms or other prep sites into your suggestions. Every case must stay original.

## Recording a sign-off

When the reviewer signs a case off, the founder tells Claude Code: "The reviewer <name> signed off <case> on <date>". Claude then sets that case's `status` to `reviewed`, with `reviewed_by` and `reviewed_on`, makes any changes the reviewer asked for, and runs `npm run content:check`. The case then appears on the live site. Claude never marks a case reviewed without that instruction.
