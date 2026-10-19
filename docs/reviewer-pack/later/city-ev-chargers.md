# How many public EV chargers will a city need?

Case type: market_sizing · Industry: Energy and mobility · Difficulty 2 of 3 · About 20 minutes · Style: candidate_led

Status: draft (draft until you sign it off). Page on the preview site: /cases/city-ev-chargers

## 1. What the candidate is told

A US city of one million people wants to plan its public charging network for electric vehicles (EVs). Today it has 240 public charging points. The mayor asks: how many public charging points will the city need in five years' time, and so how many more should it plan to add? Estimate the numbers and explain how you got there.

## 2. Facts the interviewer gives only when asked

**Population and households.** The city has 1,000,000 residents living in 400,000 households. Assume the number of households stays the same over the five years.

**EV adoption.** About 3% of households own an EV today. In five years, 10% of households will own one. Assume one EV per owning household.

**Home charging.** 70% of EV-owning households can charge at home, for example in a garage or on a driveway. The other 30% cannot, mostly because they live in apartments without their own parking space, so they rely on public chargers for all their charging. Assume these shares stay the same over the five years.

**EV owners who can charge at home.** They use public chargers only now and then, mostly fast chargers on long trips outside the city. Leave them out of the base estimate; you may mention them as a risk.

**Scope.** Count only residents' EVs. Ignore visitors, commuters from outside the city, taxis, ride-hailing cars and delivery fleets.

**Time horizon.** Estimate the need five years from now, then compare it with the 240 charging points the city has today.

**What counts as a charging point.** One charging point charges one vehicle at a time. A site with four plugs that can all be used at once counts as four charging points.

**Charger types.** There are two types. Level 2 chargers are slower and suit stops of a few hours, such as overnight on a residential street or during a working day. DC fast chargers give a top-up in well under an hour. There is a table showing how demand splits between the two types, how many EVs one charger can serve and how many of each the city has today.

**How many EVs one charger can serve.** The figures in the table are the number of EVs whose charging one charger can meet in full, and they already allow for busy times so that drivers rarely wait. A DC fast charger is much quicker, but it serves only about four times as many EVs as a Level 2 charger, because drivers use fast chargers mostly at peak times and will not queue for long.

**City goal.** The mayor wants enough public chargers that an EV owner without home charging rarely has to wait.

**Cost and budget.** Not part of this question. The city will cost the plan once it knows how many charging points it needs.

**Charger downtime.** Ignore downtime and maintenance in the base estimate. You may mention it as a risk.

## 3. What a good structure includes

Key buckets:
- Demand: from households to EV owners in five years
- Who relies on public charging (owners who cannot charge at home)
- How that demand splits between Level 2 and DC fast chargers
- Supply: how many EVs one charger of each type can serve
- The gap: the need in five years against the 240 charging points today
- Sense-check of the final number

Good signs:
- States each assumption clearly and checks it with the interviewer
- Splits the problem into demand (who needs public charging) and supply (what each charger can serve)
- Treats Level 2 and DC fast separately because they serve different needs at different speeds
- Rounds numbers to keep the maths simple
- Sense-checks the answer, for example chargers per 1,000 residents, or by applying the same method to today's 3% adoption and comparing the result with the 240 charging points the city already has

Red flags:
- Starts calculating without a structure
- Mixes up people and households
- Treats every EV owner as a public-charging user, forgetting that most charge at home
- Gives the total need but never compares it with the charging points the city already has
- Gives a number without any sense-check

## 4. Exhibits (shown when the candidate asks for the right data)

### Public charging by charger type (case assumptions)

Shown when the candidate: Ask how public charging demand splits between Level 2 and DC fast chargers, how many EVs one charger can serve, or how many chargers of each type the city has today.

| Charger type | Share of public charging demand (%) | EVs one charger can fully serve | Public charging points today |
| --- | --- | --- | --- |
| Level 2 (slow) | 60 | 10 | 200 |
| DC fast | 40 | 40 | 40 |

What the data says: Level 2 chargers make up most of the need (720 of 840) and most of the build (520 of the 600 to add), even though DC fast chargers carry 40% of demand, because each fast charger serves four times as many EVs. The city needs 3.5 times today's network.

## 5. The maths, with working

**Question 1.** How many EVs will the city's residents own in five years?

Inputs: households = 400000, ev_share_pct = 10
Expected answer: 40000 (accepted within 2%)
Working: 10% of 400,000 households is 40,000 EVs (one per owning household).

**Question 2.** How many of those EVs will rely on public charging?

Inputs: evs = 40000, no_home_charging_pct = 30
Expected answer: 12000 (accepted within 2%)
Working: 30% of the 40,000 EVs cannot charge at home: 12,000 EVs.

