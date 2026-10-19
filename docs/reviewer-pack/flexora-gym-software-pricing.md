# Flexora: should the price go up to $75?

Case type: pricing · Industry: Software (SaaS) · Difficulty 2 of 3 · About 25 minutes · Style: interviewer_led

Status: draft (draft until you sign it off). Page on the preview site: /cases/flexora-gym-software-pricing

## 1. What the candidate is told

Flexora sells scheduling and billing software to independent gyms across the US. It charges $60 per gym per month and has 5,000 customers. The CEO wants to raise the price to $75 for everyone. Should the company do it? How would you approach this?

## 2. Facts the interviewer gives only when asked

**Customers and pricing today.** 5,000 gyms each pay $60 a month. Everyone pays the same price, on month-to-month contracts that can be cancelled at any time.

**Customer mix.** Customers range from small studios with under 200 members to clubs with more than 1,000. All of them pay the same $60 today. There is no data on how willingness to pay differs by gym size.

**Costs.** Each gym costs Flexora about $15 a month to serve (support, hosting and reminder messages to members), whatever the price. Fixed costs, such as the product team and offices, do not change with the price either. A breakdown is available.

**Objective.** The CEO wants to maximise monthly contribution (revenue minus variable costs). There is no hard limit on customer losses, but the CEO worries that losing many gyms at once would hurt referrals, which bring in most new customers.

**Competitors.** Two competitors sell similar products to US gyms, at $55 and $80 a month. The $80 product has more features; the $55 product is simpler.

**Customer research.** Last month Flexora surveyed 600 of its customers, a mix of small and large gyms. It asked whether they would stay or cancel within three months if the price rose to each of four higher prices. The results are available.

**Switching costs.** Customers can cancel any month, but moving to another system takes a gym a few weeks of effort.

**Current cancellations.** About 1.5% of customers cancel in a typical month at today's price. Assume that rate stays the same at any of the tested prices, on top of the one-off loss the survey shows.

**New customers.** New customers come mainly from referrals and search. Assume a price change does not change how many new customers join in the next six months.

**Product plans.** No new features are planned in the next six months.

**How a price change works.** Flexora's contracts give existing customers 30 days' notice of a price change. Flexora can change the price for everyone at once or for a chosen group of customers, for example to test it.

## 3. What a good structure includes

Key buckets:
- Customers: willingness to pay and likely cancellations at each price
- Company economics: contribution per customer and the break-even customer loss
- Competitors and alternatives
- Implementation options: one price, tiers or staged rises
- Risks and how to test

Good signs:
- Works with contribution (price minus variable cost), not just revenue
- Calculates the break-even customer loss before looking at the survey
- Compares more than one price point instead of only $60 versus $75
- Asks what the survey measured (who answered, over what period) and questions how reliable stated intentions are

Red flags:
- Looks only at revenue and ignores the $15 variable cost
- Accepts the survey at face value
- Backs $75 because contribution rises, without noticing that the expected 22% loss is close to the 25% break-even
- Ignores competitor prices

## 4. Exhibits (shown when the candidate asks for the right data)

### Variable cost to serve one gym ($ per month)

Shown when the candidate: Ask what it costs Flexora to serve each gym, or for the variable cost per customer.

| Item | Dollars |
| --- | --- |
| Customer support | 8 |
| Hosting and data storage | 4 |
| Text and email reminders to members | 3 |
| Total variable cost | 15 |

What the data says: Variable cost per gym is $15 a month, so each gym contributes $45 today ($60 minus $15). None of it changes with the price, so every extra dollar of price is extra contribution.

### Survey of 600 customers: share who would stay at each price

Shown when the candidate: Ask what the customer research says about how many customers would stay at higher prices.

| Monthly price ($) | Customers who would stay (%) |
| --- | --- |
| 60 | 100 |
| 65 | 95 |
| 70 | 88 |
| 75 | 78 |
| 80 | 62 |

What the data says: Retention falls slowly up to $70 and then faster. At $75, 22% say they would leave, close to the 25% break-even; at $70, 12% would leave against an 18% break-even; at $80, 38% would leave.

## 5. The maths, with working

**Question 1.** If the price rises from $60 to $75, what is the largest percentage of customers Flexora could lose and still make at least today's monthly contribution?

Inputs: old_price = 60, new_price = 75, variable_cost = 15
Expected answer: 25 (accepted within 2%)
Working: Contribution per gym rises from $45 to $60. Keeping total contribution equal needs 45 / 60 = 75% of customers, so up to 25% could leave. Shortcut: the $15 price rise divided by the new contribution of $60 is 25%.

