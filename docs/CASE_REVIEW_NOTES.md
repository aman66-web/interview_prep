# Case review notes (15 and 16 Oct 2026)

These notes are for the human case reviewer (see `docs/REVIEWER_GUIDE.md`). The bank-style case studies added on 16 Oct 2026 (case-021 to case-026) have their own section at the end. The notes from 15 Oct 2026 cover the first 20 practice cases (case-001 to case-020), each of which went through two rounds of checks by Claude:

1. **Expert-style review and rewrite.** One reviewer for every two cases read each case as an interviewer would, fixed what was unrealistic, unclear or inconsistent, and listed the judgement calls a person with consulting experience should make.
2. **Second, skeptical check.** A separate checker for every three cases tried to find what the first reviewer got wrong: every number in the prose recomputed by hand, real-world claims (laws, wage rates, regulations) checked on the web, the original-content and invented-company rules, and anything that could make a correct answer score as wrong.

Every case's maths is also recomputed by the automated tests (`npm run content:check`), and all of them pass. **All 20 cases are still drafts.** Only a human reviewer can sign one off (CLAUDE.md: "Never set a case to `reviewed` yourself"). Nothing here replaces that.

For each case below: what changed, what the second check fixed, and the points the reviewer is asked to decide or double-check.

## The 20 cases

| Id | Case | Type | Second check |
|---|---|---|---|
| case-001 | Harbourline Bakeries: why did profit fall? | Profitability | Problems found and fixed |
| case-002 | Aurora Kitchen: should it enter the UK? | Market entry | Problems found and fixed |
| case-003 | How many public EV chargers will a city need? | Market sizing | No problems found |
| case-004 | Flexora: should the price go up to $75? | Pricing | Problems found and fixed |
| case-005 | Lumenwick Tutors: how to double new regular students | Growth | No problems found |
| case-006 | Corvane Vets: should it buy Kestrel Vale? | M&A | Problems found and fixed |
| case-007 | Ostrander Pumps: is a sensor startup worth $120 million? | M&A | Problems found and fixed |
| case-008 | Cobbleway Parcels: why is the hub falling behind? | Operations | No problems found |
| case-009 | Wrenfield Hotels: why is profit per room down? | Profitability | No problems found |
| case-010 | Stowline: how should it price its new Shield tier? | Pricing | Problems found and fixed |
| case-011 | Pellbrook Clinics: why are waits getting longer? | Operations | Problems found and fixed |
| case-012 | Brinmoor Bike Share: why are so many bikes out of service? | Operations | Problems found and fixed |
| case-013 | Bramblecup: is a UK supermarket deal worth taking? | Market entry | Problems found and fixed |
| case-014 | Hollinsway: should a home insurer sell pet insurance? | Market entry | No problems found |
| case-015 | Orvessa: why have paid subscribers stopped growing? | Growth | Fixed; one point needed a decision (resolved, see below) |
| case-016 | Sizing London's market for electric cargo bikes | Market sizing | Problems found and fixed |
| case-017 | How big is the US dog-walking market? | Market sizing | No problems found |
| case-018 | Cragwell Climbing: how to double revenue in five years | Growth | Problems found and fixed |
| case-019 | Larkmoor Supermarkets: should it buy a meal-kit firm? | M&A | Problems found and fixed |
| case-020 | Cobalt Basin: why did profit fall in a record snow season? | Profitability | Problems found and fixed |

## case-001: Harbourline Bakeries: why did profit fall?

`content/cases/harbourline-bakeries.json`, on the preview at `/cases/harbourline-bakeries`. Profitability, difficulty 1, about 25 minutes.

**What the first review changed**

- Changed customers per café from 400,000 at £5.00 to 250,000 at £8.00. Revenue stays at £2m, but about 1,100 customers a day was too many for the average UK bakery-café, and £8 suits a premium chain doing £2m a site.
- Added that sales figures exclude VAT, because a sharp candidate will ask.
- Added a revenue mix fact (hot drinks 35%, bread and pastries 40%, sandwiches 25%) so a targeted price rise on bread and pastries can be sized.
- Rewrote the cost lines fact: it said utilities and 'other costs' were fixed 'under long leases', which makes no sense. Now rent is fixed by leases, energy by a fixed-price contract, other costs were flat, packaging sits inside ingredients, and head-office costs are outside the café figures.
- Added the key judgement the case was missing: is the cost rise specific to Harbourline or market-wide? New facts say the market price of dairy and eggs rose about 10%, Harbourline paid market price under its old contract, and it has one supplier on a new two-year contract with a 12-month break clause. Competitors face the same wage rise but use other dairy suppliers.
- Labour fact now names the National Living Wage (the correct UK term) and gives about 6%, which matches the £40k rise in the exhibit.
- Replaced the maths question 'profit after a 4% price rise', which tested the same idea as the 6% question, with 'how much did Harbourline pay above market for dairy and eggs?' (£36k). It uses the second exhibit, which no maths question used before.
- Made the chain-profit question say 'combined profit of all 120 cafés', so it is clear head-office costs are not included. The working now also gives last year's £24m.
- Changed the second exhibit from 'bar' to 'table' (with three columns the site shows it as a table anyway) and added 'including packaging' to its title.
- Added the 10% to 4% margin to the P&L insight, and the contract-specific £36k to the ingredients insight.
- Structure rubric: added a good sign (asks whether competitors face the same cost rises) and a red flag (a price rise on everything without checking competitors or coffee price sensitivity).
- Idea bank: sharpened the dairy idea (re-tender at the break clause or split supply) and the waste idea, and added 'watch competitors, who face the same wage rise'.
- Synthesis must-mention now includes the £36k above-market dairy cost. Good signs now include separating what Harbourline can fix itself from market-wide rises, and the break-clause timing.
- Rewrote the model answer around a costed plan for the £120k gap: dairy re-tender up to £36k, a 5% bread and pastry price rise of about £40k, and £40k to £45k from rotas, waste, recipes and bundles. It keeps the 6% across-the-board rise as the riskier one-step option.
- Kept the prompt and every id that other tests use exactly as they were (both exhibits, 'ingredients-share-of-fall' at 66.67% within 2%, 'total-profit-this-year' at 9.6).

**Fixed in the second check**

- The fact said hourly pay rose about 6% 'in line with the rise in the National Living Wage'. In 2026 the National Living Wage rose from £12.21 to £12.71, which is 4.1% (gov.uk). The 6.7% rise was in April 2025. Read as a 2026 case, the claim is wrong, and a UK candidate who knows the real rise could challenge the 6%. Fix: Made it a fact about the client: 'Harbourline raised hourly pay by about 6% this year, following the rise in the National Living Wage, to keep its pay above the legal minimum.' The 6% (640 to 680 is 6.25%) and every other number are unchanged. The competitor fact ('the same National Living Wage rise') and the model answer still hold.

**Please check or decide**

- This is the free starter and the first case most people will try. Check that difficulty 1 still feels right now that the dairy contract versus market point has been added. The AI interviewer gives the 10% market figure inside the maths question, so a candidate is not punished for failing to ask about it.
- Check the realism of the per-café P&L for a premium UK bakery-café: £2m revenue, ingredients and packaging 28%, labour 32%, rent and utilities 20%, other costs 10%, café profit 10% falling to 4%. Rent and utilities at 20% is on the high side (prime sites).
- Judgement call: the 'right answer' is 'fix the contract-specific dairy cost first, cover the market-wide wage rise with a targeted price rise and operations'. The bridge in the model answer (36 + 40 + about 44) is illustrative. Only the £36k and the £40k come straight from the facts, so the AI should not mark down a candidate who sizes the operational savings differently.
- Is 5% on bread and pastries a 'small' price change that customers rarely notice? On an £8 average spend it is roughly 15p to 25p an item.
- The prompt already says customers and café numbers were unchanged. That is a deliberate steer for a starter case, but it does rule out volume for the candidate.
- Name check: a web search found no UK bakery or café chain called Harbourline.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- National Living Wage (21 and over): £12.71 from April 2026, up from £12.21 (+4.1%); 2025 was £11.44 to £12.21 (+6.7%). Source: https://www.gov.uk/national-minimum-wage-rates, checked 15 Oct 2026. The case no longer says how big the NLW rise was.
- 'Across the market, wholesale dairy and egg prices rose about 10% this year' is a case assumption for an unnamed year, not a real market statistic. It was left as is. The reviewer may want to label it more clearly as invented if real 2026 UK dairy prices moved differently.
- Judgement call: 'roughly 700 customers a day' (250,000 / 365 = 685) is fine as a rounded figure.
- Judgement call: whether a 10% café margin falling to 4% is realistic for a UK bakery-café chain, and whether a 5% rise on bread and pastries counts as a 'small' change that customers 'rarely react to'.
- Checked and consistent: P&L sums (1,800 and 1,920 of cost), the 10% to 4% margin, £24m to £9.6m, the ingredient categories summing to 560 and 640, dairy +28% being 70% of the rise, the other categories at 5.7%, 6.7% and 8% ('about 6% to 8%'), £36k above market being 30% of the gap, a 5% rise on the 40% bread-and-pastry share giving £40k, and the remaining £44k ('£40k to £45k').

## case-002: Aurora Kitchen: should it enter the UK?

`content/cases/aurora-kitchen-uk-entry.json`, on the preview at `/cases/aurora-kitchen-uk-entry`. Market entry, difficulty 2, about 35 minutes.

**What the first review changed**

- Market data now says it is measured at manufacturers' selling prices (what supermarkets pay suppliers), in the exhibit title and a fact. Before, the case turned 6% of the market straight into Aurora's revenue without saying whether the figures were at shelf prices, which strong candidates will challenge. A new structure good sign rewards asking about it.
- Rebuilt the variable cost table. It had no contract manufacturing cost even though a contract manufacturer makes the products, and cold-chain logistics at 18p per £1 was unrealistic. New table: ingredients 30p, contract manufacturing 14p, packaging 6p, frozen storage and delivery 10p. The total stays at 60p, so the maths is unchanged.
- Clarified the board's objective: at least £5m operating profit in year 3, and the £15m paid back within six years of launch. The old wording, 'within three further years', was ambiguous.
- Added a 'Years 1 and 2' fact (about £2m loss, then about £2m profit, so they roughly cancel out). The payback maths ignored ramp-up losses with nothing to justify that.
- Split the £15m investment into £8m marketing, £5m launch promotions with the four largest supermarkets and £2m set-up. It said 'all spent before sales start' while the model answer said to release it in stages; the fact now says that is the current plan, and staging is the recommended change.
- Replaced 'supermarket listing fees' with launch promotions (introductory offers and displays). The UK Groceries Supply Code of Practice limits listing payments, so the old wording risked being wrong.
- Added facts to test whether 6% share is achievable: how share splits among the leaders (30/15/15), small brands (none above 3%), and recent entrants (the stronger reached about 5% by year 3, the other withdrew). Also added that Aurora is almost unknown in the UK, a funding and 'why the UK' fact, and that cold-chain logistics would be bought in.
- Added a fifth maths question: the share needed to make the board's £5m (5.5%), using both exhibits. It is the 'what would have to be true' test the rubric already asked for.
- Payback question and working now make clear it is years of year-3 profit (2.5), and that payback falls about halfway through year 5, inside six years.
- Prompt now explains why the figures are in pounds ('The UK plan has been prepared in pounds') and says Aurora sells through supermarkets in North America only.
- Raised the estimated time from 30 to 35 minutes for five maths questions plus the brainstorm.
- Rubric: added the red flag 'accepts the 6% target without testing it' and the good sign about shelf prices versus what Aurora receives.
- Synthesis must-mention: the third point now gives the 5.5% needed against the best entrant's 5%.
- Idea bank widened: staged promotion spend by supermarket, a logistics partner, taste tests, an online trial, own-label production, and leading with organic and brand-story differentiation.
- Model answer updated to the new numbers and reasoning: a staged 'go' with a 5.5% share gate.

**Fixed in the second check**

- Competition said the remaining 15% of the segment is 'many small brands, none above 3%'. Recent entrants said the stronger new brand reached about 5% share in its third year, within the last five years, and did not say it left the market. That contradicts 'none above 3%'. Fix: Competition now reads: 'The remaining 15% is held by the stronger recent entrant (about 5%) and many small brands, none above 3%.' The shares still add to 100% (30+15+15+25+15).
- 'UK labelling rules differ slightly from US rules' understates real differences. Examples: the UK lists 14 allergens to the US's 9, gives nutrition per 100g where the US uses serving sizes, and needs a UK or NI address for the food business. The case should not depend on 'slightly'. Fix: Reworded to 'UK food labelling rules differ from US rules, so every pack would need a UK label. The contract manufacturer would handle compliance.'
- 'How many years of profit does it take' could be read as years from launch (4.5, since years 1 and 2 cancel out). The expected answer is 2.5, so a correct 4.5-year answer could be marked wrong. Fix: The question now asks 'how many years of that profit' (the year-3 level). The working still explains that this means payback halfway through year 5. Id, inputs and expected value are unchanged.

**Please check or decide**

- Main judgement call: the answer is now 'go ahead, but in stages'. The plan passes both board tests at 6% share, but £5m needs 5.5% and the best recent entrant reached 5%. Check you agree that staged entry is the single best answer, and that the AI should accept a well-argued 'pilot first' but not an unconditional go or an outright no.
- Check the realism of a 40% gross margin for a premium frozen brand selling to UK supermarkets, and £6m fixed costs (20% of revenue) for a challenger brand.
- Currency: the client is American but every figure is in pounds, because the business being judged would earn and spend in the UK. The prompt now says so. If you would rather show the board's view in dollars, that needs an exchange-rate step and changes all the maths.
- Optional harder variant: give the market at shelf prices and add a retailer-margin step. That would push the case towards 'no' at 6% share, so I did not do it here.
- The premium segment is £400m of a £2bn frozen ready-meal market (20%). That is plausible for an invented market, but premium frozen is a niche in the UK, so it is worth a second look.
- Name check: no frozen-meal brand called 'Aurora Kitchen' turned up. The nearest real name is Aurora Foods, a US frozen and grocery company that merged with Pinnacle Foods in 2004. The overlap is low risk, and the name is tied to the slug, which I was told not to change.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- HFSS rules in England: if Aurora's meals are classed as 'less healthy', the placement rules (in force since Oct 2022) limit prominent in-store displays in larger stores, and multibuy offers have been banned since 1 Oct 2025. Ready meals are an in-scope category. The case's 'introductory price offers' (temporary price cuts) are allowed. The case makes no claim about this, so nothing was changed. A reviewer may want the launch-promotion fact to avoid suggesting end-of-aisle displays. Sources: Shoosmiths, ACS, Osborne Clarke (Oct 2025) and gov.uk implementation guidance.
- The rewrite replaced 'supermarket listing fees' with 'launch promotions agreed with the four largest supermarkets'. That avoids a question under the Groceries Supply Code of Practice about payments as a condition of listing. It looks correct, but a reviewer may want to confirm.
- Judgement call: the £15m includes £5m of introductory price offers and in-store displays, yet the plan says it is 'all spent before sales start', even though price offers run once products are on shelf. This keeps the payback maths simple. It is not a number error, but a reviewer may want it worded as 'committed' before launch.
- Judgement call: est_minutes went from 30 to 35. Also judgement calls: whether a 40% gross margin and £6m a year of fixed costs are realistic for a premium frozen brand bought in at manufacturers' selling prices.
- 'Aurora Kitchen' was not introduced by this rewrite. A web search found no frozen-meal brand of that name (only the defunct Aurora Foods Inc.).
- Checked and consistent: segment sums (2,000 and 2,210), growth of 5.6%, 8.6%, 25% and 10.5% ('about 6%, 9%, 25%, 10%'), variable costs of 60p (ingredients 30p are half), £30m, £12m and £6m, payback of 2.5 years with mid-year 5 inside 6 years, 5.5% share for £5m, break-even at 3%, and the sensitivity at 3% share (£15m revenue, £6m gross profit, zero profit).

## case-003: How many public EV chargers will a city need?

`content/cases/city-ev-chargers.json`, on the preview at `/cases/city-ev-chargers`. Market sizing, difficulty 2, about 20 minutes.

**What the first review changed**

