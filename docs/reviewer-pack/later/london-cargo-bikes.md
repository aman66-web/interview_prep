# Sizing London's market for electric cargo bikes

Case type: market_sizing · Industry: Transport · Difficulty 2 of 3 · About 30 minutes · Style: interviewer_led

Status: draft (draft until you sign it off). Page on the preview site: /cases/london-cargo-bikes

## 1. What the candidate is told

Tandrel, a European maker of electric cargo bikes, is thinking about opening a sales and service centre in London aimed at delivery businesses. Before it decides, it wants to know how big the opportunity is. Estimate the yearly market, in pounds, for new electric cargo bikes bought by delivery businesses in London, and tell the client whether it is big enough.

## 2. Facts the interviewer gives only when asked

**Client and objective.** Tandrel makes electric cargo bikes and sells them in several European cities. It would open a London sales and service centre only if it could expect at least £2 million of bike sales a year there, the level at which its centres in other cities cover their running costs.

**What counts as the market.** New electric cargo bikes bought each year by businesses that deliver goods in Greater London, valued at the price paid. Count a leased bike once, at its purchase price. Leave out servicing, spare batteries, insurance and riders' pay.

**Who uses cargo bikes.** Three groups: parcel carriers, grocery and meal-kit delivery firms, and local businesses that deliver their own goods, such as pharmacies, florists and print shops. A table of deliveries by segment is available.

**Takeaway riders.** Leave them out. Takeaway riders mostly use their own bikes, e-bikes or mopeds, not cargo bikes, and the delivery businesses do not buy them.

**Time frame.** Estimate next year's market, starting from the bikes working in London today.

**Spare bikes and days off.** Ignore spares. Assume every bike in the fleet works every delivery day, and that the table shows a typical delivery day.

**How long a bike lasts.** Assume a cargo bike in daily delivery use lasts about 4 years before it is replaced.

**Age of today's fleet.** For simplicity, assume the bikes' ages are spread evenly, so about one in four wears out each year.

**Growth of the fleet.** Assume the number of electric cargo bikes working for London delivery businesses grows by 25% next year, as more businesses swap vans for bikes in central areas.

**Price.** Assume an average price of £6,000 per bike, including the cargo box and battery, after fleet discounts.

**Tandrel's likely share.** Once its centre is running, Tandrel expects to win about 20% of the market, similar to its share in other cities where it has a service centre. In those cities it reached that share in the centre's second year.

**Competitors.** Assume a handful of other makers sell cargo bikes in London, mostly through general bike shops, and that none runs a sales and service centre just for delivery businesses.

**Second-hand bikes.** Ignore them. Delivery businesses almost always buy new bikes so that they get the warranty and servicing.

## 3. What a good structure includes

Key buckets:
- Define the market: new bikes bought per year, in pounds, by delivery businesses in London
- Segment the users: parcel carriers, grocery and meal kits, local businesses
- Working fleet per segment: deliveries made by bike divided by deliveries per bike per day
- Yearly purchases: replacing worn-out bikes plus growth of the fleet
- Value and the client's question: bikes times price, then Tandrel's share against its £2 million bar

Good signs:
- Separates the number of bikes in use (the fleet) from the number bought each year
- Segments by type of delivery business rather than starting from London's population
- States each assumption clearly and rounds to keep the maths simple
- Asks what bar the client uses to decide, before sizing anything
- Sense-checks the result and names the assumption that matters most

Red flags:
- Treats the whole fleet as if it were bought every year
- Counts takeaway riders' own bikes or e-bikes
- Gives a market size without answering whether it is big enough for the client

## 4. Exhibits (shown when the candidate asks for the right data)

### Deliveries in London per day, by segment (case assumptions)

Shown when the candidate: Ask how many deliveries each segment makes, how many are made by cargo bike, and how many deliveries one bike makes in a day.

| Segment | Deliveries per day | Share made by e-cargo bike (%) | Deliveries per bike per day |
| --- | --- | --- | --- |
| Parcel carriers | 1500000 | 6 | 60 |
| Grocery and meal kits | 300000 | 10 | 20 |
| Local businesses | 200000 | 10 | 10 |

What the data says: The working fleet is about 5,000 bikes: 1,500 for parcels, 1,500 for groceries and meal kits, and 2,000 for local businesses. Parcel carriers make 75% of deliveries but need only 30% of the bikes, because only 6% of parcels go by bike and one parcel bike makes 60 drops a day; local businesses make 10% of deliveries but need 40% of the bikes. Local businesses and grocery firms together run 70% of the bikes.

## 5. The maths, with working

**Question 1.** How many electric cargo bikes are working for delivery businesses in London today?

Inputs: parcel_deliveries = 1500000, parcel_bike_pct = 6, parcel_per_bike = 60, grocery_deliveries = 300000, grocery_bike_pct = 10, grocery_per_bike = 20, local_deliveries = 200000, local_bike_pct = 10, local_per_bike = 10
Expected answer: 5000 (accepted within 5%)
Working: Parcels: 1,500,000 x 6% = 90,000 bike deliveries a day, / 60 per bike = 1,500 bikes. Groceries and meal kits: 300,000 x 10% = 30,000, / 20 = 1,500 bikes. Local businesses: 200,000 x 10% = 20,000, / 10 = 2,000 bikes. Total 5,000 bikes.

**Question 2.** How many new electric cargo bikes will London delivery businesses buy next year?