**Question 2.** What is Flexora's monthly contribution today, in dollars?

Inputs: customers = 5000, price = 60, variable_cost = 15
Expected answer: 225000 (accepted within 1%)
Working: 5,000 gyms x ($60 - $15) = 5,000 x $45 = $225,000.

**Question 3.** Using the survey, what would monthly contribution be at $75, in dollars?

Inputs: customers = 5000, price = 75, variable_cost = 15, stay_pct = 78
Expected answer: 234000 (accepted within 1%)
Working: 78% of 5,000 is 3,900 gyms. Each contributes $75 - $15 = $60. 3,900 x $60 = $234,000, which is 4% above today. Revenue falls, though, from $300,000 to $292,500.

**Question 4.** Using the survey, what would monthly contribution be at $70, in dollars?

Inputs: customers = 5000, price = 70, variable_cost = 15, stay_pct = 88
Expected answer: 242000 (accepted within 1%)
Working: 88% of 5,000 is 4,400 gyms. Each contributes $70 - $15 = $55. 4,400 x $55 = $242,000, which is 7.6% above today and $8,000 above the $75 option.

**Question 5.** At $70 instead, what is the largest percentage of customers Flexora could lose and still make at least today's monthly contribution?

Inputs: old_price = 60, new_price = 70, variable_cost = 15
Expected answer: 18.1818 (accepted within 3%)
Working: Contribution per gym rises from $45 to $55, so Flexora needs 45 / 55 = about 82% of customers to stay: it could lose up to about 18%. The survey expects 12% to leave at $70, a margin of about 6 points, against only 3 points at $75 (22% expected versus 25% break-even).

## 6. Brainstorm

Besides one price change for everyone, what else could Flexora do to earn more from its customers?

Ideas a strong candidate might raise:
- Create tiers such as Basic and Pro, so larger or more demanding gyms pay more
- Charge by gym size or number of members
- Offer a discount for paying a year in advance, which also reduces cancellations
- Raise prices in two steps (for example $65, then $70) and watch cancellations
- Protect long-standing customers with a smaller rise
- Add paid extras such as marketing tools or a member app
- Take a small share of the member payments processed through the platform
- Test a new price on new customers or a sample of existing ones first
- Improve onboarding and support to reduce cancellations at any price

## 7. What a good recommendation includes

Must mention:
- Not $75: the break-even loss is 25% and the survey suggests 22% would leave, so contribution rises only slightly ($234k versus $225k) with little room for error
- $70 is the best of the tested prices: about $242k a month versus $225k today, with more room for error (break-even at an 18% loss against 12% expected)
- Survey answers are not the same as real behaviour, so test before rolling out to everyone

Good signs:
- Recommends about $70, or a staged increase with monitoring
- Puts the gain in yearly terms: about $17k a month, or roughly $200k a year
- Considers the effect on referrals and new customers, not only this month's contribution
- Notes that $75 would sit close to the $80 competitor, which has more features
- Proposes a test on a group of customers and the measures to track

## 8. Model answer outline

1. Clarify the objective: maximise monthly contribution without losing so many gyms that referrals suffer. Confirm the $15 variable cost, that normal cancellations stay at 1.5% a month, and that new-customer numbers are unaffected.
2. Structure: customers' willingness to pay, Flexora's economics, competitors and alternatives, how to implement, risks.
3. Break-even first: at $75, contribution per gym rises from $45 to $60, so Flexora can lose up to 25% of customers before it is worse off.
4. Survey: at $75, 78% stay, so contribution is $234k versus $225k today (+4%), but the expected 22% loss is only 3 points short of break-even. At $70, 88% stay and contribution is $242k (+7.6%), with a break-even loss of 18% against 12% expected. At $65 it is $237.5k; at $80 it falls to $201.5k.
5. Insight: the biggest and safest gain comes from a smaller rise than the CEO proposed. Revenue alone would mislead: at $75 revenue falls ($292.5k versus $300k) even though contribution rises.
6. Recommendation: do not go to $75. Move to about $70 (worth about $17k a month, roughly $200k a year), testing it on a group of customers first and giving 30 days' notice; consider a smaller step for the longest-standing gyms. Track cancellations weekly against the 12% the survey implies, and referrals and new sign-ups monthly.

---

## Your review (please fill in)

1. Realistic? 
2. Clear? 
3. Fair? 
4. The answer: 
5. Difficulty and time: 
6. Verdict (Sign off as it is / Sign off after these small changes / Needs rework): 