- Gave the case a decision to answer. The prompt now says the city has 240 public charging points today and asks how many more it should add, not just how many it needs.
- Added today's chargers by type (200 Level 2, 40 DC fast) as a new column in the exhibit, plus a new maths question: charging points to add = 600 (520 Level 2, 80 DC fast, about 120 a year). Its numbers are linked to the exhibit so the tests check them.
- Added today's EV ownership (3% of households) so a candidate can sense-check the method: it gives about 250 chargers today, close to the 240 the city really has.
- Made the demand and capacity figures unambiguous. The exhibit now says 'share of public charging demand' and 'EVs one charger can fully serve', and the working says '7,200 EVs' worth of demand', which is what the maths actually does.
- Moved the numbers out of the facts and into the exhibit. The facts now describe how the two charger types are used and point to the table, so the AI interviewer hands over the table instead of reading out its numbers.
- Added facts a candidate will often ask about: what counts as one charging point (one plug in use at a time), whether owners who charge at home also use public chargers (only on trips; leave them out), why a fast charger serves only 4 times as many EVs (peak use, no queuing), and cost and budget (out of scope).
- Added to the scope that taxis, ride-hailing cars and delivery fleets are excluded, and that the home-charging shares stay the same over the five years.
- Updated the structure rubric: the gap against today's network is now a key bucket, and new red flags cover treating every EV owner as a public-charging user and never comparing with today's chargers.
- Widened the idea bank with: later buyers more likely to live in apartments, home chargers still using fast chargers now and then, charger location (idle chargers in one place, queues in another), and pricing that spreads charging across the day.
- Rewrote the recommendation rubric and model answer to lead with about 840 needed and about 600 to add (mostly Level 2, near apartments without parking), phased at about 120 a year. Sensitivities are rechecked: 1,260 at 15% adoption, 1,120 if 40% cannot charge at home.

**Please check or decide**

- Capacity figures: 10 EVs per Level 2 charger and 40 per DC fast charger are invented and deliberately cautious. A candidate who knows the industry may argue a fast charger, which is 10 to 20 times quicker, should serve far more than 4 times as many EVs. Check you are happy with the explanation given in the facts (peak-time use, drivers will not queue).
- The answer, one public charger for every 48 EVs (about 14 for each EV that relies on public charging), sits below what many real cities have, because visitors, commuters and fleets are left out on purpose. The sense-check against today's 240 chargers supports it, but decide whether the scope makes that clear enough to candidates.
- Judgement call: I added the gap question (the 240 chargers today) so the market sizing ends in a decision. Please confirm this suits the case and does not make it too long for 20 minutes at difficulty 2.
- There are now 6 maths checkpoints, and the first two are simple percentages. That is fine for a candidate-led sizing case, but you may prefer to merge or drop one.
- No company names are used, and the city is not named. All numbers are invented.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- The Level 2 and DC fast descriptions ('stops of a few hours', 'a top-up in well under an hour') match general US usage. The AFDC says DC fast charging takes about 20 minutes to 1 hour to reach 80%. Not changed.
- All the numbers are labelled 'case assumptions' and none is a real statistic: 240 charging points today, 3% of households with an EV today, 10% in five years, 30% unable to charge at home, and 10 or 40 EVs per charger. Judgement call: 240 points for a million people (0.24 per 1,000) is on the low side for a large US city today, but it is internally consistent: the same method at 3% gives 252.
- Checked and consistent: 40,000 EVs, 12,000 relying on public charging, 720 Level 2 plus 120 DC fast = 840 (0.84 per 1,000 residents, one per 14 EVs), 600 to add (520 Level 2, 80 DC fast, about 120 a year), 3.5 times today's network, 'four times as many EVs' (40/10), the sensitivities of 1,260 at 15% adoption and 1,120 at 40% without home charging, and the 200 + 40 = 240 split. The Level 2 count comes out at 720 whether the 60/40 split is read per EV or across all demand, so a candidate's correct answer scores either way.

## case-004: Flexora: should the price go up to $75?

`content/cases/flexora-gym-software-pricing.json`, on the preview at `/cases/flexora-gym-software-pricing`. Pricing, difficulty 2, about 25 minutes.

**What the first review changed**

- Fixed a contradiction. A fact said a price change must apply to everyone at once, but the rubric and model answer recommend testing on a group of customers first. The fact now says Flexora can change the price for everyone or for a chosen group, with 30 days' notice for existing customers.
- Made the client US-only. It had UK gyms too, but every price was in dollars.
- Replaced the cost breakdown. 'Payment processing $5' was unrealistic for a $60 fee and would rise with the price, which contradicts 'cost does not change with price'. The lines are now support $8, hosting $4 and member reminders $3, still $15 in total.
- Added a fifth maths question: the break-even loss at $70 is about 18%, against the 12% the survey expects. This gives the case its key insight: $70 earns more and has twice the room for survey error (6 points against 3 at $75).
- Said that normal cancellations (1.5% a month) stay the same at every tested price, on top of the one-off loss. The original left this open, which could break the comparison.
- Answered 'how many customers is too many' in the objective: there is no hard limit, but the CEO worries that losing many gyms at once would hurt referrals.
- Added survey details a strong candidate will ask for: 600 of the 5,000 customers, a mix of gym sizes, asked about cancelling within three months. Added a customer-mix fact (gym sizes, no data on willingness to pay by size) to support the tiering ideas in the brainstorm.
- Swapped the exhibit order so the cost table comes first. The case page shows a free-preview case's first exhibit to every visitor, so the survey (the key data) was public before the interview. That made the rubric's 'works out break-even before seeing the survey' meaningless.
- Linked the maths inputs to the exhibit cells (old and new prices from the survey), so the tests now check them.
- Sharpened the rubrics and model answer to lead with 'not $75, go to about $70'. Added: the safety-margin argument, the yearly value (about $17k a month, roughly $200k a year), revenue falling at $75 while contribution rises, how close $75 sits to the $80 competitor with more features, and what to track. Added a red flag for backing $75 without noticing the expected 22% loss is close to the 25% break-even.

**Fixed in the second check**

- "Existing customers must get 30 days' notice of a price change" could be read as a legal requirement. No general US law requires 30 days' notice for business software contracts, so the case should not rely on it. Fix: Reworded as a fact about the invented client: "Flexora's contracts give existing customers 30 days' notice of a price change."

**Please check or decide**

- Biggest judgement call: the survey shows 22% of gyms leaving after a 25% rise. That is very price-sensitive for business software with switching costs. A strong candidate may argue that stated intentions overstate real cancellations, so $75 could win. The model answer handles this by testing first, but check that the 'right answer zone' (about $70, tested on a group first) is how you would want it scored.
- Please confirm the exhibit swap. The free preview now shows the cost table instead of the survey chart. That is better for practice but a less exciting teaser on the public case page; it is the founder's call if he prefers the survey for marketing.
- Name check: 'Flexora' is also a small German start-up making flexible sensor films (a different industry), and there is a gym-software platform called 'Flexoryx' (a similar-sounding but different name). I kept the name because neither is an obvious match. If you would rather avoid any likeness, the company name can change in the title and prompt, but the file name and web address must stay 'flexora-gym-software-pricing'.
- Contribution answers are asked 'in dollars' (225000, 234000, 242000). The AI turns '$242k' into 242000. Check this reads naturally in a practice run.
- Stowline (case-010) is also a software pricing case, but a harder, candidate-led new-tier launch. The two do not overlap in logic.
- The survey only asked about four higher prices, but the exhibit titled "Survey of 600 customers" also shows $60 at 100% staying, while 1.5% of customers cancel every month. The "on top of the one-off loss" sentence in the cancellations fact explains it, so this is consistent but could confuse a candidate who does not ask. Suggested: Left for the human reviewer. A possible fix is to label the $60 row as today's baseline (no extra loss), or note that in the exhibit insight.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- No real-world laws or rates are relied on after the fix. The 30-day notice is now a term of Flexora's own contracts.
- Name check: a web search for "Flexora" gym software found no real product with that name (the closest are "Flexoryx" gym software and the "Flexor" stretching app). Not a trademark search.
- Judgement: whether $15 a month variable cost per gym and a 75% contribution margin are realistic for gym scheduling and billing software. The reviewer removed "payment processing" from the cost lines, correctly, because card fees would rise with the price and contradict "whatever the price".

## case-005: Lumenwick Tutors: how to double new regular students

`content/cases/lumen-tutoring-growth.json`, on the preview at `/cases/lumen-tutoring-growth`. Growth, difficulty 3, about 35 minutes.

**What the first review changed**

- Renamed the company from Lumen to Lumenwick Tutors in the title, prompt and all text. 'Lumen' is crowded in US education: Lumen Learning is a well-known US courseware company, Lumen Education Initiative is a US tutoring charity, and Lumen Steps Tutoring and LumenEd also exist. No business called Lumenwick turned up in a search. The slug and id are unchanged.
- Added a maths question on what the extra students cost: $80k of extra spend for 160 extra students is $500 each, the same at every quarter-on-quarter step. This is now the main insight: extra students cost more than the $400 they earn, so more ads cannot pay for the doubling.
- Added a maths question on what doubling takes: with sign-up at 10% and first lesson at 50%, 32% of first-lesson students must become regular to reach 1,600. This tests the case's central claim that every stage has to improve. Before, no maths question checked it.
- Added a 'Budget and decision rule' fact (spend more only where a student earns back what it cost), so there is one clear best answer instead of an open-ended judgement.
- Added a fact on why students drop off (choosing a tutor from a long list is hard; the first tutor is often the wrong fit), so candidates who ask 'why' at each stage get an answer.
- Added a fact on students who never become regular (they earn $10 to $20 each; count all marketing spend as the cost of gaining regular students), which settles how acquisition cost is defined. Also said that regular students bring in about nine-tenths of commission, which is consistent with the numbers.
- Said in the business model fact that there are no trial lessons, discounts or packages today, and in the marketing fact that there is no referral scheme, so the obvious ideas are really new.
- Reworded the tutor supply fact so it holds up if demand doubles: there are 20% unbooked hours and new tutors apply every week.
- Made exhibit titles and columns clearer: 'Customer funnel, last quarter (Q4)' with a 'Number in Q4' column, because visits are not 'students'. Also 'Marketing spend and new regular students, last four quarters'. Updated the input_sources to match.
- Updated the exhibit insights: the funnel insight now notes that doubling through traffic alone would need 200,000 visits; the trend insight adds the $500 cost per extra student.
- Rubric: added good signs (works out the cost of the extra students, asks why people drop off) and a red flag (treats the average cost as the cost of the next student).
- Updated the must-mention points to match the new maths. Good signs now include the 1.3x ratio, linking fixes to the survey reasons, and the risks.
- Added four ideas to the idea bank: an easier way to choose a tutor, better tutor profiles, a free switch of tutor, and winning back students who stopped. Also added moving spend from the weakest ads to the best ones.
- Rewrote the model answer around the new numbers. It gives the answer first (stop scaling ads, grow through conversion), then a test plan in priority order, risks, and the metrics to track.
- Raised est_minutes from 30 to 35 because there are now 6 maths questions. Difficulty 3 and interviewer-led are unchanged.

**Please check or decide**

- The main judgement call is the $500 cost per extra student. It treats the Q1 to Q4 change as the cost of the extra students, which ignores seasonality and other changes. Please confirm you are happy for this to be the key insight. The interviewer is not told to accept a seasonality challenge.
- There are 6 maths questions in 35 minutes. Check that this does not feel like a maths drill. If it does, the ratio question (value-to-cost-ratio) is the easiest to drop, because its point is also in the must-mention list.
- The doubling question gives the candidate the 10% and 50% assumptions. That suits an interviewer-led case, but a strong candidate may set their own stage targets. Check the AI interviewer still credits other mixes that reach 1,600.
- Lifetime value uses commission, not profit, and Lumenwick's other costs are not given. The working calls 1.3x 'thin' without a number. Decide whether to add a cost fact.
- The drop-off survey fact points fairly directly at tutor-matching fixes. Check it does not give the answer away for a difficulty 3 case.
- Check that the numbers are realistic: $40 a lesson, 25% commission, 4 lessons a month for 10 months, 8% / 40% / 25% funnel rates and about $2.40 of marketing per visit. They look plausible for a US online tutoring marketplace, but someone close to the industry should confirm.
- "Last quarter (Q4)" reads oddly against calendar dates: in October the last calendar quarter is Q3. It is consistent if Q1 to Q4 are the company's own last four quarters, and it does not affect any answer. Suggested: Left for the human reviewer. It could be renamed to "the last four quarters (Q1 oldest, Q4 latest)" if wanted.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- No real-world laws, rates or norms are stated. Everything is a fact about the invented client.
- Name check: the client was renamed from "Lumen" (a real company name) to "Lumenwick". A web search found no tutoring business called Lumenwick (the closest is "Lumen Steps Tutoring"). Not a trademark search. The slug is still "lumen-tutoring-growth", which visitors do not see as a brand. Changing it would mean touching lib/content/all-cases.ts.
- Prose numbers checked by hand: the funnel (100,000 x 8% x 40% x 25% = 800); the average cost per new regular student ($250 in Q1, $300 in Q4); the extra cost per extra student ($500 for each quarter-on-quarter step: 30k/60, 25k/50, 25k/50, and 80k/160 overall); lifetime commission ($400); ratios of 1.33 and 0.8; 200,000 visits to double; 1.25 x 1.25 x 1.28 = 2.0. "Nine-tenths of commission from regulars" fits the data: 800 x $400 against 2,400 x $10-20 is 87-93%.
- Judgement: the $500 cost per extra student assumes all the extra students came from the extra ad spend, with no organic growth. A reviewer may want the interviewer to accept a candidate who points this out.

## case-006: Corvane Vets: should it buy Kestrel Vale?

`content/cases/corvane-vets-acquisition.json`, on the preview at `/cases/corvane-vets-acquisition`. M&A, difficulty 2, about 30 minutes.

**What the first review changed**

- Made the board's 10% rule precise: it uses last year's operating profit plus savings Corvane can realistically make within the first year, and treats growth and new services as upside. Before, 'the profit it expects' left open whether to grow Kestrel Vale's 5% a year into the numbers, which would change every answer.
- Added numbers to the vets fact: £5.5m on vets, of which £4.5m is employed vets and £1m is locums. Also added that vacancies have been open for over a year and Corvane uses very few locums. The 2-point staff gap (£0.5m) now ties out exactly to the extra cost of locums. It shows closing it means replacing every locum, which makes the 'don't pay for it upfront' judgement follow from the facts.
- Added a maths question on what Kestrel Vale is worth on its own (£3m / 10% = £30m). It is the natural first sum after the profit-and-loss exhibit, and the rubric already rewarded it, but a correct answer was not recorded before.
- Added Corvane's own size (revenue £120m, operating profit about £24m), so candidates can see that Kestrel Vale is about a fifth of Corvane's size.
- Added that Corvane pays about 20% less for the same drugs. This gives a second way to reach the £1m drugs saving (20% of £5m), and the working now mentions it.
- Added a fact on opening its own clinics (about five years, and new clinics lose money for two years), so 'buy or build' has an answer. Added a matching key bucket, good sign and model-answer line.
- Added to the target fact that growth came mostly from more clients, not price rises (a common question about the quality of growth).
- Sharpened the maths working: max price now splits £45m into £30m for Kestrel Vale on its own plus £15m of Corvane's savings. The asking-price working now shows the locum arithmetic. Profit with savings now says why both savings fall within the first year.
- Updated the insights: the profit-and-loss insight now says the stand-alone value is £20m below the asking price. The cost-comparison insight now says the staff gap is the extra cost of locums.
- Added two ideas to the idea bank: how much the business depends on the founder personally, and using Kestrel Vale as a base for more clinics in the North.
- Tightened the recommendation: buy, open at about £40m, pay no more than £45m upfront, and pay any extra up to £50m later only if targets are met. Added concrete next steps (due diligence, keeping vets on, founder handover). Updated the synthesis rubric to match.
- Kept difficulty 2, 30 minutes, interviewer-led, free_preview true, and the exhibit numbers unchanged (the first exhibit is shown publicly).

**Fixed in the second check**

- "Yorkshire has a shortage of vets" was stated as a real-world regional fact and could not be checked. The RCVS 2024 workforce model has UK vet supply at 90% of demand in 2023, rising to 96% by 2032, so the shortage is easing, and there is no Yorkshire-specific figure. The case's locum logic depends on this claim. Fix: Made it a fact about the invented client: "Kestrel Vale says vets are in short supply in its part of Yorkshire, and it has had vet vacancies open for over a year." The later uses of "in a vet shortage" (red flag, maths working, synthesis, model answer) still read correctly as this local shortage.

**Please check or decide**