Inputs: fleet = 5000, life_years = 4, growth_pct = 25
Expected answer: 2500 (accepted within 5%)
Working: Replacements: 5,000 bikes / 4-year life = 1,250 a year. Growth: 25% of 5,000 = 1,250 extra bikes. Total 2,500 new bikes, half of them from growth.

**Question 3.** What is the market worth next year, in £ million?

Inputs: bikes = 2500, price = 6000
Expected answer: 15 (accepted within 10%)
Working: 2,500 bikes x £6,000 = £15,000,000, which is £15 million a year.

**Question 4.** If Tandrel wins 20% of the market, how much would it sell in London a year, in £ million?

Inputs: market_m = 15, share_pct = 20
Expected answer: 3 (accepted within 10%)
Working: 20% of £15 million is £3 million a year, 50% above Tandrel's £2 million bar. Put the other way, Tandrel needs about 13% of a £15 million market (2 / 15) to reach its bar.

**Question 5.** Keeping the 20% share and the £6,000 price, what is the lowest fleet growth next year, as a percentage, at which Tandrel would still reach its £2 million bar?

Inputs: bar_m = 2, share_pct = 20, price = 6000, fleet = 5000, life_years = 4
Expected answer: 8.3333 (accepted within 6%)
Working: To sell £2 million at a 20% share, the market must be £10 million (2 / 20%). At £6,000 a bike that is about 1,667 bikes. Replacements give 1,250, so growth must add about 417 bikes, about 8% of the 5,000 fleet. The case assumes 25%, so growth could fall by about two-thirds before Tandrel misses its bar.

## 6. Brainstorm

What could make this market, or Tandrel's share of it, bigger or smaller than your estimate over the next few years?

Ideas a strong candidate might raise:
- Tighter low-emission or congestion charges that push more businesses out of vans and onto bikes
- More micro-hubs (small depots in central areas) that make short bike rounds possible
- Cargo-bike parking and loading bays on busy streets, or a lack of them
- Electric vans getting cheaper, which removes the emissions reason to switch to bikes
- Longer-lasting bikes and batteries, which lower the number of replacements
- Theft and insurance costs putting smaller businesses off
- Leasing and rental schemes making bikes affordable for small local businesses
- A shortage of riders, or rising riders' pay
- Growth slowing once the easy central routes have switched, which would cut the growth half of yearly purchases
- Large parcel carriers buying through Europe-wide fleet deals rather than from a London centre, which would cut Tandrel's share of that segment
- Small local businesses, which have no workshop of their own, valuing a nearby service centre most, which would help Tandrel's share
- Other makers opening their own centres for delivery businesses once Tandrel shows there is demand

## 7. What a good recommendation includes

Must mention:
- A market of about £15 million a year: about 2,500 new bikes at £6,000, from a working fleet of about 5,000
- At a 20% share Tandrel would sell about £3 million a year, above its £2 million bar
- Half of next year's purchases come from fleet growth, so the answer depends most on growth continuing

Good signs:
- Gives a range, for example £12 million to £18 million
- Shows how much room there is: fleet growth could fall from 25% to about 8% before Tandrel misses its bar, and with no growth at all the market is about £7.5 million and Tandrel's sales about £1.5 million
- Notes that Tandrel needs about 13% of the market to reach £2 million, and that its share takes about two years to build, so the first year will be lower
- Says which customers to target first: local businesses and grocery firms run 70% of the bikes and are the most likely to value a nearby service centre
- Notes that a fast-growing fleet is young, so fewer bikes may need replacing next year than fleet divided by life suggests
- Suggests how to check the numbers, such as asking large parcel carriers about their bike plans

## 8. Model answer outline

1. Clarify: next year's spending on new electric cargo bikes by London delivery businesses, valued at the price paid, with leased bikes counted once and takeaway riders' own bikes left out. Tandrel needs £2 million of yearly sales for a centre to cover its costs.
2. Structure: working fleet by segment, then yearly purchases (replacements plus growth), then value, then Tandrel's share against its bar.
3. Fleet: parcels 1,500,000 deliveries a day x 6% by bike / 60 per bike = 1,500; groceries and meal kits 300,000 x 10% / 20 = 1,500; local businesses 200,000 x 10% / 10 = 2,000. About 5,000 bikes in total, 70% of them with grocery firms and local businesses.
4. Purchases: 5,000 / 4-year life = 1,250 replacements, plus 25% growth = 1,250 extra bikes. About 2,500 bikes a year.
5. Value: 2,500 x £6,000 = about £15 million a year. At a 20% share Tandrel would sell about £3 million, 50% above its bar.
6. Sense-check and risk: half the purchases come from growth. Growth could fall from 25% to about 8% before a 20% share drops below £2 million; with no growth at all the market halves to £7.5 million and Tandrel would sell about £1.5 million. Tandrel needs about 13% of the market, and its share takes about two years to build.
7. Recommendation: yes, the market is big enough, so open the centre, but start lean (for example a service point shared with a partner). Lead with local businesses and grocery firms, which run most of the bikes and most need nearby servicing, and expand once the large parcel carriers confirm their fleet plans.

---

## Your review (please fill in)

1. Realistic? 
2. Clear? 
3. Fair? 
4. The answer: 
5. Difficulty and time: 
6. Verdict (Sign off as it is / Sign off after these small changes / Needs rework): 
