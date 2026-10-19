# Stowline: how should it price its new Shield tier?

Case type: pricing · Industry: Software (SaaS) · Difficulty 3 of 3 · About 30 minutes · Style: candidate_led

Status: draft (draft until you sign it off). Page on the preview site: /cases/stowline-backup-pricing

## 1. What the candidate is told

Stowline is a UK company that sells cloud backup to small and medium-sized businesses, priced per user per month. It is about to launch a new top tier, called Shield, which protects customers' backups against ransomware attacks. The CEO has asked you to recommend the price for Shield. How would you work it out?

## 2. Facts the interviewer gives only when asked

**The company and its tiers.** Stowline has about 160,000 users across 6,000 customer businesses, on two tiers: Standard and Business. Prices are per user per month on rolling monthly contracts, and customers can change tier at any time. The tier data is available.

**What Shield adds.** Shield includes everything in Business, plus backup copies that cannot be changed or deleted for 30 days, a promise to restore all data within four hours, and a 24/7 recovery team.

**Objective.** The CEO wants the price that adds the most monthly contribution (revenue minus variable costs) in the first year, without damaging Stowline's reputation for fair pricing. Shield launches in three months.

**Costs.** Shield costs £8 per user per month to serve (extra storage copies and the recovery team's time), against £5 for Business. Treat both as fully variable: the recovery team is supplied by a partner paid per Shield user. The £2m spent building Shield is already spent, and launch marketing costs the same at any price.

**Business tier price.** The Business tier stays at £15 per user per month. Stowline will not change it when Shield launches.

**Competitors.** Two rivals sell comparable ransomware-ready backup to UK businesses, at £22 and £28 per user per month.

**Customer research.** Stowline surveyed 500 Business-tier customers and 300 businesses that use other providers, testing three prices for Shield. The answers were scaled up to Stowline's whole base and the market it can reach, and show the steady monthly level expected once customers have had a few months to switch. The results are available.

**Other prices.** Only £20, £25 and £30 were tested. Stowline could test other prices with a small group of customers before the launch.

**Business customers leaving.** Almost no Business customers in the survey said they would leave Stowline at any of the three prices. Those who found Shield too expensive said they would stay on Business. Treat the Business base as stable in the first year.

**Who would buy Shield.** Mostly Business-tier customers with 20 or more staff, such as accountants, law firms and clinics. Standard-tier customers are mostly very small firms, and almost none would buy Shield at any tested price, so ignore them.

**Why customers want it.** Several customers say their cyber insurers have started asking for backups that cannot be deleted. IT managers say a week without their data would cost them far more than a year of backup.

**Changing the price later.** Stowline can raise Shield's price later, but must give 60 days' notice, and the CEO wants to avoid raising it within the first year.

## 3. What a good structure includes

Key buckets:
- Value to customers: what ransomware protection is worth to them and their willingness to pay
- Competitor prices as reference points
- Stowline's costs: the floor set by the £8 cost to serve
- Cannibalisation: how many Shield buyers are existing Business users already paying £15
- Contribution at each price, then launch and risks

Good signs:
- Uses value, competitors and costs together, not cost plus a markup alone
- Spots that most Shield users would move from Business and counts only their extra contribution
- Works out that an upgrader adds nothing at £18 (£8 cost plus the £10 they already earn on Business) and loses money below it
- Compares all three tested prices on monthly contribution
- Questions how reliable survey answers are, and asks whether Business customers would leave if Shield is priced too high

Red flags:
- Counts the full Shield price for users who move from Business
- Picks the price with the most sign-ups or the most Shield revenue
- Sets the price by cost plus a markup, or simply matches a rival, without using the survey
- Includes the £2m already spent in the pricing decision

## 4. Exhibits (shown when the candidate asks for the right data)

### Stowline's tiers today: prices, costs and users

Shown when the candidate: Ask for Stowline's current tiers, prices, costs or number of users.

| Tier | Price (£ per user per month) | Variable cost (£ per user per month) | Users today (thousand) |
| --- | --- | --- | --- |
| Standard | 8 | 3 | 60 |
| Business | 15 | 5 | 100 |
| Shield (new) | To be set | 8 | 0 |

What the data says: Business earns £10 of contribution per user per month (£1m a month across 100,000 users). A Business user who moves to Shield only adds the gap between Shield's contribution and that £10, so an upgrade adds nothing at £18 and Shield must be priced well above £18 for upgrades to add much.

### Survey: Shield sign-ups at three prices (scaled to the whole base and market)

Shown when the candidate: Ask what the customer research says about demand for Shield at different prices.

| Shield price (£ per user per month) | Business users who would move to Shield (thousand) | New users won from other providers (thousand) |
| --- | --- | --- |
| 20 | 40 | 5 |
| 25 | 30 | 4 |
| 30 | 16 | 2 |

What the data says: Most Shield users at every price would be existing Business users (about 89% at £20 and 88% at £25). Sign-ups fall as the price rises, and fall sharply between £25 and £30 (34,000 to 18,000). The research says nothing about prices between the tested points.

## 5. The maths, with working

**Question 1.** At a Shield price of £25, how much extra monthly contribution does Stowline make from each Business user who moves to Shield, in pounds?

Inputs: shield_price = 25, shield_cost = 8, business_price = 15, business_cost = 5
Expected answer: 7 (accepted within 2%)
Working: Shield earns £25 - £8 = £17 per user per month. That user already earned £15 - £5 = £10 on Business. The extra is £17 - £10 = £7, not £17.

**Question 2.** At £25, how much extra monthly contribution would Shield add in total, in £ thousand?

Inputs: shield_price = 25, upgraders = 30, new_users = 4, shield_cost = 8, business_price = 15, business_cost = 5
Expected answer: 278 (accepted within 2%)
Working: 30,000 users moving from Business x £7 = £210k. 4,000 new users x £17 = £68k. Total £278k a month.

**Question 3.** At £20, how much extra monthly contribution would Shield add in total, in £ thousand?

Inputs: shield_price = 20, upgraders = 40, new_users = 5, shield_cost = 8, business_price = 15, business_cost = 5
Expected answer: 140 (accepted within 2%)
Working: Each user moving from Business adds (£20 - £8) - £10 = £2, so 40,000 x £2 = £80k. 5,000 new users x £12 = £60k. Total £140k a month, half the £25 figure, even though £20 brings the most Shield revenue (45,000 x £20 = £900k).

**Question 4.** At £30, how much extra monthly contribution would Shield add in total, in £ thousand?

Inputs: shield_price = 30, upgraders = 16, new_users = 2, shield_cost = 8, business_price = 15, business_cost = 5
Expected answer: 236 (accepted within 2%)
Working: Each user moving from Business adds (£30 - £8) - £10 = £12, so 16,000 x £12 = £192k. 2,000 new users x £22 = £44k. Total £236k a month, below the £25 option because too few users sign up.

## 6. Brainstorm

Beyond the headline price, what could Stowline do to make the Shield launch pay off?

Ideas a strong candidate might raise:
- Keep clear differences between Business and Shield so the two tiers do not blur
- Offer an annual plan at a small discount to lock customers in
- Give existing Business customers a time-limited launch offer instead of a permanently lower price
- Sell Shield's protection as an add-on to Business priced at the difference
- Offer volume discounts for larger customers
- Sell Shield for the whole business only, not one seat at a time, so firms cannot protect just a few users
- Show the cost of a week without data next to the price, to sell on value rather than on cost
- Partner with cyber insurers and IT resellers to reach new customers
- Target sectors with the most to lose, such as accountants, law firms and clinics
- Provide a yearly restore test report that customers can show their insurer
- Test the price with a sample of customers before the full launch
- Track upgrades, new users and cancellations weekly after launch

## 7. What a good recommendation includes

Must mention:
- Most Shield users would be existing Business users, so each one adds only the extra contribution: £7 a month at £25, not £17
- £25 gives the most extra monthly contribution: about £278k, against £236k at £30 and £140k at £20
- A clear recommendation: launch Shield at about £25 per user per month, between the rivals' £22 and £28

Good signs:
- Spots that £20 brings the most Shield revenue (about £900k a month) but the least extra contribution
- Questions the survey and notes that the ranking holds if every answer is scaled down by the same amount
- Explains why launching at £25 beats starting low and raising later: a rise needs 60 days' notice and could hurt the reputation for fair pricing
- Proposes a test before the full launch and names what to track (upgrades, new users, cancellations)

## 8. Model answer outline

1. Clarify: the goal is the most extra monthly contribution in year one; Shield costs £8 per user to serve; Business stays at £15 (cost £5); the £2m build cost is already spent and does not affect the price; rivals charge £22 and £28.
2. Structure: value to customers, competitor prices, cost floor, cannibalisation of Business, contribution at each price, then launch plan and risks.
3. Key insight: a Business user who moves to Shield already earns £10 a month, so they add only (price - £8) - £10. At £20 that is just £2.
4. Maths: extra contribution is £140k a month at £20, £278k at £25 and £236k at £30. £25 is best (about £3.3m a year once demand settles); £20 brings the most Shield revenue (£900k a month) but the least extra contribution.
5. Checks: £25 sits between the rivals' £22 and £28 and well below what customers say downtime would cost them. Survey answers may overstate demand, but if all are scaled down equally, £25 still wins. Demand drops sharply above £25 and prices in between were not tested, so £25 is the safe choice rather than a guess at £27 or £28.
6. Recommendation (answer first): launch Shield at £25 per user per month. Do not start lower and raise it later, because a rise needs 60 days' notice and could hurt the reputation for fair pricing. Keep the tiers clearly different and offer a discount for annual plans rather than a lower list price.
7. Risks and next steps: survey answers may overstate demand, rivals may cut prices, and Business and Shield could blur. Test £25 with a sample of customers before the launch in three months, then track upgrades, new users and cancellations weekly.

---

## Your review (please fill in)

1. Realistic? 
2. Clear? 
3. Fair? 
4. The answer: 
5. Difficulty and time: 
6. Verdict (Sign off as it is / Sign off after these small changes / Needs rework): 