**Question 3.** How many Level 2 charging points will the city need in five years?

Inputs: public_evs = 12000, l2_share_pct = 60, evs_per_l2 = 10
Expected answer: 720 (accepted within 3%)
Working: 60% of the demand from 12,000 EVs is the charging needs of 7,200 EVs. One Level 2 charger fully serves 10 EVs, so 7,200 / 10 = 720 chargers.

**Question 4.** How many DC fast charging points will the city need in five years?

Inputs: public_evs = 12000, dc_share_pct = 40, evs_per_dc = 40
Expected answer: 120 (accepted within 3%)
Working: 40% of the demand from 12,000 EVs is the charging needs of 4,800 EVs. One DC fast charger fully serves 40 EVs, so 4,800 / 40 = 120 chargers.

**Question 5.** How many public charging points will the city need in total in five years?

Inputs: l2 = 720, dc = 120
Expected answer: 840 (accepted within 3%)
Working: 720 Level 2 plus 120 DC fast is 840 charging points: about 0.84 per 1,000 residents, or one for every 14 EVs that rely on public charging.

**Question 6.** How many more public charging points must the city add over the five years?

Inputs: l2 = 720, dc = 120, l2_today = 200, dc_today = 40
Expected answer: 600 (accepted within 3%)
Working: The city needs 840 and has 240 today (200 Level 2 and 40 DC fast), so it must add about 600: 520 Level 2 and 80 DC fast, or roughly 120 a year.

## 6. Brainstorm

What could make the real number of chargers needed higher or lower than your estimate, and what would you do about it?

Ideas a strong candidate might raise:
- Faster EV adoption than 10%, for example from incentives or falling car prices
- Later EV buyers being more likely to live in apartments, so more than 30% cannot charge at home
- More residents able to charge at home after apartment parking is fitted with chargers, which lowers demand
- Residents who charge at home still using public fast chargers now and then
- Visitors, commuters and tourists adding demand
- Taxi, ride-hailing and delivery fleets using public chargers heavily
- Workplace charging reducing the need for public chargers
- Longer vehicle range, which means less frequent charging
- Charger downtime and maintenance raising the number needed
- Location: chargers far from apartment-heavy neighbourhoods sit idle while others have queues
- Grid capacity limits in some neighbourhoods, especially for DC fast chargers
- Pricing and time-of-day rules spreading charging across the day, so each charger serves more EVs

## 7. What a good recommendation includes

Must mention:
- A final estimate of about 840 public charging points in five years, roughly 720 Level 2 and 120 DC fast
- The gap: about 600 more than the 240 today, most of them Level 2
- The key assumptions (10% adoption and 30% without home charging) and a sensitivity, such as what happens at 15% adoption

Good signs:
- Gives a range as well as a point estimate
- Identifies which assumption matters most (adoption and the share without home charging)
- Says where the new Level 2 chargers should go: close to homes without off-street parking
- Recommends phasing the build, about 120 a year, and resizing it each year
- Suggests how to validate the estimate, for example usage data from today's chargers, utility records or comparable cities

## 8. Model answer outline

1. Clarify: residents' EVs only, five years out; a charging point charges one vehicle at a time; the city has 240 today.
2. Structure: demand (EVs that rely on public charging) divided by supply (EVs one charger can serve), split by charger type, then compared with today's network.
3. Demand: 1,000,000 residents in 400,000 households; 10% own an EV in five years, so 40,000 EVs. 30% cannot charge at home, so 12,000 EVs rely on public chargers.
4. By type: 60% of demand is Level 2 (the needs of 7,200 EVs, at 10 per charger, is 720 chargers); 40% is DC fast (4,800 EVs at 40 per charger is 120 chargers). Total about 840.
5. Sense-check: about 0.84 per 1,000 residents, or one charger for every 14 EVs that depend on them. The same method at today's 3% adoption gives about 250 chargers, close to the 240 the city has, so the capacity figures look sensible.
6. Gap: the city must add about 600 charging points, 520 Level 2 and 80 DC fast, roughly 120 a year. Most should be Level 2 chargers near apartments without off-street parking.
7. Sensitivities: 15% adoption would mean about 1,260 in total; if 40% could not charge at home, about 1,120. Fleets and visitors would add more. Recommend phasing the build at about 120 a year and resizing it each year with usage data.

---

## Your review (please fill in)

1. Realistic? 
2. Clear? 
3. Fair? 
4. The answer: 
5. Difficulty and time: 
6. Verdict (Sign off as it is / Sign off after these small changes / Needs rework): 