- The heart of the case is valuation at 10 times profit (a 10% yield on price). Check that a pre-tax operating-profit yield without integration costs is a fair simplification for a difficulty 2 case. Also check whether 10 times operating profit is a sensible multiple for a UK vet group.
- The opening offer of about £40m is a negotiation judgement. Equally strong answers could open lower, near £35m, since Kestrel Vale is worth £30m on its own. Check the rubric doesn't penalise a different opening offer that stays under a £45m walk-away price.
- The board rule now names last year's profit, so a candidate who grows profit by 5% before applying the rule gets a slightly different value. The interviewer can correct this from the facts, but please confirm the rule reads clearly.
- The locum numbers are new: employed vets cover 90% of shifts for £4.5m and locums 10% for £1m, at twice the cost. Check that £5.5m on vets out of £11m of staff costs is realistic for 20 small-pet clinics (about £275k of vet cost a clinic).
- Revenue per clinic is about £1.25m for Kestrel Vale and £1.5m for Corvane, with margins of 12% and 20%. These look plausible for UK small-animal practice, but please sense-check them.
- No real business called Corvane or Kestrel Vale turned up in a web search.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- Locums cost about twice an employed vet's daily cost: this is stated as a Kestrel Vale fact. For realism, Synergy Vets' 2025/26 guide gives locum day rates of about £350-480 in the North of England (https://www.synergyvets.com/blog/?p=576). Twice the employed cost is plausible but on the high side. Reviewer's judgement.
- UK vet shortage background: the RCVS 2024 workforce modelling report (https://www.rcvs.org.uk/news-and-views/publications/2024-rcvs-workforce-modelling-report/2024-rcvs-workforce-modelling-report-final.pdf) shows the shortage easing, which is why the claim was made client-specific.
- Competition: the case says "assume no competition concerns", which is fine as an assumption. For realism, the CMA's vet services market investigation final report (24 March 2026) imposed remedies, reported to include price transparency, disclosure of group ownership and written prescriptions, taking effect from late September 2026 (law-firm summaries: https://vbb.com/articles/uk-cma-concludes-veterinary-sector-market-investigation-and-announces-major-reforms/, https://www.fieldfisher.com/en/insights/cma%e2%80%99s-final-report-on-vet-services-what-businesses). "Keep the Kestrel Vale name locally" would probably now need group ownership shown. The reviewer may want to mention this or leave it out. The case does not depend on it.
- Name check: web searches found no real vet business called "Corvane" or "Kestrel Vale Vets" (only unrelated "Vale Vets" practices). Not a trademark search.
- Prose numbers checked by hand: P&L adds up (25 - 11 - 5 - 3 - 3 = 3) and both percentage columns total 100. Corvane £120m x 20% = £24m. Vet spend: £4.5m for 90% of shifts and £1m for the 10% of locum shifts is 2x per shift, and replacing all locums saves £0.5m, which equals the 2-point staff gap. 20% off £5m of drugs = £1m, which equals the 4-point gap. Standalone value £30m, maximum price £45m (£15m of it is Corvane's savings), £5m profit needed at £50m.

## case-007: Ostrander Pumps: is a sensor startup worth $120 million?

`content/cases/ostrander-pumps-sensor-deal.json`, on the preview at `/cases/ostrander-pumps-sensor-deal`. M&A, difficulty 3, about 35 minutes.

**What the first review changed**

- Installed base fact now says the 200,000 pumps do not include the ones Thrumline already monitors. This stops the same pumps being counted twice in Thrumline's plan and in Ostrander's sign-ups.
- Thrumline's customers fact now gives the founders' estimate: customers with up to 10,000 of the 40,000 year-5 pumps could leave if a pump maker owned it. The interviewer now has a real number for the deal's biggest risk instead of 'some might leave'.
- Added a fifth maths question (value-if-customers-leave): if those 10,000 pumps leave, the deal is worth about $110 million, below the $120 million price. This sensitivity was already in the rubric; now code scores it.
- Added a Funding fact (Ostrander can afford the price; the question is whether Thrumline is worth it), so the interviewer can answer that common question.
- Added a Renewals fact (Thrumline's customers keep about 95% of their pumps each year; pilot subscribers have paid for only a few months), so the interviewer can answer the natural churn question.
- Pilot fact now explains how the pilot worked: 10,000 pumps across the three customer types, customers chose whether to take part, and the parts comparison covered a year on pumps of similar age and type. A candidate can now spot the self-selection risk from the facts.
- Structure rubric: new good sign (asks how the board values deals before valuing anything) and two new red flags (using the 25% free-trial rate instead of the 10% paying rate; choosing to build just because $30m is less than $120m).
- Synthesis rubric: the pilot-representativeness good sign is now specific (self-selection, unproven renewals, one year of data). Added a good sign for upside the numbers leave out (alerts on Ostrander pumps Thrumline already monitors, selling replacement pumps).
- Idea bank: added using alerts on ageing pumps to sell replacement pumps, and later offering monitoring outside the US.
- Exhibit titles: the pilot sign-up chart now names its unit (number of pumps), and the pilot results table now says it covers a year.
- Pilot sign-up reveal hint widened, so a candidate asking 'how many customers would sign up?' gets the exhibit.
- Model answer: the risks now use the founders' 10,000-pump estimate and the $110 million worst case. The recommendation now says buy only with protection (negotiate towards about $110m or pay part later against sign-up targets, keep Thrumline brand-neutral with clear data rules, retain the founders).

**Fixed in the second check**

- The first reviewer added 'a year of parts and repair revenue' and 'the pilot's paying subscribers have only been paying for a few months', but the fact still said the pilot ran 'last year'. If the pilot ran in full last year with a six-month free trial, subscribers would have been paying for well over a few months. A candidate who checks the timeline would find the case contradicting itself. Fix: Changed 'Last year Ostrander and Thrumline ran a joint pilot.' to 'About a year ago Ostrander and Thrumline started a joint pilot.' The timeline now holds: a year of results, a six-month trial, then a few months of paying. No numbers or ids changed.

**Please check or decide**

- Main judgement call: the answer is 'buy, with protection'. The base case is $140m at the pilot's 10% paying rate; the worst case is $110m if 10,000 pumps leave. Check that this split feels right. A strong candidate who says 'do not buy at $120m, offer about $110m' should probably score well too; the rubric allows that through 'a lower price or part paid later'.
- The board's rule (10 times year-5 operating profit, no discounting) is a deliberate simplification. Check it does not feel too artificial for a difficulty-3 M&A case, and that it is clear enough that the year-5 losses and retention bonuses can be ignored.
- The pilot's parts uplift ($1,000 to $1,500, +50%) is large and drives $200 of the $500 per pump. I left it as it was and added facts so candidates can challenge it (customers chose to take part). Decide whether to soften it.
- Five maths questions in 35 minutes, candidate-led. Check the pace is realistic, or whether the fifth (customer-loss sensitivity) should stay optional.
- Fixed costs are treated as unchanged when Thrumline serves 20,000 more pumps or loses 10,000. That is stated in the facts ('would barely change'), but confirm it reads naturally.
- Name check: a web search found no real business called Ostrander Pumps or Thrumline. This was not a trademark search.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- No real-world facts are stated. The board's 10x year-5 profit rule, the $400 price, the $100 cost to serve, the 40% parts margin and the pilot results are all facts about the invented clients.
- Name check (rule 2.1): web searches for "Ostrander Pumps" and "Thrumline" found no real company. The nearest result was Oberdorfer Pumps, a different name.
- Judgement for the reviewer: the synergy maths leaves out the cost of selling monitoring through service reps and of fitting sensors at the factory. It also applies the self-selected pilot's +$500 parts uplift to every new sign-up. The case flags this risk in its good signs but does not price it.
- Judgement for the reviewer: the case says sign-ups from Ostrander's base come 'on top of' Thrumline's own plan. In reality that plan could already include some Ostrander pumps, so there is a small double-count risk. A 40% margin on parts and repairs, treated as operating profit for the board's rule, is also a judgement on realism.
- Recomputed by hand and correct: every year in the plan exhibit (pumps x $400 - pumps x $100 - $8m); $40m standalone; $500 per pump; break-even at 8% (16,000 pumps); $140m at the pilot rate; $110m if 10,000 pumps leave; 25%, 40% and 10% in the pilot; $40m being a third of the price. The $800m revenue x 40% = $320m of parts revenue is consistent with 200,000 pumps x $1,000 = $200m.

## case-008: Cobbleway Parcels: why is the hub falling behind?

`content/cases/cobbleway-parcel-hub.json`, on the preview at `/cases/cobbleway-parcel-hub`. Operations, difficulty 2, about 30 minutes.

**What the first review changed**

- Fixed a contradiction: volume was '240,000, up from 180,000 two years ago' (about 15% a year) while the case says growth is 10% a year. Two years ago is now about 200,000, which matches 10% a year.
- Second-machine fact now says it would be fed from the same 50 induction stations and adds none. This closes the obvious hole a sharp candidate would raise: wouldn't a new sorter bring its own induction stations?
- Added a fact on why the operations director wants the machine (parcels pile up beside it every night). This is a realistic red herring; the pile is really the queue for induction.
- Late parcels fact now says the two unhappy retailers send about 15% of parcels and want a fix within three months. That shows why an 18-month machine is too slow anyway.
- Staff cost fact now gives the cost per person (about £33,000), says filling all 10 empty stations takes about 15 people, and says hiring takes about six weeks, so candidates can size and time the staffing fix.
- Prompt now says 'tens of thousands' of parcels are late, matching the facts (it said 'thousands').
- Added a fifth maths question (next-year-speed-needed): next year, even with all 50 stations staffed, each person must place 660 parcels an hour (up from 625). This proves filling stations alone will not keep up with growth.
- Replaced the 'ignores the hour-by-hour flow' red flag, which no data supported. The new one: adds up or averages the steps' capacities instead of seeing that the slowest step sets output.
- Structure rubric: new good sign for reading the pile beside the machine as an induction queue.
- Synthesis rubric: new good signs for urgency (three months against 18 months) and timing the machine decision (the machine's limit arrives in about three years and it takes 18 months to install, so decide in about 18 months). The next-year good sign now includes the 31,250 figure, and the cost comparison now reads £0.4m to £0.5m.
- Idea bank: added holding the agency to a fill rate or adding a second agency, and a capacity plan for every step.
- Model answer: the clarify step no longer states 40,000 late parcels as given (candidates calculate it). Added the induction-queue point and the 660-an-hour figure. The recommendation now covers the six-week hiring gap, risks, and when to decide on the machine.
- Estimated time raised from 25 to 30 minutes for the extra maths question and the growth discussion.

**Please check or decide**

- Induction speeds (625 to 700 parcels per person per hour) are kept round for mental maths. Real manual induction on modern sorters is often faster (roughly 1,000 to 2,000 an hour). Check this feels believable to someone who knows parcel hubs; changing it would ripple through every number.
- The fact that a second machine 'would be fed from the same 50 induction stations' is an invented simplification that keeps the bottleneck logic clean. Check it is believable, or whether a candidate who argues a real sorter brings its own stations deserves credit.
- The case assumes the four steps run as one flow at the slowest step's rate. Lorries arrive faster than they can be unloaded (240,000 over 5 hours), so yard queues are normal and are not a second problem. A reviewer may want to say this explicitly in the facts.
- Growth projections in the rubric and model answer: unloading (36,000) runs out in about two years, the machine (40,000) in about three. These are derived, not maths questions; check they are not over-weighted in scoring.
- Five fairly easy maths questions at difficulty 2: check this is not too much arithmetic for a 30-minute interviewer-led case. The next-year-rate question could be merged into next-year-speed-needed if needed.
- Name check: a web search found no real parcel carrier called Cobbleway. This was not a trademark search.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- 'A permanent night worker costs about £33,000 a year' is stated as a fact about the client, not a law, and it looks plausible. The UK National Living Wage has been £12.71 an hour since 1 April 2026 (gov.uk press release 'National Living Wage increases to £12.71 per hour'). At that rate a 40-hour worker costs about £26,400 in pay, plus about £3,200 of employer National Insurance (15% above £5,000) and about £600 of pension, roughly £30,000 in all. So £33,000 implies a modest night premium. 12 x £33k = £0.4m and 15 x £33k = £0.5m are correct.
- Judgement for the reviewer: 12 permanent staff to cover 8 stations every night (1.5 people per station for holidays, sickness and days off) depends on how many nights a week the hub runs, which the case does not say.
- Name check (rule 2.1): a web search for "Cobbleway" with parcel or courier terms found no real carrier.
- Recomputed by hand and correct: 200,000 x 1.1^2 = 242,000, about 240,000 (fits the 10% growth). Today 30,000 an hour needed; 25,000 an hour = 40 x 625; two years ago 33,600 = 48 x 700. 40,000 parcels late (one in six); 48 stations; next year 33,000 an hour, 660 per person, and 31,250 from 50 x 625. Unloading runs out in year 2 (36,300 needed against 36,000). The machine reaches its limit in about year 3 (39,930 needed against 40,000), so deciding in about 18 months fits the 18-month install.

## case-009: Wrenfield Hotels: why is profit per room down?

`content/cases/wrenfield-hotels-profit.json`, on the preview at `/cases/wrenfield-hotels-profit`. Profitability, difficulty 1, about 25 minutes.

**What the first review changed**

- Prompt now says the company owns and runs the hotels, and uses the past tense ('this year its hotels were about as busy...'), which matches the facts.
- Booking commissions fact now says the 20% rate has not changed for years. Without this, a candidate asking 'did the agencies raise their fees?' got no answer, and there were two possible explanations.
- Website fact now says booking on a computer works as before, so the problem is clearly phones only.
- New fact 'Fixing the website': the agency can fix it in about three months for around $300,000. Candidates can now weigh the fix against a $7.3m a year problem and check it fits the 18-month goal.
- Guests fact now says many repeat guests switched to the agencies this year, and that the agencies mostly bring first-time guests. This backs the root cause and the point that dropping the agencies would be wrong.
- More realistic cost lines in exhibit 1: laundry and supplies $30 to $20 per room per night (it was $37.50 per occupied room), building, utilities and other $28 to $38. Totals, profit and all maths are unchanged.
- Exhibit 1 insight now gives the margin (25% to 15%) and ties revenue back to 80% x $250 and staff to the 5% wage rise. Its reveal hint also covers 'a breakdown of costs'.
- Exhibit 2 changed from 'bar' to 'table'. With four columns it was always shown as a table anyway. Title now says 'room nights'.
- Exhibit 2 insight no longer claims timing the data cannot show. It now shows that the shift explains the whole commission rise ($200 x 70% x 20% = $28 against $12) and points to the website using the facts.
- Last maths question now says 'with everything else as it is this year', so it has one answer.
- Structure rubric: added good signs (checking commission against the booking mix; asking about website visits versus bookings per visitor). Added a red flag: assuming fewer direct bookings means fewer guests.
- Idea bank: added putting the old booking system back on phones meanwhile, keeping agencies for first-time guests, recovering the staff rise through rotas or a small rate rise, and checking agency contracts before promising the best price direct.
- Recommendation rubric: payback against the $300,000 fix, keeping agencies for first-time guests, and tracking phone booking success.
- Model answer rewritten at the end: the answer first (a booking-channel problem caused by the website, not a demand problem), the actions, then a separate risks and next steps item. The two figures it now quotes ($12 and $28) are checked by hand.
- UK spelling: 'labor' to 'labour', 'program' to 'programme', 'checkout' to 'check-out'.

**Please check or decide**

- Is the channel shift realistic? Direct bookings fall from 70% to 30% of nights in one year. Last year's 70% direct is high for US independent boutique hotels, and the swing is dramatic. It is kept that way for clean mental maths. Decide whether it feels credible to a candidate.
- The 20% agency commission is at the upper-middle of the real range for independent hotels. It was chosen for easy maths.
- Do the remaining cost lines look like a rooms-only P&L for an owned boutique hotel? Staff $80 (40% of room revenue) and building, utilities and other $38, with a 25% margin. Restaurants and bars are left out (rent from a partner).
- The recommendation recovers the last $4 through rotas or a small rate rise. Staffing levels did not change and the wage rise is market-wide, so neither is clearly 'right'. Check the rubric does not punish either.
- The new $300,000 fix figure lets candidates do a payback. There is no maths question for it; the interviewer only probes it qualitatively. Add one if you want payback tested.
- The prompt says the hotels were 'about as busy as last year'. That gives away flat occupancy, just like the reference case. This is fine for difficulty 1, but remove it if you want candidates to check revenue themselves.
- Advice to 'promise the best price direct' may run into the agencies' rate-parity terms. The case now says to check the contracts and suggests members-only rates. A reviewer who knows hotel distribution should confirm that wording.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- The 20% travel-agency commission is a fact about the client. Real hotel commissions with online travel agencies commonly range from about 15% to 25%, so 20% is plausible, but this is a judgement for the reviewer.
- 'Hourly wages rose about 5% this year in line with local labour markets' is part of the invented world, since no cities are named, so it is not a checkable real-world statistic. For context, national US leisure and hospitality pay growth looks to be around 4% (FRED series CES7000000003, about $23.4 an hour in February 2026). I could not confirm the 12-month change, so I made no edit.
- The idea 'promise the best price ... once the agency contracts have been checked' points to price-parity clauses without stating any law. It is hedged, so no change.
- UK spellings ('labour', 'programme', 'rotas', 'check-out') appear in a US-set case. This matches the rest of the site: the US Larkmoor case also uses 'programme'. Left as is.
- Possible tension for the reviewer: last year's 70% direct share came with only 40% repeat guests, so getting back to the 70% target needs first-time guests to book direct too. The advice to 'keep the agencies for first-time guests and move repeat guests back to direct' alone may not get there. These are idea-bank and good-sign wording, not marked answers.
- Name check (rule 2.1): a web search for "Wrenfield Hotels" found no real hotel group. The nearest result was Wren's Hotel Group, UK, dissolved in 2021, a different name.
- Recomputed by hand and correct: room revenue 80% x $250 = $200. Costs 12 + 80 + 20 + 38 = 150, profit $50. This year 28 + 84 + 20 + 38 = 170, profit $30. Margin 25% falls to 15%. Commission $200 x 30% x 20% = $12 and $200 x 70% x 20% = $28, which also equals 80% x $250 x 70% x 20%. Staff $80 x 5% = $4. The fall is 40%, commissions are 80% of it, and the yearly loss is $7.3m. Half direct gives $38 and 70% direct gives $46. The $300k website fix pays back in about 19 to 38 nights ('within weeks').

## case-010: Stowline: how should it price its new Shield tier?

`content/cases/stowline-backup-pricing.json`, on the preview at `/cases/stowline-backup-pricing`. Pricing, difficulty 3, about 30 minutes.

**What the first review changed**

- Costs fact now says to treat both costs to serve as fully variable (the recovery team comes from a partner paid per Shield user), and that launch marketing costs the same at any price. A sharp candidate asking 'is the 24/7 team a fixed cost?' previously had no answer.
- Customer research fact now says the survey numbers are the steady monthly level once customers have had a few months to switch. This clears up 'monthly contribution in the first year'.
- New fact 'Other prices': only £20, £25 and £30 were tested, and other prices could be tested with a small group first. The interviewer can now answer 'what about £27?'.
- New fact 'Business customers leaving': almost none would leave at any tested price, so treat the Business base as stable. This settles the 'do we lose customers if Shield is too dear?' question, so the cannibalisation maths has one answer.
- Exhibit 1 retitled 'Stowline's tiers today: prices, costs and users' (the old title said 'per user per month' over a users column). Its insight now gives the break-even (£18) and Business's £1m a month contribution.
- Exhibit 2 insight now gives the share of Shield users who come from Business (about 89% at £20, 88% at £25), the drop from 34,000 to 18,000 users between £25 and £30, and says nothing is known between the tested prices.
- Structure rubric: added good signs (working out the £18 break-even for an upgrader; asking whether Business customers would leave). Added a red flag: cost-plus or matching a rival without using the survey.
- Idea bank: added selling Shield for the whole business only, not one seat at a time, and showing the cost of downtime next to the price (selling on value).
- Recommendation rubric: added a good sign for explaining why launching at £25 beats starting low and raising later (60 days' notice, fair-pricing reputation).
- Model answer: gives the annual figure (about £3.3m a year), explains why not £27 or £28, puts the answer first, and splits out risks and next steps (survey overstating demand, rivals cutting prices, tiers blurring, a test before launch). The new figures are checked by hand: 40/45, 30/34 and 278 x 12.

**Fixed in the second check**

- Said an upgrader 'adds nothing below £18'. In fact an upgrader breaks even at exactly £18 and loses money below it. The exhibit insight already says 'adds nothing at £18'. Fix: Reworded to 'adds nothing at £18 (£8 cost plus the £10 they already earn on Business) and loses money below it'.
- '£25 is best (about £3.3m a year)' is 12 x £278k, the steady run rate. The goal is year-one contribution, and the survey fact says these numbers are the steady level reached only after a few months, so year one will come in below £3.3m. As written it reads as a first-year figure. Fix: Changed to 'about £3.3m a year once demand settles'.

**Please check or decide**

- Prices are at the premium end for UK small-business backup: Business £15 per user per month, Shield £25, rivals £22 and £28. Many backup products sell for a few pounds per user. These prices fit a managed backup-and-recovery service with a 24/7 team. Decide whether to keep them or scale all prices down together (the maths would need redoing).
- Difficulty 3 and candidate-led is a judgement call. The maths is light (three contribution sums); what makes it hard is spotting the cannibalisation and ignoring the sunk cost without being prompted. A reviewer could fairly call it difficulty 2.
- The first maths question asks for the 'extra' contribution from each Business user who moves. That wording nudges candidates towards the cannibalisation point before they find it themselves. If you want a harder test, reword it or have the interviewer ask the £25 total first.
- The answer zone is 'about £25'. A candidate who argues for £25 to £28 using the rivals' prices could deserve partial credit. Check the rubric does not mark that as wrong outright, given the sharp drop above £25 in the survey.
- The new 'Business customers leaving' fact removes a real strategic point: insurers may push customers to rivals if Shield is too dear. That keeps one clear answer. Decide whether you would rather leave it open as a judgement point for strong candidates.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- 'Cyber insurers have started asking for backups that cannot be deleted' is reported as something Stowline's customers say, not as a market fact. It matches the real trend of insurers asking for immutable or offline backups. No change needed.
- 'Must give 60 days' notice' before a price rise is written as Stowline's own term, not UK law (this is business-to-business; no statutory 60-day rule applies). Fine as a client fact.
- Judgement call: the brainstorm idea of a 'time-limited launch offer' for Business customers sits slightly against the CEO not wanting a price rise in year one. The offer ending is not a list-price rise, so it was left alone.
- Name check: a web search found no real cloud-backup company called Stowline; the closest hit was an unrelated open-source tool, Stowmark. The rivals are not named.

## case-011: Pellbrook Clinics: why are waits getting longer?

`content/cases/pellbrook-clinics-waiting-times.json`, on the preview at `/cases/pellbrook-clinics-waiting-times`. Operations, difficulty 2, about 25 minutes.

**What the first review changed**

- Fixed a logic flaw at the heart of the case. The facts said patients who miss an appointment 'rarely rebook' and were mostly 'seen elsewhere'. Patients who leave the list would make it shrink, not grow by 100 a week. The facts now say nearly all of them rebook, which is what makes the queue maths (list grows by requests minus patients seen) correct.
- Rewrote the survey fact to match: most missed patients forgot an appointment booked weeks earlier, or could not get through by phone to change it; only a few were seen elsewhere. This ties in with the case's causes: reminders stopped, cancelling is hard, long lead times.
- Added a 'waiting list' fact (it includes patients rebooking and has not been checked for over a year), so the 'check the list' idea is backed by a fact.
- Added that empty slots crept up month by month since the reminders stopped, which explains how the list grew by 3,000 over the year while the gap is 100 a week today.
- Added that Pellbrook does not charge for missed appointments, so the deposit and late-fee ideas have a basis.
- Added why Saturdays and not weekdays (most consultants do NHS work on weekdays) and that consultants have offered up to 25 Saturday sessions a week. The Saturday maths question now asks for 25 sessions of 10 patients instead of giving '250 extra patients'.
- Relabelled the first exhibit's rows so weekly flows and the waiting-list stock are clearly different ('New patients asking for a first appointment (a week)' and so on), and retitled it.
- Exhibit insights now explain the rebooking link and note the virtuous circle (shorter waits mean fewer missed appointments).
- The revenue maths question now says why every empty slot is lost revenue (thousands of patients are waiting to fill it).
- The backlog working now adds when the list drops below the insurers' 3-week line (about 8 to 9 weeks).
- Rubric: added a good sign (asks whether missed patients rebook) and a red flag (treats 200 empty slots as the list's weekly growth instead of 900 minus 800).
- Recommendation rubric and model answer: added the insurer risk (about 60% of revenue, about £5m a year), Saturday break-even even with two empty slots, and the 3-week milestone.
- Added one brainstorm idea (video first appointments where suitable).

**Fixed in the second check**

- Said the insurers' patients are '60% of revenue, about £5m a year'. The facts give 60% of patients at £200 per first appointment, and the case covers first appointments only; follow-up revenue is never given. So £5m (800 x £200 x 50 x 60% = £4.8m) is 60% of first-appointment revenue, not of all revenue. Fix: Now reads '60% of first-appointment revenue, about £5m a year' in the good sign, and '(about £5m a year of first-appointment revenue)' in the model answer.

**Please check or decide**

- The key judgement call: the case now assumes nearly every patient who misses an appointment rebooks and goes back in the queue. Check this is believable for UK private outpatients. Without it, empty slots would not lengthen the list.
- Prices and pay: £200 per first appointment, consultants paid a fixed £1,000 per 10-slot session (rather than billing patients themselves), and £1,500 per Saturday session. Check these fit how UK private clinics actually pay consultants.
- 25 Saturday sessions a week across 8 clinics (about 3 per clinic) is ambitious; check it is credible for this many consultants.
- The £2m 'revenue lost to empty slots' is the value of wasted capacity while a backlog exists, not lost demand; a sharp candidate may make that point, and the interviewer should accept it.
- The case is a free preview, so visitors can see the first exhibit (requests, slots, empty slots, list size) before the interview. This was already the design; I did not change the flag.
- Difficulty 2, interviewer-led, 25 minutes, 4 maths questions: fits.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- 'Most [consultants] also work in the NHS on weekdays' is written as a fact about Pellbrook's own consultants. It fits the real UK pattern: HCA Healthcare UK says many of its consultants also work for the NHS, and a secondhand source quotes about 90% for UK private specialists, though I could not find the original report. No change needed.
- Judgement call: 'empty slots cost about £2m of revenue a year' (200 x £200 x 50) counts wasted capacity, as the question tells the candidate to. Because patients who miss an appointment rebook, the cash shortfall against demand is closer to £1m (800 seen against 900 asked for), and £2m only holds while the backlog lasts (about 48 weeks if every slot were filled). The question's framing makes £2m the defined answer, so it was left alone.
- Judgement call: the list grew by 3,000 over the year (about 60 a week on average), but grows by 100 a week now. If empty slots had crept up evenly from 100 to 200, growth would total about 2,500. That needs empty slots to have risen faster early on, which sits slightly against 'crept up month by month' and the vicious-circle story. Not a contradiction, so it was left alone.
- Judgement call: 'the insurers' warning is the bigger risk' (£5m against £2m) assumes both insurers would move most of their patients.
- Name check: a web search found no real clinic group called Pellbrook; the near misses were Porterbrook Clinic and Pembroke.

## case-012: Brinmoor Bike Share: why are so many bikes out of service?

`content/cases/brinmoor-bike-share-repairs.json`, on the preview at `/cases/brinmoor-bike-share-repairs`. Operations, difficulty 3, about 35 minutes.

**What the first review changed**

- Fixed a maths flaw in the station-repair scenario. It gave every remaining workshop bike the all-bike 2-day bench average, but that average included the 12-minute quick fixes, so major repairs must take longer. The breakdowns exhibit now has a 'Days on the bench' column (quick 1, brakes 1, major 6; still 2 on average, matching the stage exhibit).
- With that fix, the station-repair answer changes from 350 (91%) to 400 (exactly 90%, no margin). The working says why 350 is too optimistic, so the interviewer can push back on a candidate who uses the average.
- Added a fifth maths question: keeping e-bike batteries and motors in stock cuts major repairs to 2 days on the bench, which brings bikes out of service to 320 (92% available). Raised the estimated time from 30 to 35 minutes to fit it.
- Rewrote the parts fact so the long bench time is explained (batteries and motors take about a week to arrive) and priced (a stock costs about $40,000 once).
- Made the target clear: availability is a share of the whole fleet. Buying bikes therefore cannot fix it, and the old '800 more bikes reach 3,600' reasoning was corrected in the rubric and model answer.
- Added a 'Which bikes break' fact (60 pedal and 40 e-bike breakdowns a day; e-bikes break about twice as often; routine station checks stopped six months ago) so the inflow branch has something to find.
- Trucks fact: a third truck costs about $90,000 a year and would roughly halve pickup time, so candidates can price the logistics lever.
- Added how soon things can start (mobile crews within about a month) and that mechanics can work overtime, for the timeline and the backlog push.
- Reworded the first maths question so it can be answered before any exhibit (1,000 out of service, 100 breakdowns a day), as a real test of the breakdowns-times-days idea.
- The more-mechanics working now adds that even zero queue time leaves 500 out of service (87.5%).
- Fixed the breakdowns exhibit's insight: quick fixes spend about 9 days out of service, not 10.
- Rubric: added good signs (quick fixes still spend about 4 days outside the workshop queue; bench time by repair type) and red flags (missing that the target is a share of the fleet; treating exactly 90% as safe).
- Recommendation rubric and model answer: updated to the new numbers (400 then 320), the costs (crews $200,000 a year plus parts $40,000 once, against $600,000 a year of penalties) and the risks (two crews exactly match 50 quick fixes a day).
- UK spelling: tire to tyre throughout. The currency stays in dollars because the client is in the US.

**Fixed in the second check**

- Said 800 more bikes 'would still leave 75% available, and they would break too'. 75% (3,600 / 4,800) already assumes the new bikes break at today's rate. If none broke, availability would be 3,800 / 4,800 = 79%. The sentence mixed the two cases. Fix: Now reads 'would still leave under 80% available even if none of them broke, and they would break too', which is true either way.
- Said that with more mechanics 'every bike still takes about 6 days'. That is only the average: by repair type it is 5 days for quick fixes and brakes and 10 days for major repairs (still 600 in total). Fix: Changed 'every bike' to 'the average bike'.

**Please check or decide**

- The case is now harder: the answer is a package (station crews, clearing the queue and a parts stock), not one lever. Check that a 35-minute, difficulty 3, candidate-led case with 5 maths questions is right, or decide to drop the easy first question.
- The station-repair question now expects 400. A candidate who uses the 2-day average bench time gets 350 and will be asked to re-check. Check the question wording ('for each kind of repair') is a fair enough hint.
- The case assumes 'availability' means the share of the whole fleet in service. Check this matches how a city contract would word it, since it decides that buying bikes cannot help.
- Check the industry numbers: about 100 breakdowns a day from 4,000 bikes (e-bikes twice as often), a mechanic at $60,000 a year, a mobile crew at $100,000 a year fixing 25 bikes a day, an average bike at $2,000, the $40,000 parts stock and a $90,000 truck.
- The workshop's 400-minute daily shortfall means its queue grows by roughly 11 bikes a day. The facts now say out-of-service numbers rose fastest in the last two months, which is consistent, but the snapshot is not a steady state; a sharp candidate may notice.
- Two crews exactly match today's 50 quick fixes a day. The rubric treats this as a risk to mention, not an error.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- All costs are written as Brinmoor's own figures, not market rates: a mechanic at about $60,000 a year, a bike at $2,000, a mobile crew at $100,000 a year, a truck with driver at $90,000 a year and a parts stock at $40,000 once. A reviewer may want to check they look realistic for a US city.
- An availability target with monthly penalties, written into a city bike-share contract, is presented as Brinmoor's contract, not an industry norm. Plausible.
- British spelling ('tyre') in a US-set case matches the site-wide convention (content/ uses 'centre' 72 times and 'labour' 21 times), so it was kept.
- Judgement call: a 1-day workshop queue at 94% utilisation (3,000 of 3,200 minutes) is optimistic by queueing theory. The case says it holds 'once the backlog is cleared', and that backlog is about 18,000 mechanic-minutes, roughly 90 days of the 200 spare minutes a day. That is why the plan's overtime push matters.
- Judgement call: the station-repairs answer is 400. A candidate who uses the 2-day average bench time gets 350, which is marked wrong, but the question now says 'for each kind of repair' and the exhibit gives bench days by type, so it is fair.
- Name check: a web search found no real bike-share scheme called Brinmoor.

## case-013: Bramblecup: is a UK supermarket deal worth taking?

`content/cases/bramblecup-uk-supermarket-deal.json`, on the preview at `/cases/bramblecup-uk-supermarket-deal`. Market entry, difficulty 2, about 30 minutes.

**What the first review changed**

- Made the board's test clear: the UK business must break even by its second year (that year's sales cover that year's costs), and a loss is allowed in year 1. Before, 'within two years' could be read as covering two years of costs in total.
- Made the exclusivity explicit: Bramblecup could sell nowhere else in the UK, in shops or online. The 24% sum only works if all its sales go through the chain.
- Took the two answer rows ('Price paid to Bramblecup' 140p and 'Left to cover fixed costs' 50p) out of the cost-per-pot exhibit. Before, the first maths question could be read straight off the table.
- Added 'at shelf prices' to the market exhibit title, so the £12m break-even and the £200m market are measured the same way.
- Added a break-even pots question (6 million). Candidates naturally work out pots first, and before this a '6 million' answer could be scored against the £m question by mistake. The shelf-sales question now builds on it (6m x £2 = £12m).
- Added a fifth maths question for the counter-offer: with a one-year exclusive and the two other chains in year 2, break-even needs 10% of their £120m.
- New facts so the interviewer can answer the natural follow-ups: the two other chains sell 35% of the market; online grocers and health-food shops would stock it straight away but sell only 5%; the chain offers normal terms with no launch help and wants a brand its rivals lack; six flavours in 400g pots; a leaner £1.5m launch is possible but sales would build more slowly; Bramblecup holds about 6% of US sales after eight years.
- Changed 'in-store promotions' in fixed costs to 'in-store tastings and displays'. Grocery promotions usually mean price cuts per pot, which would not be a fixed cost.
- Rubric: added a red flag for comparing break-even with the whole UK market (6%) and calling it easy. Added good signs for comparing with Bramblecup's own US share, and for spotting that no other big chain would stock it in year 1 anyway, so the real cost of exclusivity is year 2.
- Synthesis rubric and model answer now cover the year-2 point, a per-store check (about 290 pots a store a week) and the counter-offer figures (10%, or 5% at £1.5m of fixed costs). The answer is now a conditional route: decline as offered, counter with one year plus a leaner budget, or license.
- Idea bank: added ways to keep more per pot (each extra 10p cuts break-even volume by a sixth) and having the chain fund tastings.
- Estimated time raised from 25 to 30 minutes for five maths steps. Difficulty stays at 2 and the case stays interviewer-led.

**Fixed in the second check**

- It said "each extra 10p a pot cuts the break-even volume by a sixth". Only the first 10p does that: 50p to 60p takes the volume from 6m to 5m pots, which is 1/6. The next 10p (to 70p) takes it from 5m to about 4.29m, which is about 14%, not 1/6. Fix: Changed it to "an extra 10p a pot, 60p instead of 50p, cuts the break-even volume by a sixth, to 5 million pots".
- Model answer and rubric: in year 1 exclusivity also shuts out online grocers and health-food shops (about 5% of the market), so the "real cost is year 2" point now says so.
- Recommendation and next steps: the other two chains will only consider Bramblecup after a year of sales data, so the plan now asks them to confirm in principle and put their interest and likely terms in writing, rather than to commit up front.

**Please check or decide**

- The central judgement: is needing 24% of one chain's plant-based yoghurt sales by year 2 clearly unrealistic for an unknown brand? The case says yes, against the second brand's 20% national share, the oat brand's 8% after five years and Bramblecup's own 6% in the US. Exclusivity could earn it better in-store support than a national average suggests, so please confirm this is convincing.
- The counter-offer: I called 5% of the three chains' sales in year 2 (at £1.5m of fixed costs) 'a stretch, but within reach'. Please check that this conditional 'go only if' answer is the right zone, and that it is not too generous given the slower sales that come with less advertising.
- Realism of the invented numbers: a £200m UK market at shelf prices, a £2.00 shelf price for 400g, a 30% supermarket margin, 90p of costs per pot, £3m a year of fixed costs, and a chain selling about 1,200 plant-based pots a store each week.
- Five maths questions is on the long side for a 30-minute case. If interviews run over, the counter-offer question (break-even-share-one-year-exclusive) can be dropped; the good signs still reward it.
- The 3% tolerance on the 24% answer rejects 'about a quarter' (25%). The numbers come out exactly, so I kept it strict. Please say if you want it looser.
- Both company names were web-searched on 15 Oct 2026 and no real business came up.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- Supermarket margin of 60p on a £2.00 shelf price (30%): plausible for branded chilled food in the UK, but it is a judgement call. Not checked against a source.
- "Chilled yoghurt keeps for only about four weeks": stated as a general fact. Chilled yoghurt commonly lasts roughly 3 to 5 weeks, so it looks reasonable. Not checked against a source.
- A £2.00 shelf price for a 400g plant-based pot, a £200m UK category, and growth slowing from 20% to 5%: these read as made-up case data (no real brands are named), not real market figures. The reviewer may want to confirm they look realistic.
- The case does not mention VAT, and treats the shelf price as money split between the chain and Bramblecup. Most UK food is zero-rated for VAT. A search did not confirm that plant-based yoghurt is zero-rated, but nothing in the case depends on it.
- Rule 2.1: a web search found no real company called Bramblecup. The competitor brands are unnamed ("Leading brand" and so on).

## case-014: Hollinsway: should a home insurer sell pet insurance?

`content/cases/hollinsway-pet-insurance.json`, on the preview at `/cases/hollinsway-pet-insurance`. Market entry, difficulty 1, about 25 minutes.

**What the first review changed**

- The recommendation is now 'go ahead, but in stages'. Before, it was a plain 'go ahead'. The base case only just clears the bar: £1.2m against a £1m goal. Profit drops below £1m if take-up falls under about 9% or claims rise above about 72% of premiums.
- Added a fourth maths question on the actuaries' warning: at 80% claims the margin is £30, half of today's £60, and profit falls to zero.
- Take-up fact: year 3 is the first full-size year (focus there). About half of pet owners already insure elsewhere and rarely switch, because a new insurer usually will not cover existing illnesses. This gives a strong candidate a fair reason to challenge the survey's 10%.
- Price fact: the £300 average is after the two-policy discount, and all premiums exclude insurance premium tax. The exhibit's premium row now says 'after the two-policy discount'.
- The home insurance renewal benefit has no reliable figure and is a bonus, not part of the £1m. Added a red flag for counting it towards the goal.
- Permissions fact now also says Hollinsway has enough capital to back the policies (not important for this case), so the AI interviewer has an answer if asked.
- Objective reworded so the payback test reads clearly: earn back the set-up cost within three years once at full size.
- Rubric: added a good sign for questioning a take-up figure that comes from a survey. Synthesis good signs now include the room for error (about 37,000 policies or 72% claims) and a pilot with go or no-go tests.
- Idea bank: added aiming first at uninsured owners (new puppies and kittens), testing demand with a partner insurer's policy under the Hollinsway name before spending the full set-up cost, and customers leaving at renewal after price rises.
- Model answer updated to match: it flags that the 10% may be optimistic, gives the room for error and sets pilot criteria.
- Estimated time raised from 20 to 25 minutes for four maths steps. Difficulty stays at 1 and the case stays interviewer-led.

**Please check or decide**

- Main judgement call: 'go ahead in stages, with a pilot' against a plain 'go'. With £1.2m against a £1m goal, a 1-point fall in take-up or a 2-point rise in claims misses the goal, so I think a staged go is the strongest answer. Please confirm, or tell me if you would rather widen the margin so 'go' is clear-cut.
- Realism for UK pet insurance: a £300 average premium, a 70% claims ratio, £30 of handling, £1.2m a year of fixed costs, and 10% take-up among pet owners. That 10% is high for a cross-sell, especially if half are already insured elsewhere. That is intended as something to challenge, but check that it does not feel implausible.
- The payback test is deliberately simple: set-up cost divided by full-size yearly profit, which ignores the losses of the ramp-up years. The facts tell the interviewer to focus on year 3. A strong candidate may raise the ramp-up, and the interviewer will say that is out of scope.
- The case states two industry facts in plain terms: premiums exclude insurance premium tax, and new pet insurers usually exclude existing illnesses. Neither gives a rate or a firm-specific claim. Please confirm you are happy with that.
- 'Assume one pet policy per pet-owning household' means the 3% who own both a dog and a cat count once. That is a simplification a candidate may question.
- Payback counts only the £2.4m set-up cost and ignores the losses in years 1 and 2 while take-up builds. The Objective fact defines payback that way on purpose ("once it is at that size, earns back its one-off set-up cost"), so this is not an error. But a candidate who adds the years 1 and 2 losses will get a longer payback, and the interviewer should not mark that as wrong reasoning. Suggested: Left for the human reviewer (judgement call).
- The pilot test is "take-up on track for 10%", but profit only falls below £1m below about 9.2% take-up. The test is stricter than the board's goal. That is a defensible choice, not an inconsistency. Suggested: Left for the human reviewer (judgement call).

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- "All premiums in this case exclude insurance premium tax": checked. UK insurance premium tax exists, and GOV.UK lists pet insurance at the standard rate of 12% (https://www.gov.uk/tax-on-shopping/insurance-premium-tax, checked 15 Oct 2026). The case does not state the rate, so nothing depends on it.
- "Owners rarely switch, because a new insurer usually will not cover illnesses the pet already has": checked. Insurer guidance (ManyPets, Waggel citing the ABI) says a new insurer usually treats earlier conditions as pre-existing and excludes them, though some cover them after a symptom-free period. "Usually" is accurate.
- A £300 average premium described as "in line with similar policies", 70% claims, and 10% take-up: realistic enough for a case, but the reviewer should judge.
- Rule 2.1: a web search found no real company called Hollinsway.
- I recomputed every number: 40% pet owners = 400,000; margin £60; profit £1.2m; payback 2 years; at 80% claims the margin is £30 and profit is zero; profit stays above £1m only if take-up is at least 36,667 policies (9.2%) and claims stay at or below 71.7% of premiums; break-even is 20,000 policies (5%). All match the prose.

## case-015: Orvessa: why have paid subscribers stopped growing?

`content/cases/orvessa-subscriber-growth.json`, on the preview at `/cases/orvessa-subscriber-growth`. Growth, difficulty 3, about 35 minutes.

**What the first review changed**

- Renamed the client from Parlune to Orvessa in the title, prompt, facts, brainstorm and answers, because Parlune is a real UK language-learning tool (same industry). Orvessa returned no matches in a web search. The id was kept; the slug was changed afterwards (see below).
- Objective fact now says the 600,000 goal is about six quarters away, so a candidate can judge whether the fix is fast enough.
- Free users fact now says the 1% quarterly conversion has not changed in two years.
- New fact on why the checkout was changed: to make the first payment look smaller. It did not lift conversion, so going back to the old checkout carries little risk.
- New revenue fact: $19.5m a quarter, up from $13.8m (annual plan counted as $30 a quarter, monthly as $45; checked against the plan mix). The finance team reads it as healthy. This is the real-world trap: revenue rose while each subscriber's lifetime value fell.
- Checkout fact changed from 'almost 9 in 10' to 'about 9 in 10' choose monthly, so the new maths question has a clean input.
- How-subscribers-leave fact now explains why 4 in 10 not renewing each year equals about 10% leaving each quarter (renewal dates are spread through the year).
- New maths question 'base-if-nothing-changes': with 9 in 10 choosing monthly, the base settles at about 440,000 (110k annual + 330k monthly). This puts a number on the cost of doing nothing.
- Corrected the growth-at-old-plan-mix working: at 30,000 a quarter the base passes 600,000 in just over a year, not 'a little under', because cancellations grow as the base grows.
- Lifetime-revenue working now spells out the tension: monthly pays 50% more each quarter but is worth about half as much over its life. Tolerance widened from 5% to 10% because the question says 'roughly'.
- Structure rubric: plans bucket now covers lifetime value; added good signs for checking acquisition quickly and asking what changed when growth slowed; added a red flag for taking rising revenue as proof the checkout worked.
- Synthesis good signs: added the cost of doing nothing (about 440,000), that the mix shifts back slowly so six quarters needs more than the checkout fix, and that reverting is low risk.
- Idea bank: added an annual plan paid in monthly instalments, and nudging inactive subscribers before they cancel.
- Model answer rewritten: answer first, root cause, why the problem was missed (revenue), sizing, and a recommendation with risks, using the case's own numbers.
- Estimated time raised from 30 to 35 minutes for the fifth maths question; exhibit 1 title made clearer.

**Fixed in the second check**

- The tolerance was 10%. A candidate who turns the 30% quarterly leaving rate into a monthly rate (1 - 0.7^(1/3), about 11.2% a month, or about 8.9 months at $15 = about $134) gets a ratio of about 2.24, which is 12% from the expected 2. That more precise answer would have been marked wrong. Fix: Raised tolerance_pct from 10 to 15. This accepts about 1.7 to 2.3. The common wrong approaches give answers well outside that range: 0.67 (comparing what each pays per quarter) and 3 (comparing how many quarters each stays).
- Both said revenue rose from $13.8m to $19.5m "because" a monthly subscriber pays $45 a quarter against $30. Over the two years, most of that rise came from the base growing from 400,000 to 500,000. At the old plan mix, 500,000 subscribers would bring in $17.25m. The plan mix explains why revenue rose faster than subscribers (about 41% against 25%), not the whole rise. Fix: The working now says "which is why revenue rose faster than the number of subscribers". The model answer now says "(about 41%, while subscribers rose 25%), partly because a monthly subscriber pays $45 a quarter against $30".
- The case's web address and file name changed from parlune-subscriber-growth to orvessa-subscriber-growth: Parlune is a real language-learning app, and the first reviewer had already renamed the client to Orvessa in the text. A web search on 15 Oct 2026 found no app or company called Orvessa.

**Please check or decide**

- Check the revenue fact: is it a fair trap, or too strong a hint? Revenue per subscriber went from $34.50 to $39, which points a sharp candidate to the plan-mix shift.
- Judgement call on the six-quarter goal: my own quarter-by-quarter projection (not given to the candidate) shows the checkout fix alone reaches about 580,000 in six quarters and about 600,000 in seven. So the model answer calls the goal tight and adds moving existing monthly subscribers onto annual. Confirm you agree.
- There are now five maths questions in a candidate-led case. Check that 35 minutes and the AI's pacing (4 to 8 analysis exchanges) still fit. The last two questions (30,000 a quarter, 440,000 settle point) could be one 'size the prize' discussion.
- The leaving rates are simplified: 30% a quarter for monthly is about 11% a month, and lifetime is taken as 1 divided by the leaving rate. A candidate who compounds monthly gets a ratio of about 2.2, which falls just outside the 10% tolerance on the answer of 2.
- The plan-mix exhibit gives away the root cause once shown. That is intended: the candidate has to think to ask for cancellations by plan.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- No real-world rules or figures are relied on. Prices ($120 a year, $15 a month, "in line with competitors") are case data about invented competitors.
- The story holds together in a simulation. Starting from 400,000 subscribers at 70% annual, with 10% of new subscribers choosing annual and quarterly leaving rates of 10% and 30%, the base reaches about 488,000 at about 40% annual after six quarters and is roughly flat over the last year. Simply going back to the old checkout mix reaches only about 580,000 in six quarters. That supports the good sign that existing monthly subscribers also need moving onto annual plans to reach 600,000.
- Recomputed: revenue $13.8m and $19.5m; leaving rates 16% and 22% from both the flow table and the plan mix; lifetime $300 against $150; +30,000 a quarter at the old mix, passing 600,000 after 5 quarters (594,000 after 4, 609,000 after 5), which is "just over a year"; steady state 440,000, with 75% on the monthly plan; cancellations up 71.9%, which is "more than 70%".
- "About six quarters from now" for "the end of next year" is fixed in the case's own timeline, so it does not depend on today's date.

## case-016: Sizing London's market for electric cargo bikes

`content/cases/london-cargo-bikes.json`, on the preview at `/cases/london-cargo-bikes`. Market sizing, difficulty 2, about 30 minutes.

**What the first review changed**

- Made the delivery table more realistic: the old 10%, 15% and 20% cargo-bike shares (12% of all London deliveries) were high for today. New table: parcels 1.5m a day at 6% and 60 drops a bike; grocery and meal kits 300k at 10% and 20 a bike; local businesses 200k at 10% and 10 a bike. Overall share is now 7%, and the fleet (5,000) and each segment's bike count are unchanged, so every later number stays the same.
- Exhibit insight now reads cleanly: parcels make 75% of deliveries but use only 30% of the bikes; local businesses make 10% but use 40%; grocery and local businesses together run 70%.
- Objective fact now explains the £2m bar: it is the level at which Tandrel's centres in other cities cover their running costs.
- New facts for questions a candidate will naturally ask: spare bikes and days off (ignore spares), age of the fleet (assume ages are spread evenly), and competitors (none runs a delivery-business centre).
- Share fact now says Tandrel reached 20% in a centre's second year, which supports a lean, phased start.
- New maths question 'growth-needed-for-bar': fleet growth only needs to be about 8.3% (against the 25% assumed) for a 20% share to reach £2m. This quantifies the main risk.
- Tandrel-sales working now adds the break-even share: about 13% of the market reaches £2m.
- Brainstorm question widened from the market alone to the market and Tandrel's share. Added ideas: large carriers buying through Europe-wide deals, local businesses valuing nearby servicing, and competitors responding.
- Rubric: added a structure good sign for asking about the client's decision bar. Added synthesis good signs for headroom on growth and share, a slower first year, which customers to target first, and that fleet divided by life overstates replacements for a young fleet.
- Model answer updated with the new table, the break-even numbers and a sharper recommendation: open lean and lead with local businesses and grocery firms.
- Estimated time raised from 25 to 30 minutes for the fifth maths question.

**Fixed in the second check**

- The fact said takeaway riders 'mostly use their own ordinary bikes or e-bikes'. Rider surveys show mopeds and motorbikes are a big share, at times the largest: a 2019 Transport Planning Society survey found 52% on petrol mopeds or motorbikes and 35% on pedal bikes. Fix: Now reads 'mostly use their own bikes, e-bikes or mopeds, not cargo bikes'. The meaning for the case (leave them out) is unchanged.
- It stated as real-world fact that only 'a handful' of makers sell cargo bikes in London and that none runs a centre for delivery businesses. That cannot be checked and is probably wrong: many cargo-bike brands sell in London. Fix: Reworded as a case assumption: 'Assume a handful of other makers sell cargo bikes in London, mostly through general bike shops, and that none runs a sales and service centre just for delivery businesses.'
- It said parcel carriers need only 30% of the bikes 'because one parcel bike makes 60 drops a day'. That is only half the reason. Parcels' share made by bike is also lower (6% against 10%). Parcels make 75% of all deliveries but only 64% of bike deliveries (90,000 of 140,000). Fix: Now reads 'because only 6% of parcels go by bike and one parcel bike makes 60 drops a day'.

**Please check or decide**

- Check the delivery figures for London: 2m deliveries a day, 7% by e-cargo bike, 60 parcel drops a bike a day. They are invented and labelled 'case assumptions'. I reduced the old shares, but they may still be ahead of real London adoption.
- Check the £6,000 average price after fleet discounts. It is at the low end for commercial e-cargo bikes (heavy trikes cost much more). A higher price would make the bar easier to clear and weaken the 'no growth' downside.
- Judgement call: the fact asks the candidate to assume an evenly spread fleet age, while a good sign rewards noting that a fast-growing fleet is young, so fleet divided by life overstates replacements. Confirm you are happy to reward the point while keeping the simple calculation.
- The break-even growth answer is 8.33% with a 6% tolerance (accepts about 7.8% to 8.8%, so 'about 8%' passes). Check the tolerance is not too tight for candidates who round 1,667 bikes differently.
- Recommendation: open the centre but start lean. With £3m against a £2m bar, a 50% margin, and break-even growth of 8% against 25% assumed, I think 'yes, phased' is the one clear answer. Confirm you would accept a well-argued 'wait for parcel-carrier commitments' as a weaker but valid answer.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- Takeaway riders' vehicles (now 'bikes, e-bikes or mopeds'): a 2019 Transport Planning Society survey of food couriers found 52% on petrol mopeds or motorbikes, 35% on pedal bikes and 2% on e-bikes. E-bikes have grown a lot in London since then. No current London breakdown was found.
- £6,000 average e-cargo bike price after fleet discounts and a 4-year life in daily delivery use: plausible but not checked against a source. Both are stated as case assumptions.
- 1.5 million parcel deliveries a day in London and the bike shares in the exhibit: the exhibit labels them 'case assumptions', so they are not real-world claims, but a reviewer may want to confirm the scale feels realistic.
- Judgement call (not changed): the good sign and recommendation say grocery firms, like local businesses, are 'the most likely to value a nearby service centre'. The facts only support this for small local businesses (the brainstorm's 'no workshop of their own'). Grocery firms may run their own depot workshops.
- Judgement call (not changed): the answer is 'yes, open the centre', but Tandrel only reaches its 20% share in the centre's second year, and it needs about 13% to hit £2 million. A reviewer may want to decide whether first-year sales below the bar should soften the 'yes'.
- Judgement call (not changed): the fact says to assume the fleet's ages are spread evenly (1 in 4 replaced a year), while a good sign rewards noting that a fast-growing fleet is young. This is consistent as a sense-check of the simplification, but it is worth a look.

## case-017: How big is the US dog-walking market?

`content/cases/us-dog-walking-market.json`, on the preview at `/cases/us-dog-walking-market`. Market sizing, difficulty 1, about 25 minutes.

**What the first review changed**

- Prompt now says 'within five years', so the fund's question has a time frame from the start (before, it was only in the facts).
- Added a fifth maths question, 'share-needed': the share of all paid walks Strollhound needs for $50 million is 8.3% ($250 million of bookings / $3 billion, about 12.5 million walks). This is the key 'so what' of the case, and before it was only a loose 'at 8% it would be $48 million' line in the rubric.
- Added a fact telling the interviewer what to do when a candidate offers their own figure (households, dog ownership, usage, walks or price): call it a fair guess, then steer them to the case figure. Without this, a candidate using their own numbers would be marked wrong on every maths step.
- Added a fact 'Strollhound today' (launched a year ago in three cities, still small; its own figures are not needed), so a natural question gets an answer and the next step has something to point at.
- Added a fact 'Customers leaving the app' (some regular customers book their walker directly to avoid the 20% cut), the biggest real risk for a marketplace like this. The interviewer shares it only if asked.
- Competitors fact now also says many owners book a walker they know directly, which supports the 'fragmented market' point in the answer.
- Rubric: added a good sign for working back from $50 million to the share needed. Added a red flag for treating the $3 billion of bookings as Strollhound's revenue. Added 'dogs' to the households-not-people good sign. The segment bucket now reads 'for example regular and occasional', so other sensible splits still get credit.
- Recommendation rubric: the must-mention list now includes a clear answer (the market is big enough, but the investment rests on winning more than about 8% of walks). Good signs now cover the off-app booking risk and checking Strollhound's share in its launch cities.
- Model answer now includes the 8.3% share needed, the off-app risk and concrete next steps.
- Idea bank: added keeping regular customers on the app (lower fees on repeat bookings, cover that only applies to app bookings) and buying or partnering with small local agencies. 'pet stores' became 'pet shops'.
- UK spelling: 'math' became 'maths'.
- Estimated time raised from 20 to 25 minutes to fit five maths steps plus the brainstorm and recommendation stages.
- Checked: no real business called 'Strollhound' turned up in a web search. Status stays draft, with reviewer fields left empty.

**Please check or decide**

- Realism of the inputs: 125 million households, 40% with a dog, 1% regular and 4% occasional users, $20 a walk. Together they give $3 billion a year. All are invented, rounded case figures; please check that the 1% regular-user rate (500,000 households spending about $4,000 a year each) feels believable to you.
- Judgement call: the answer is deliberately marginal ($60 million at the founders' 10% share, against a $50 million bar; 8.3% needed). A strong candidate should say 'yes, but only just, and it rests on the share'. Please check that you agree this is the right answer, rather than a flat yes.
- The new fact about the candidate's own assumptions is an instruction to the AI interviewer, not a case fact. Check that it reads naturally for a market-sizing case, where real interviewers often let candidates choose their own numbers.
- Off-app booking (customers booking their walker directly) is now in the facts and the rubric as the main risk. Check that it isn't too much for a difficulty-1 case.
- The case has no exhibits, as is usual for market sizing. It also has five maths steps: check whether that is too many for a 25-minute beginner case.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- 'Assume 125 million US households': the Census Bureau's CPS ASEC 2025 gives about 134.8 million (FRED TTLHH; 132.2 million in 2024). It is stated as an assumption, so it is not wrong, but it is about 7% low. A candidate who knows the real figure is told to use the case figure by the 'Candidate's own assumptions' fact.
- 'Assume 40% of households own a dog': APPA's 2026 State of the Industry report says about 53% (about 71 million households) in 2025, and other estimates are around 43-51%. It is an assumption and works fine for the maths, but it is on the low side.
- $20 average for a 30-minute walk and a 20% platform cut: plausible industry levels, not checked against a source. Both are stated as case assumptions or client facts.
- Not a problem, just noting: the 'Candidate's own assumptions' fact is really an instruction to the interviewer, written as a fact. lib/ai/prompt.ts lists facts as 'share only when asked', so it works when a candidate offers their own figure. A reviewer may prefer this style or not.
- The first reviewer changed 'math' to 'maths' and 'pet stores' to 'pet shops' in this US case. This matches the site's UK English and only affects interviewer-facing rubric text, so it was left as is.

## case-018: Cragwell Climbing: how to double revenue in five years

`content/cases/cragwell-climbing-growth.json`, on the preview at `/cases/cragwell-climbing-growth`. Growth, difficulty 2, about 30 minutes.

**What the first review changed**

- Made the new-centre timing clear. The 'Opening pace' fact now says a centre's first full year is the year after it opens, and the exhibit row is now 'Full year in which mature revenue is reached' (3 for a full centre, 1 for bouldering-only). Before, '1 year to reach mature revenue' could be read either way, which muddled whether a centre opened in year 4 counts in full in year 5.
- Added a fifth maths question, 'full-centres-cost': closing the £12 million gap with full centres needs 6 of them, costing £30 million, £10 million over budget. Comparing the two formats is the heart of the case, and before, a candidate's full-centre maths could not be recorded.
- Added a fact 'Profit today' (each centre makes about £400,000, 20%, before head-office costs and interest; daytime programmes should keep that margin). The owners' 'stay profitable' goal had no profit data behind it. The new figure matches the exhibit's full-centre profit.
- Added a fact 'Where new centres would go' (about 15 suitable towns and districts; assume no customers taken from existing centres). This answers the natural questions about demand and cannibalisation (new centres taking existing centres' customers), and gives the 10 openings something to stand on.
- Cut repeated text: the bouldering build-cost working now ends at '£15 million, within budget, about £5 million in reserve'; the full-centre comparison moved to its own maths question.
- Rubric: added a good sign for asking where new centres go and whether they take existing customers, and a red flag for building the plan on buying rivals when none has been identified.
- Recommendation rubric: added a good sign for weighing the one possible mix (1 full and 9 bouldering-only centres just fits at £18.5 million) and explaining why bouldering-only still wins. The risks now include opening 10 centres in four years when the first 8 took 12.
- Model answer now covers today's margin, the mix option, the 'open by end of year 2' limit for full centres, the 15 identified places and the execution risk.
- Idea bank: added a small peak-time supplement on day passes (kept within rivals' prices) and outdoor climbing trips.
- Checked: no real business called 'Cragwell Climbing' turned up in a web search. Spelling was already UK English. Status stays draft, with reviewer fields left empty.

**Fixed in the second check**

- 'A small peak-time supplement on day passes, kept within rivals' prices' contradicts the Prices fact, which says Cragwell's prices are already in line with local rivals. Any supplement would therefore push them above rivals. Fix: Now reads 'A small peak-time supplement on day passes, of no more than a few per cent so that climbers do not switch to rivals', which matches the Prices fact.

**Please check or decide**

- The best answer is about 10 bouldering-only centres plus daytime programmes. I found that 1 full centre plus 9 bouldering-only centres also fits the budget (£18.5 million for £12.8 million of revenue). The rubric now rewards spotting this and explaining why bouldering-only is still better. Please check you agree it shouldn't be scored as an equally good answer.
- Unit economics are invented. Bouldering-only: £1.5 million to build, £1.2 million revenue, £300,000 profit (25%). Full centre: £5 million, £2 million, £400,000 (20%). Please check these feel right for UK climbing walls.
- The 25% daytime uplift is management's estimate and is taken as given. Weekday daytimes run at 30% of capacity, which supports it, but a sceptical interviewer might push on it. Check whether the candidate should be expected to challenge it.
- Payback is simple: build cost divided by mature operating profit, ignoring loan interest and ramp-up. That is fine for a case, but a finance-minded candidate may raise it.
- The new 'no cannibalisation' assumption keeps the maths clean. A strong candidate should still name new centres taking existing customers as a risk; check that the wording leaves room for that.
- With five maths steps, 30 minutes for a candidate-led difficulty-2 case is about right, but it is tight.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- No outside real-world facts. Bouldering is described correctly (shorter walls, no ropes, thick mats). The demand, format and site figures are all case assumptions.
- Judgement call (not changed): a 25% revenue lift per centre from weekday daytimes alone (30% of capacity used) is ambitious. By a rough capacity-hours estimate, daytime use would need to rise to about 70%. It is framed as management's estimate.
- All numbers recomputed and consistent: streams sum to £2,000k; memberships and day passes are 70%; courses and events are 20%; 8 x £2.5m = £20m; gap £12m; 10 bouldering centres at £15m; 6 full centres at £30m; payback 5 against 12.5 years; the 1 full + 9 bouldering mix makes £12.8m revenue for £18.5m (2 full + 7 would cost £20.5m, over budget); full centres must open by the end of year 2 to be mature in year 5; 10 openings in 4 years is within the 3-a-year limit.

## case-019: Larkmoor Supermarkets: should it buy a meal-kit firm?

`content/cases/larkmoor-meal-kit-acquisition.json`, on the preview at `/cases/larkmoor-meal-kit-acquisition`. M&A, difficulty 3, about 35 minutes.

**What the first review changed**

- Renamed the client from 'Larkmoor Markets' to 'Larkmoor Supermarkets' and changed its sales from $3 billion to $2.4 billion. A web search found a competitor practice case, 'Larkspur Markets', about a $3 billion regional grocer weighing an acquisition. I did not open it, but the surface match was too close for rule 2.1. The id and slug are unchanged.
- Rewrote the prompt in our own wording and added 'what is the most we should pay?', so a walk-away price is part of the expected answer.
- Made the customer spend realistic: a box costs about $50 and customers order about two a month (they can skip weeks). Before, it was $100 a month for 'weekly boxes', which is too low.
- Said that Hearthbox's customer base was flat through the year, so the 100,000 average and the 200,000 new customers are clearly consistent.
- New fact on how sure each synergy is: food and packaging about 10% cheaper (fairly safe), and the $50 cost to win a customer from one small email test (untested at scale).
- New facts: delivery with Larkmoor's vans (possible, not costed, not in the plan); integration costs of about $5 million plus first-year losses (not in the 8 times rule); why the founders are selling (they have about a year of cash, which gives Larkmoor leverage).
- Year-3 plan exhibit now shows how the $25 contribution is built ($100 revenue - $45 food and packaging - $30 delivery), so candidates can split the two synergies. Updated the maths cell references to match.
- Added a fifth maths question: if winning a customer costs $75 instead of $50, the value falls to $100 million. The working adds that each $1 on that cost is worth $2.4 million, so $180 million needs it below about $42.
- Sharpened the exhibit insights: ingredient synergy worth about $9 million a year against about $30 million for cheaper marketing; 300,000 sign-ups a year is 15% of loyalty members every year.
- Recommendation fixed: the old outline said 'walk away above $160 million', which hands every Larkmoor synergy to the seller. Now: about $100 million up front plus an earn-out of up to about $40 million, and walk away well below $160 million.
- Rubric: added good signs (asks why the founders are selling; splits the safe synergy from the uncertain one; uses limited cash as leverage) and a red flag for taking the plan's figures as given. The idea bank has 13 ideas, including loyalty fatigue, cannibalisation, integration costs and upsides not in the plan.
- UK spelling: centres, programme, cancelling.

**Fixed in the second check**

- The must-mention says the synergies are something 'the seller should not be paid for', and the red flag penalises being 'willing to pay the seller for synergies that only Larkmoor can create'. But the case's own model answer pays $100 million up front plus up to $40 million earn-out for a business that 'on its own is worth little'. Almost all of that money is synergy value. Taken literally, the model answer would trip its own red flag, and a candidate making the standard 'share some synergies, never all' argument could be marked down. Fix: must_mention[1] now ends 'and the seller should not be paid for all of it'. The red flag now reads 'Is willing to pay the seller the full value of synergies that only Larkmoor can create'.
- Title shortened to "Larkmoor Supermarkets: should it buy a meal-kit firm?" so it fits the share picture at its usual size (the first reviewer's longer title did not).

**Please check or decide**

- The 8 times year-3 operating profit rule is a deliberate simplification: no discounting, and years 1 and 2 are ignored. Check you are happy with it for a difficulty-3 M&A case. A strong candidate may say it flatters the value.
- Judgement call on price: the model answer offers about $100 million up front plus an earn-out of up to about $40 million, a maximum of $140 million. Any offer between roughly $100 million and $140 million, with clear logic for the walk-away price, should score well. Paying $160 million or more should not.
- Check the unit economics feel right for a regional meal-kit player: 50% food and packaging, 30% packing and delivery, a $150 cost to win a customer, a 6-month average life and a $50 box about twice a month.
- There are now five maths questions in 35 minutes. If that feels tight in practice, the $75 sensitivity is the one to make optional; it is also listed under good signs.
- Earn-out nuance: year-3 targets depend partly on Larkmoor's own marketing. A sharp candidate may say the earn-out should be tied to things the founders control, such as retention. That is a good sign, not a flaw in the case.
- The client name changed in the title and text, but the slug is still larkmoor-meal-kit-acquisition, as instructed. Please also confirm the case does not resemble the 'Larkspur Markets' case on mbbprep.com. I deliberately did not open it.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- Facts: 'operating margin of about 3%, which is normal for supermarkets'. Plausible. FMI's supermarket facts page (https://www.fmi.org/our-research/supermarket-facts) gives an average net profit of 2.1% for food retailers in 2025. Kroger's 2024 operating profit of $3.8bn on $147.1bn of sales is about 2.6%. Operating margins of roughly 2-4% are typical, so 'about 3%' is fair, but a reviewer may prefer 'a thin margin, as usual for supermarkets'.
- No real company found named Hearthbox (meal kit) or Larkmoor (supermarket) in a web search on 15 Oct 2026. The national meal-kit brands are unnamed. No firm names are used.
- Judgement call, not fixed: year-3 overhead stays at $10 million even though customers grow 50% (100,000 to 150,000).
- Judgement call, not fixed: the 10% saving is applied to food AND packaging, but the fact only says Larkmoor's buyers checked Hearthbox's main ingredients.
- Judgement call, not fixed: the prompt asks 'what is the most we should pay?', but the model answer gives no single walk-away number ('well below $160 million'; offer $100m plus up to $40m earn-out, so $140m at most). A candidate who says '$160m less the $5m integration cost and first-year losses, so about $150m' is reasoning correctly. Must-mention 3 still passes them through its 'earn-out, or a pilot' alternatives, but a reviewer may want an explicit walk-away figure.
- UK spelling (centres, programme, cancelling) in a US-set case matches the house style used across the other cases.

## case-020: Cobalt Basin: why did profit fall in a record snow season?

`content/cases/cobalt-basin-ski-resort.json`, on the preview at `/cases/cobalt-basin-ski-resort`. Profitability, difficulty 3, about 35 minutes.

**What the first review changed**

- Said that last season's snow was about average. The '$10 million is normal snow cost' step and the next-season profit check depended on this, but nothing said it.
- New fact on why the resort sells passes (cash before the season, whatever the snow). Candidates now weigh repricing against scrapping the pass, and scrapping is a new red flag.
- New fact on who bought the extra passes: about three-quarters were last season's day-ticket buyers, about 5 days each. So about 75,000 of the 100,000 lost day visits switched, and crowding explains the rest. The exhibit insight states this.
- Crowding fact now notes that midweek slopes were quiet, which supports the midweek-pass idea.
- Replaced the 'extras this season' maths question, whose $21 million answer is printed on the P&L. The new question asks what a pass visit brings ($40 lift + $20 extras = $60, against $150 for a day-ticket visit).
- Added a maths question checking the target: with the pass at $600, normal snow costs and this season's extras, profit is $19 million, about $1 million short of the $20 million goal.
- Reordered the maths into the order the case unfolds: share of the fall first, then per-visit figures, the pass price, and the target check.
- Made the $600 question say clearly that volumes stay at this season's levels.
- Rubric: added 'asks who bought the extra passes' as a good sign. The synthesis now treats $600 as a floor rather than the only answer (anything up to the old $800 is defensible, with rivals at $900), and rewards keeping the pass's cash benefit.
- Model answer updated: diagnosis, value per visit, the $1 million shortfall, and 'keep the pass but reprice it'. The idea bank adds a renewal price for current pass holders and multi-day ticket packs.
- Raised est_minutes from 30 to 35 for the fifth maths question and the candidate-led format.
- UK English: lift queues, car parks and accommodation, in place of lift lines, parking lots and lodging.

**Fixed in the second check**

- It says that at a higher pass price 'some pass holders will go back to day tickets, which helps revenue'. By the case's own facts this is wrong. A typical switcher skied about 5 days on day tickets ($500 lift + $250 extras = $750). As a pass holder they ski 10 days and bring P + $200, which is $800 at $600 and $1,000 at $800. So above $550, someone going back to day tickets lowers revenue. A candidate who worked this out would contradict the rubric. Fix: Reworded to: 'it assumes all 30,000 pass holders come back, but at a higher price some will go back to day tickets or leave, and anything up to the old $800 is defensible with rivals at $900'. This is accurate, and it is the real reason $600 is a floor.
- It said only 'winning back day visitors or selling more extras must close the last $1 million'. That leaves out a pass priced above $600 (about $634 closes it), which the next good sign and the recommendation ('at least about $600') both endorse. Fix: Added 'a pass priced above $600,' to the list of ways to close the gap.
- 'every day visit that turns into a pass visit costs the resort about $90' implies a one-for-one swap. The case says switchers went from about 5 day visits to 10 pass visits. Per switcher the loss is $150 ($750 down to $600), not 5 x $90. A candidate scaling the $90 by visits would get the wrong answer. Fix: Changed to 'so a pass visit brings in about $90 less than a day-ticket visit' (a per-visit comparison only).

**Please check or decide**

- Difficulty 3 is a judgement call. Each step is visible in two exhibits, so it could be a strong 2. What earns the 3: the case is candidate-led, the weather is a red herring, and the $1 million target shortfall plus 'reprice, don't scrap' need judgement. Downgrade if you think it plays easier.
- Check realism for an independent Rockies resort: 500,000 to 600,000 visits, about $100 average day-ticket yield, $70 million revenue and a 29% profit margin, and snow costs rising 30% in a record year.
- The $600 pass price assumes volumes don't change. A strong answer says fewer passes sell at $600 and some holders go back to day tickets, which helps revenue. Reverting to $800 is accepted as defensible, not marked wrong.
- The new 'who bought the extra passes' fact (three-quarters were past day-ticket buyers at about 5 days each) splits the 100,000 lost day visits into about 75,000 switched and about 25,000 crowded out. Check that this reads naturally and does not over-steer the candidate.
- The two maths ids changed (extras-this-season was replaced by revenue-per-pass-visit, and profit-with-pass-at-600 was added). No real interviews have run yet, so no stored session refers to the old id.

**Second checker's notes** (real-world claims, and the numbers it recomputed)

- No real ski area named 'Cobalt Basin' found in a web search on 15 Oct 2026. The nearest names are Tri Town near Cobalt, Ontario, and Arapahoe Basin in Colorado, both clearly different.
- Prices ($100 day ticket, $400-$900 passes, rivals' $110 day tickets) are invented facts about the client and its rivals, not stated as industry norms. A reviewer may find a $100 day ticket low for a Rocky Mountain resort, but nothing depends on it being typical.
- Recomputed the visitor-mix breakdown, which matches the exhibits exactly. Lift revenue: -$4m (existing 10,000 holders paying $400 less), -$1.5m (15,000 switchers), +$2m (5,000 new holders), -$2.5m (25,000 day visits lost to crowding) = -$6m. Extras: -$0.75m, +$1m, -$1.25m = -$1m.
- Judgement call, not fixed: the profit-with-pass-at-600 question assumes this season's volumes at $600. At $600 a pass pays for itself after 6 days, so many of the 5-day switchers would likely not renew. It is a stated assumption, and the edited good sign now flags it.
- UK terms (car parks, queues, 'Maths' in the model answer) in a US-set case match the house style used across the other cases.

## Bank-style case studies (16 Oct 2026)

These six cases are practice for the case studies some banks use at assessment centres and final-round interviews. They have track `banking`, so the AI interviewer plays a senior banker and writes the debrief as one. On 16 Oct 2026 each case went through three steps:

1. **Written** from scratch, with an invented company and invented, internally consistent numbers.
2. **Reviewed twice, separately.** One reviewer read it for banking realism: would a UK banker accept the story, the terms and the answer? Another checked the maths, consistency, originality and format: every number recomputed by hand, the facts checked against the exhibits, and anything that could make a correct answer score as wrong.
3. **Fixed.** A third pass applied the must-fix points and most of the smaller ones, and said what it rejected and why.

Every case's maths is also recomputed by the automated tests (`npm run content:check`), and all six pass. **All six cases are still drafts.** Only a human reviewer can sign one off (CLAUDE.md: "Never set a case to `reviewed` yourself"). Ideally that is someone with banking experience: lending, mergers and acquisitions, or capital markets.

| Id | Case title | Type |
|---|---|---|
| case-021 | Thornbury Foods: what to pay for a snack brand? | M&A |
| case-022 | Quillmere Packaging: can it carry a £25 million loan? | Other (a lending decision) |
| case-023 | Wyncliffe Bank: should it launch a savings app for young people? | Market entry |
| case-024 | Harlow Building Society: what next for its branches? | Profitability |
| case-025 | Calder Instruments: should it hedge its dollar income? | Other (currency hedging) |
| case-026 | Fennick Software: list on a stock exchange or sell? | M&A |

**Points that apply to all six**

- The bank's rules in each case are that case's own invented figures, presented as one bank's policy. They include the valuation multiples, the 3 times debt limit, the 1.25 times cover minimum, the 4-year payback rule, interest rates, fees and discounts. No real bank, rate, statistic or regulation is stated as a fact (rule 2.2). Please say if any of them would strike a banker as unrealistic.
- Four cases put the candidate in "our bank", advising a client. Two put the candidate inside the organisation instead: Wyncliffe (a graduate in the bank's own strategy team) and Harlow (a graduate in the building society's strategy team). The AI banker's instructions say it has given the candidate "a client situation" (`lib/ai/prompt.ts`). Please decide whether the in-house framing works, or whether those two should be rewritten as clients of our bank.
- Two names changed along the way. The reviewers renamed Kestrel Plastics to Quillmere Packaging, and the writer renamed Brightwell to Wyncliffe. The name checks were web searches (plus Companies House for Quillmere), not trade mark checks.

## case-021: Thornbury Foods: what to pay for a snack brand?

`content/cases/thornbury-foods-snack-deal.json`, on the preview at `/cases/thornbury-foods-snack-deal`. M&A, difficulty 2, about 30 minutes. A UK own-label biscuit maker wants to buy Hedgewick, a fast-growing snack brand sold at auction. The candidate, in a bank's mergers and acquisitions team, values it, sets the most to pay and names the risks.

**What the reviews changed**

- Both reviewers found that the recommended earn-out (part of the price paid later, only if the largest customer's sales hold up) did not cover the risk it was meant to cover. If that customer halves its orders, the stand-alone value falls by £60 million, yet the full £100 million is paid up front. The offer is still £100 million up front plus up to £20 million later, with £120 million as the walk-away price. But the model answer now says the £20 million covers only a third of that fall, so the binding offer depends on due diligence. It also lowers the walk-away price to about £111 million if the crisp production move looks doubtful (£100 million plus half of the £22 million from the high-confidence savings). A new good sign rewards spotting this.
- The idea bank suggested using Thornbury's own relationship with the supermarket chain. In an auction, bidders sign a confidentiality letter that bars contact with the target's customers, so that would be wrong advice. A new fact says so, and the advice is now a customer call arranged by the sellers' adviser in the second round.
- Question 4 (the largest customer halves its orders, so the value falls to £40 million) keeps its answer. Its working now says this is the first-year hit with marketing unchanged. Once marketing is cut back to 20% of sales, EBITDA recovers to about £6.4 million (about £64 million), though the multiple might fall too. A new good sign gives credit for that point.
- New model-answer point on how the deal would really go. The sellers may resist an earn-out because the sales founder leaves. An all-cash rival bid may look stronger. And the £120 million headline already equals the walk-away price, so the second round can change only the mix, not the total.
- New fact on the asking price: the sellers' forecast is £12.5 million of EBITDA next year, so £150 million is 12 times forecast; the bank uses the latest full year because the forecast relies on more growth at the largest customer.
- Other facts clarified: the business is handed over with a normal level of working capital; delivery is a fixed yearly contract, so it does not fall with sales; sales to other customers grew about 13% a year (the old fact said "only slowly"); the second-largest customer is another supermarket chain; and Thornbury's operations team estimated the synergies and the bank checked them (banks do not usually build those estimates).
- Leverage now reads "about 2 times, a little more once the one-off costs and deal fees are paid" (£160 million / £80 million, about 2.1 times with the £10 million of one-off costs).
- The prompt now says who the candidate is, like the other bank cases. "Own-label" and "years to repay" are explained, and "headroom" is replaced with plain words.
- Rejected: "trial the crisp production move during due diligence". Thornbury cannot run a trial before it owns the business, because it does not yet have the seasoning and packing line. The model answer says to check the plan in detail instead.

**Please check or decide**

- Main judgement call on price: about £100 million up front plus up to £20 million later, walking away at £120 million (about £111 million without the crisp move). Decide what range should score well. Should a candidate who lowers the up-front amount, rather than relying on an earn-out, get equal credit?
- Is 10 times the latest year's EBITDA believable for a fast-growing UK challenger snack brand, with the sellers hoping for 15 times (12 times their forecast)? The banking reviewer thought so. Both are stated only as this bank's own figures.
- Two simplifications to accept or change. Synergies are valued at the same 10 times, ignoring tax and timing. And the board has its own rule of paying the sellers at most half of the synergy value.
- Question 4 is harsh on purpose: a 20% fall in revenue takes 60% off the value, because marketing and overheads stay fixed in year one. Check you are happy that the answer key stays at £40 million and that a candidate who argues for about £64 million gets credit through the good sign.
- Check the realism of a 50% gross margin, marketing at 20% of revenue and an EBITDA margin of about 17% for a brand that uses contract manufacturers.
- The gluten-free risk (making the crisps in a wheat biscuit factory) is presented as Thornbury's own operational point, with no regulation named.
- The confidentiality fact is invented for the case: no contact with Hedgewick's customers, and a possible customer call for the best bidders in the second round. Check it matches how a UK sale by auction is usually run.
- Name check: web searches found no "Thornbury Foods" food company (Thornbury is a real town, and there is an unrelated Thornbury Motors) and no snack brand called Hedgewick. The writer also found a real 2019 deal of the same broad kind (Tayto Group buying Bite UK) and took nothing from it. You may want to confirm the case does not resemble it.

## case-022: Quillmere Packaging: can it carry a £25 million loan?

`content/cases/quillmere-packaging-term-loan.json`, on the preview at `/cases/quillmere-packaging-term-loan`. Other (a lending decision), difficulty 2, about 30 minutes. A family-owned packaging maker asks its bank of 12 years for a £25 million loan towards a new production line. The candidate, in the bank's corporate lending team, decides whether to lend as asked, lend with conditions, or decline.

**What the reviews changed**

- Renamed from Kestrel Plastics to Quillmere Packaging, with a new slug, file name and exhibit id, and every mention in the text. Real UK plastics firms trade under the Kestrel name (Kestrel Mouldings in Plymouth, Kestrel Thermoplastics), and case-006 already has a Kestrel Vale. A case about a firm that fails a bank's lending policy should not carry a name readers could link to a real firm in the same trade. On 16 Oct Companies House and two web searches found no Quillmere.
- The owners' £5 million must go in as new shares (equity), not as a loan. Under the case's own definition, a loan from the owners counts as debt and would take leverage back to 3.5 times. The model answer, idea bank and must-mention now say so. The leverage fact now says owner loans are debt and new shares are not. The "Cash and dividends" fact leaves open which form the owners have in mind, so the candidate has to raise it.
- The model answer now shows that both fixes are needed together. £20 million on the original schedule still gives year-1 cover of only about 1.15 times (7 / 6.1), and a one-year repayment holiday at £25 million gives year-2 cover of about 1.17 times (8.5 / 7.28). The writer's summary had claimed the first was already shown; it was not. The must-mention now requires both a smaller loan and interest only during the build.
- The recommendation stays the same: about £20 million, interest only during the 12-month build, then repaid over nine years. It now admits that year 2 rests on management's untested forecast. Cover drops below 1.25 times if year-2 cash is about £0.6 million short of plan, and to about 1.1 times if it stays at £7 million. So it now also asks for a minimum cash balance or an owners' guarantee.
- New good sign for sizing the loan on cover as well as leverage: cover allows a new loan of only about £17 million without a holiday and about £22.5 million with one, so the £20 million leverage limit is the one that binds.
- New good sign for noticing that £20 million leaves no room under the 3.0 times limit. The model answer now suggests about £18 million (2.8 times) if the owners can put in a little more or the line's cost can be cut.
- New good signs for questioning the new line's 20% margin against 12.5% for the business today, for asking about the extra stock and customer credit (working capital) the new revenue needs, and for checking that the 10-year loan is shorter than the line's expected life, now stated as about 15 years.
- Wording fixes: the covenant idea now puts the leverage limit above forecast leverage and the cover minimum below forecast cover (the old line was backwards for cover); the security is now "thin", not "weak"; the tax fact explains that £1 million is the tax paid in cash on last year's figures; the £25 million-with-a-holiday figure is now "about 1.17 times", not "about 1.2"; and the brainstorm question no longer assumes the bank lends.

**Please check or decide**

- Main judgement call (the fixer asked for it to be recorded here): a flat decline misses must-mention 3, which asks for lend with conditions "rather than lending as asked or declining outright". Should a decline that comes with a smaller, restructured counter-offer count as "lend with conditions"? An example: "no to £25 million as asked, but we would offer £20 million on these terms". The banking reviewer's view: lend with conditions is what a UK relationship bank would do here, because Quillmere is a 12-year client with a sound business that fails on the structure of its request, not on its quality. The rubric was left as it is.
- The bank's rules are invented: total debt at most 3.0 times EBITDA, cover of at least 1.25 times in every year, and 8% interest. Check they feel right for a UK corporate lending case.
- A 10-year loan repaid in equal amounts is on the long side for machinery. The writer chose it to keep the cover sums round. It is now inside the line's stated 15-year life.
- The recommended £20 million sits exactly at the 3.0 times limit. Check the rubric is right to reward noticing that rather than requiring a smaller loan.
- The recommendation lists many conditions: payment in stages, binding contracts for half the line's output, covenants tested every six months, no dividends, a charge over the factory and the line, and a minimum cash balance or guarantee. Check a candidate is not expected to name all of them.
- The leverage fact now tells a candidate who asks that owner loans count as debt. Decide whether that gives away too much of the equity point.
- Display: on the page, the repayment schedule shows £2.0 million and £7.0 million as "2" and "7", next to "1.8" and "6.8", because the site drops a trailing ".0". It is cosmetic. Harlow's exhibit was restated in thousands for the same reason, and this one could be too.

## case-023: Wyncliffe Bank: should it launch a savings app for young people?

`content/cases/wyncliffe-young-savers-app.json`, on the preview at `/cases/wyncliffe-young-savers-app`. Market entry, difficulty 2, about 30 minutes. A regional UK bank whose customers are mostly over 40 wants a separate savings app for 18 to 25 year olds. The candidate, in the bank's own strategy team, judges it against the board's 4-year payback rule.

**What the reviews changed**

- The pilot's test on customers staying was "most customers staying", which is far too loose. The simpler £1 million version pays back within 4 years only if no more than about 1 in 40 customers leave each year (£3 million / (£0.8 million - 40,000 x r x £50) is 4 or less only when r is 2.5% or less). At the bank's usual 1 in 10 it takes 5 years. The test is now "no more than about 1 in 40 leaving a year", and the model answer calls customers staying the make-or-break test.
- The simpler version's 3.75-year payback rested on assumptions no fact stated. The "Cheaper ways to build the app" fact now says running costs stay at £0.4 million. It also says the plan assumes the same customers and balances for the same marketing and bonuses, but without the savings challenges with friends. Every mention of 3.75 years now carries that condition, and a new risk says take-up may fall without the friends feature.
- The deposit margin was defined as what Wyncliffe earns by lending the money out. That is a lending margin, and it invites double counting with later mortgages. It is now what Treasury (the team that manages the bank's money) credits the app for each £1 of deposits, minus the interest paid to the saver; lending profit stays with the mortgage and loan business. The 2% and all the maths are unchanged.
- New fact, so the interviewer does not have to invent an answer: adding savings to the existing Wyncliffe app would cost about £0.5 million, but only current-account customers could use it, and the head of retail thinks young people see its look as their parents' bank. The idea bank lists it as an alternative and the recommendation says why it is not chosen.
- New fact: a typical first mortgage with Wyncliffe is about £200,000 and earns the bank about £1,000 a year. The model answer now says the £0.2 million a year gap to the rule equals the yearly profit on about 200 first mortgages, so the decision turns on whether the link between joining young and taking a Wyncliffe mortgage is real.
- The recommendation is split into "Recommendation" and "Tests and next steps". The one-region start is now judged on its test results, not on payback: the £1 million build is fixed, so one region alone cannot pay back in 4 years.
- New good sign for noting that the payback rule ignores what the app earns after it has paid back, and that money earned later is worth less than money now.
- New risks in the idea bank: Treasury may value these deposits below 2% if they prove quick to leave, and existing young savers moving their money across would bring no new deposits, add a little running cost and, if the app paid more than Wyncliffe's normal rate, cost the bank margin on money it already holds.
- Smaller fixes: identity checks for new customers moved into the cost to win them; the low running costs explained (the app runs on the bank's existing systems and customer service team); the £15 welcome bonus is for customers new to Wyncliffe only; age bands now match the 18 to 25 target ("25 or under"); the claim about young savers' habits now comes from Wyncliffe's own records; and the exhibit's target-customer label matches the fact.
- The slug changed from wyncliffe-student-savings-app to wyncliffe-young-savers-app, because the case covers all 18 to 25 year olds, not only students.

**Please check or decide**

- The payback rule (one-off costs divided by yearly profit at full size, within 4 years) is the bank's own invented rule. The writer noted that a real bank would look at return on capital. The banking reviewer said to keep it as a recognisable hurdle. Decide whether a banking case should use it.
- The structure is close to Hollinsway (case-014): a new product, survey-based take-up, year 3 as the first full-size year, and payback against a fixed limit. Both cases are our own, so there is no copying problem, but they may feel repetitive. Decide whether one should change.
- In-house framing: the candidate works in the bank's own strategy team rather than advising a client (see the points that apply to all six). The fixer left a rewrite to you.
- Check the realism of the invented figures: a £2 million build, £50 to win each customer (£35 of marketing plus a £15 bonus), a 2% deposit margin, a £1,500 average balance, £0.4 million a year to run, and the new £0.5 million existing-app cost and £1,000 a year per mortgage.
- Main judgement call: do not launch the full plan; build the simpler version and start in one region with go or no-go tests. That answer has almost no room for error (it takes 5 years if customers leave at the usual rate). Check you agree it is the best answer, and that a well-argued "do not launch yet" or "make the mortgage case with numbers first" is scored fairly.
- Real rules were deliberately left out: deposit protection limits, real interest rates, tax-free savings accounts and the Bank of England rate. A UK candidate may raise them.
- Name check: a web search found no bank, savings or finance business called Wyncliffe. The only UK companies with the exact name are a machine-tools firm in liquidation, a residents' management company and a dissolved hotel company.

## case-024: Harlow Building Society: what next for its branches?

`content/cases/harlow-building-society-branches.json`, on the preview at `/cases/harlow-building-society-branches`. Profitability, difficulty 2, about 30 minutes. A regional building society's branch profit has fallen from £13 million to £1 million as members move to its app. The candidate, in the society's strategy team, works out why and what to do with the weakest branches.

**What the reviews changed**

- Framing: the prompt had a bank's financial institutions team giving the society's chief executive "an independent view" on branch closures. That is strategy consulting work rather than banking, and the prompt never said who the candidate was. It now puts the candidate in Harlow's own strategy team, like Wyncliffe.
- The £0.6 million for opening the 12 remote branches three days a week was ambiguous. It is the improvement (12 x £50k), not the profit (12 x £20k = £0.24 million). The model answer now says so, so a candidate who says £240k of profit is not marked wrong.
- The model answer kept the remote branches open as if the maths decided it, but the money points the other way. A small branch costs £180k and is credited with £150k, so closing it pays even if every member left. Closing all 12 remote branches would add about £1.8 million a year, against £0.6 million for opening three days a week. The model answer now says keeping them is a judgement about members: they are older, many use cash, 5 are the last branch in town, 1 in 5 new savers name a local branch as a reason to join, and a mutual can accept a lower return. A new good sign rewards seeing this, and the must-mention now also accepts a reasoned case for closing the remote branches not covered by the pledge, with a plan for their members.
- The problem is network-wide. On the case's own trend (about 22% fewer counter transactions next year), every type of branch, large ones included, would make a loss next year: about £3 million in total. The small-branch plan is worth about £1.8 million a year against a fall of about £4 million, so the model answer now calls for a cost plan across the whole network.
- A date clash fixed: the app now launched six years ago, so the two closures five years ago no longer come before it.
- New fact, "Rules on closing branches": treat the board's own pledge as everything Harlow must do; the real UK rules are not tested. Without it, a candidate who asked would have led the AI interviewer to describe real regulation.
- Other new facts: Harlow's overall profit is about £20 million a year, about the same as three years ago; the mortgage and savings advisers' costs and income sit outside the branch figures; many older members use a passbook savings account as their everyday account, which explains the high counter use; and the profit Harlow keeps is its main way to build capital.
- Smaller fixes: "net interest income" and "net interest margin" are now used correctly; the closure cost now includes ending the lease, so the 8-month payback holds; the channel exhibit is restated in thousands, so its numbers display evenly; the first exhibit's title and hint are tighter; and the £4.70 against 25p cost per transaction is now flagged as not like for like.
- The society moved from the East of England to the south-west, so it is no longer named after a real Essex town in that town's own region.

**Please check or decide**

- Main judgement call: close the 8 small branches near another branch, open the 12 remote ones three days a week, and keep face-to-face help in the 5 towns where Harlow's branch is the last one. Check you agree, and that a reasoned case for closing more of the remote branches (now accepted by the rubric) is scored fairly.
- Name: Harlow is a real town in Essex. Moving the society to the south-west weakens the link, but a fully invented name (for example "Fenmere") would remove it. That needs a new slug and file name, so the fixer left it to you.
- The format reviewer noted that the board's "12 weeks' notice" matches the notice period in real UK branch-closure guidance. The real UK rules on access to cash are deliberately left out. A banker may expect a strong UK candidate to raise regulation, and the new fact steers them away from it. Decide whether that is right for a banking case.
- Simplifications for clean maths: branch income moves exactly in line with counter transactions at £5 each, every branch type lost exactly 40% of its transactions, and branch costs stayed flat. Real internal accounts would credit income on balances and new sales.
- The 20% income loss after a closure comes from two closures about 2 miles from another branch, so it may understate the loss for remote branches. The three-day result comes from one branch over six months. Both are now listed as risks; check they carry enough weight.
- In-house framing (see the points that apply to all six).
- Check the volumes: 30 million transactions a year for 300,000 members is about 100 each, now explained by passbook use.

## case-025: Calder Instruments: should it hedge its dollar income?

`content/cases/calder-instruments-currency-risk.json`, on the preview at `/cases/calder-instruments-currency-risk`. Other (currency hedging), difficulty 2, about 30 minutes. A UK instrument maker earns most of its sales in dollars and has a loan covenant to keep. The candidate, in a bank's global markets team, decides how much of next year's dollar income it should fix in advance (hedge).

**What the reviews changed**

- Lower sales: the certainty exhibit calls $10 million of US sales "uncertain", and losing them would take £8 million off revenue. That could threaten the covenant more than a 10% weaker dollar. A new fact says lower sales are a separate threat, already being discussed with the lending team, and the covenant test uses the budgeted sales. The model answer now says the covenant holds "in the budget case" and that a hedge protects against the exchange rate, not against lower sales. A new good sign rewards saying so.
- The right-answer zone is now in the rubric: hedge roughly $27 million to $35 million (for example about $30 million). $27 million is the least that keeps the covenant if the dollar weakens 10%, $35 million is the net dollar income Calder is likely to receive, and all of it is within the bank's $40 million limit. Before, a well-argued $35 million could have been marked down.
- The model answer now adds forwards up to about $35 million as repeat orders are signed. It also admits that $30 million is about $10 million more than the near-certain $20 million: if repeat orders fall short and the dollar strengthens to £0.88, buying $10 million to deliver would cost about £1 million.
- The bank's margin: one fact said it was built into the forward rate, while others put the whole £0.02 gap down to interest rates. They now agree: mostly the interest-rate gap, plus the bank's small margin.
- The bank's two roles: a good sign rewarded hedging partly because it protects the bank's own loan. It now rewards seeing the conflict instead. The bank is both the lender and the seller of the hedge, so it must size the hedge to Calder's real exposure, explain it fairly and let Calder decide. A new red flag: recommending the full $40 million limit, or hedging mainly to protect the bank's loan.
- The certainty exhibit said $30 million to $35 million matched dollars Calder was "very likely" to receive, which its own table contradicted. It now says "likely", and explains why hedging only the near-certain $20 million is not enough (profit would be £3.6 million in the weak case).
- New case assumption: for the covenant test, forwards count in operating profit at the forward rate, and an option's premium counts as a cost. The options fact now also says options use none of the $40 million forward limit.
- New fact on late payments: Calder can move a forward's date, or use forwards that can be drawn on over a window of dates. A matching idea replaced an idea-bank entry that described something Calder already does (paying dollar costs from the dollars it receives).
- New good signs for seeing that the £0.80 budget rate cannot be locked in (£5.1 million is the best fixed profit), and that options do not do the covenant work (options alone on $45 million leave profit at £3.3 million).
- Smaller fixes: "In this case, today $1 is worth £0.80", so it does not read as a real quote; a note that markets usually quote the pair as dollars per pound; "our desk does not advise clients on where the rate will go"; and hedging all $45 million is labelled a benchmark only, because it is over the $40 million limit.
- The fixer softened two claims the case data cannot support. Missing $10 million of sales "could" hurt more than a weaker dollar, because the case gives no figure for the costs saved. And "a company might" set its budget rate at the forward rate, so it does not read as a real-world fact.

**Please check or decide**

- The case defines "the dollar weakens 10%" as each dollar being worth 10% fewer pounds (£0.72). Read the other way (the pound buying 10% more dollars, $1.375), the answer comes out about 9% off and is marked wrong. The definition is in a fact, the exhibit and the question. Markets quote this pair as dollars per pound, so some candidates will think the other way round; check the case makes it clear enough.
- Main judgement call: hedge about $30 million, with anything from about $27 million to $35 million accepted. At $30 million, profit is only £0.2 million above the covenant in the weak case. Check this is a fair central answer.
- The option (the right to sell dollars at £0.75 for £0.01 a dollar) is priced by the case. Both reviewers thought that plausible for a fairly calm currency. The banking reviewer worked out that the forward rate being 2.5% below today's rate implies dollar interest rates about 3% a year above pound rates; the case says only that dollar rates are the higher of the two, as its own assumption. A markets person should confirm both.
- Simplifications: one forward rate for every month of next year; the hedge counted in operating profit for the covenant; and the budgeted sales taken as given for the covenant test.
- Check that the conflict between the bank's two roles is handled the way you would want a candidate to handle it. No real mis-selling case or regulation is named.
- Name check: no "Calder Instruments" found. Similar names exist in nearby fields: Calder Testers (valve testing, Houston), Calder Limited (pumps, Worcester) and Calder Temperature Controls (Elland, West Yorkshire). The factory is placed near Cambridge so it does not hint at Yorkshire. Renaming is optional.

## case-026: Fennick Software: list on a stock exchange or sell?

`content/cases/fennick-software-ipo-or-sale.json`, on the preview at `/cases/fennick-software-ipo-or-sale`. M&A, difficulty 2, about 30 minutes. The founder of a UK software company that she half owns must choose between a £600 million private equity offer and listing on a stock exchange (an IPO). The candidate, in a bank's equity capital markets team, works out her cash under each route and recommends one.

**What the reviews changed**

- The decision rule went against the founder's own goals. Her first goal is to stay in charge and her second is £60 million of cash, yet the model answer told her to take the sale if the value came in below about £707 million. That would give up control to make up a small cash shortfall. Now a fall alone is no reason to sell: she can sell a little more (about 11% of Fennick still gives £60 million after a 20% fall, and the bank would allow up to about 12%). The real test is value. If the estimate falls below about £686 million (a fall of about 14%), the IPO price drops below the buyer's £600 million, and the bank should put the choice between value and control to her.
- The fallback did not cover the riskiest months: the buyer's offer lapses at about month 3, but the IPO price is fixed only at about month 7. The facts, must-mention and model answer now say so. The buyer would do its checks in parallel and pay at about month 5 or 6 if chosen at month 3. It might keep its offer open until the IPO is priced, but will not promise to. A new good sign rewards spotting the gap.
- The prompt said the bank thought Fennick "could list at a value of about £800 million", which the exhibit then contradicted: the shares are sold at £700 million after the 12.5% discount. It now says £800 million is the value once the shares trade freely, so the discount is a fair test rather than a trick.
- The first red flag could have penalised a correct answer (the IPO is worth more on paper). It now targets missing the discount and the fact that she sells only 10% at the IPO.
- Wording fix: the venture capital fund "reaches the end of its fixed life" in about two years. The old "its fund closes" means the opposite to a banker (the end of fundraising).
- New fact on valuation multiples, as the bank's own view: similar listed companies are valued at about 6 to 7 times next year's revenue. £800 million is about 6.7 times, and £600 million is 5 times (or 20 times this year's EBITDA). A matching good sign was added.
- Other new facts: why the buyer will not pay more (it could not reach its target return with the borrowing its lenders allow); that the reinvested stake cannot be valued from the case; that staff options are counted as shares; and that at 40% she would in practice usually carry most votes.
- Growth was lowered from 30% to 20% a year, so the multiples look believable. No maths depends on it.
- A recommendation to sell can now earn the must-mention, but only if it explains why certainty should outweigh staying in charge, and how her role would be protected. A matching good sign was added. Because our bank earns more if Fennick lists, the idea bank, a good sign and the next steps now also say she may want independent advice on the choice.
- Smaller fixes: the IPO definition no longer contradicts itself; the price is now "fixed at the end of the bookbuild", just before listing; "leverage" is used only for debt, and negotiating strength is now "bargaining power"; and question 4's tolerance is tightened from 2.5% to 2%.
- Question 4's working now tells the interviewer that its answer (£54.3 million) is not the gap between the two routes on paper (about £54 million), since the two figures are close.

**Please check or decide**

- Main judgement call: the rubric leans towards the IPO, following the founder's stated order of goals, with the private equity offer kept as a fallback and the choice made at about month 3. Check you agree, and that a sale recommendation that explains how her control would be protected gets fair credit.
- Check the realism of the invented terms: a 12.5% IPO discount, 3% commission, 2% sale fees, 20% reinvestment, lock-ups of 12 and 6 months, about £2 million a year of listed-company costs, and the new 12% cap on what she can sell.
- Valuations: 20% growth with a 30% EBITDA margin, 6 to 7 times next year's revenue, and a private equity buyer offering less than the listed value. A strong candidate may say that buyers of a whole company usually pay more for control. Check the case's stated reason is enough.
- Check the bookbuild timing: the price is fixed in "the last two weeks or so before listing at about month 7".
- The "Months until the sellers are paid" row still shows 4 months for the sale, which assumes she signs now. In the recommended dual track the sale would pay at about month 5 or 6 (in the "Doing both at once" fact). Check this does not confuse.
- The gap between the routes on paper (about £54 million) is close to question 4's answer (£54.3 million). The fixer kept the 20% market fall, because at 25% she would need about 11.8% of Fennick, right at the 12% cap. It added a warning to the working instead. Decide whether that is enough.
- Pace: four maths questions in 30 minutes, plus a long recommendation.
- The upside of her reinvested £60 million is described only in words, because the buyer has not said what it expects to sell Fennick for. Each £1 of growth in Fennick's value adds about 40p to her stake after the IPO, against about 14p in the sale.
- Name check: no "Fennick Software" found. The nearest names are Fenwick Software (Australia), Fennech Financial (a UK fintech) and Fennicus Ltd (an IT services company in Devon), none in this trade. The buyer, the fund, the stock exchange and the founder are not named. Tax is assumed equal under both routes.
