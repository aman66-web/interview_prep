# Brinmoor Bike Share: why are so many bikes out of service?

Case type: operations · Industry: Transport · Difficulty 3 of 3 · About 35 minutes · Style: candidate_led

Status: draft (draft until you sign it off). Page on the preview site: /cases/brinmoor-bike-share-repairs

## 1. What the candidate is told

Brinmoor Bike Share runs 4,000 public bikes from 300 docking stations in a mid-sized US city, under a contract with the city government. On an average day, a quarter of its bikes are out of service, and riders complain about empty docks and broken bikes. The contract requires at least 90% of the fleet to be available, and the city has started charging penalties. The general manager has asked you to find out what is going wrong and how to fix it. How would you approach this?

## 2. Facts the interviewer gives only when asked

**The scheme.** Brinmoor has 4,000 bikes, 3,000 pedal bikes and 1,000 e-bikes, at 300 docking stations. Riders pay per ride or buy a membership. Brinmoor runs the scheme for the city under a 10-year contract.

**Objective and penalties.** Get availability to at least 90% within 6 months, at the lowest sensible cost. The contract measures availability as the share of the whole fleet in service on an average day; for today's 4,000 bikes that means at least 3,600. The city charges a $50,000 penalty for every month in which average availability is below 90%.

**What changed.** A year ago about 10% of the fleet was out of service. Since then Brinmoor added 1,000 e-bikes in batches (the fleet grew from 3,000 to 4,000 bikes), and breakdowns rose from about 50 to about 100 bikes a day. The number of bikes out of service has risen every month, fastest in the last two months.

**Which bikes break.** About 60 of the 100 daily breakdowns are pedal bikes and 40 are e-bikes, so an e-bike breaks down about twice as often as a pedal bike. E-bikes are heavier and ridden more, so they wear tyres and brakes faster, and their batteries and motors also fail. Mechanics used to spend a day a month on routine checks at stations, but stopped six months ago when the workshop got busy.

**How a broken bike gets fixed.** A rider or the dock's sensor reports a fault, and the bike is locked so no one can ride it. A truck collects it and takes it to Brinmoor's single central workshop, where mechanics repair bikes in the order they arrive. Repaired bikes then wait for a truck to take them back to a station.

**The workshop.** On an average day 8 mechanics are on shift; the team has not grown in two years. Each does about 400 minutes of hands-on repair work a day; the rest of the shift goes on breaks, paperwork and moving bikes around. The building has room for about 4 more mechanics. A mechanic costs about $60,000 a year, and mechanics can work paid overtime.

**Trucks.** Two trucks collect broken bikes and return repaired ones, on fixed daily routes. A third truck with a driver would cost about $90,000 a year and would roughly halve the time broken bikes wait to be collected. These trucks are separate from the ones that move bikes between busy and quiet stations.

**Repairs at the station.** Some faults, such as flat tyres, loose chains and broken seats, can be fixed at the dock with hand tools. Brinmoor does not do this today. A mobile crew (one mechanic and a van) could fix about 25 such bikes a day at stations, including driving time, and costs about $100,000 a year. Crews could be working within about a month.

**Parts.** Most parts are in stock. E-bike batteries and motors are ordered only when a repair needs one and take about a week to arrive, which is why major repairs spend so long on the bench. Keeping a small stock of batteries and motors would cost about $40,000 once and would cut a major repair's time on the bench to about 2 days.

**Buying more bikes.** A new bike costs about $2,000 on average. Stations have spare docks for about 1,000 more bikes.

**Vandalism and theft.** Vandalism and theft cause under 5% of breakdowns and have not changed. Not important for this case.

## 3. What a good structure includes

Key buckets:
- Inflow: how many bikes break each day, which bikes and what kinds of faults, and why breakdowns rose
- The repair pipeline: pickup, workshop queue, time on the bench (including waits for parts) and return, and the days spent in each
- Capacity at the bottleneck: mechanic time needed versus mechanic time available
- Options and their cost: more mechanics, repairs at the station, parts in stock, faster pickup and return, prevention, more bikes
- The 90% target, the penalties, the timeline and how much buffer a plan leaves

Good signs:
- Links bikes out of service to breakdowns per day times days out of service, even informally
- Follows a broken bike through each stage to find where the time goes
- Measures the workshop's load in mechanic-minutes, not just in bikes
- Sees that a quick fix still spends about 4 days in pickup, bench and return even with no queue, so a faster workshop alone cannot fix it
- Looks at time on the bench by type of repair, not just the average
- Checks each option against the 90% target with numbers before recommending it

Red flags:
- Goes straight to buying more bikes, without noticing that the target is a share of the fleet
- Treats every repair as the same size of job
- Recommends more mechanics without checking whether that alone reaches 90%
- Treats exactly 90% as safe, with no buffer against a bad month

## 4. Exhibits (shown when the candidate asks for the right data)

### Out-of-service bikes today, by stage

Shown when the candidate: Ask where the out-of-service bikes are, or how long a broken bike takes to get back into service.

| Stage | Bikes | Average days in stage |
| --- | --- | --- |
| Broken at a station, waiting for pickup | 200 | 2 |
| At the workshop, waiting for a mechanic | 500 | 5 |
| On the bench: being repaired or waiting for parts | 200 | 2 |
| Repaired, waiting to go back to a station | 100 | 1 |
| Total out of service | 1000 | 10 |

What the data says: 1,000 bikes (25% of the fleet) are out of service, and a broken bike takes 10 days to come back. Half of that time (5 days, 500 bikes) is spent waiting for a mechanic, so the workshop is the bottleneck. Even with no wait at all, pickup, bench and return still take 5 days.

### Bikes reported broken per day, by repair needed (days on the bench include any wait for parts)

Shown when the candidate: Ask what kinds of repairs broken bikes need, how long each takes, or how much work the workshop has each day.

| Repair needed | Bikes per day | Mechanic minutes per bike | Days on the bench | Can be fixed at the station? |
| --- | --- | --- | --- | --- |
| Quick fix (flat tyre, chain, seat) | 50 | 12 | 1 | Yes |
| Brakes or gears | 30 | 40 | 1 | No |
| Major (wheel, frame, e-bike battery or motor) | 20 | 90 | 6 | No |
| All repairs | 100 | Varies | 2 on average | Half of bikes |

What the data says: The workshop needs 3,600 mechanic-minutes a day (600 + 1,200 + 1,800) but 8 mechanics provide 3,200, so its queue keeps growing. Half of broken bikes need only a 12-minute quick fix that could be done at the station, yet they spend about 9 days out of service, mostly waiting behind bigger repairs. Major repairs spend 6 days on the bench, mostly waiting for e-bike batteries and motors.

## 5. The maths, with working

**Question 1.** About 1,000 bikes are out of service and about 100 break down each day. On average, how many days is a broken bike out of service?

Inputs: out_of_service = 1000, breakdowns_per_day = 100
Expected answer: 10 (accepted within 3%)
Working: About 100 bikes break each day and about 1,000 are out of service at any time, so each one is out for about 1,000 / 100 = 10 days. This matches the stage times: 2 + 5 + 2 + 1 = 10.

**Question 2.** How many more mechanic-minutes a day does the workshop need than it has?

Inputs: quick_bikes = 50, quick_minutes = 12, brake_bikes = 30, brake_minutes = 40, major_bikes = 20, major_minutes = 90, mechanics = 8, minutes_per_mechanic = 400
Expected answer: 400 (accepted within 3%)
Working: Work needed: 50 x 12 = 600, 30 x 40 = 1,200 and 20 x 90 = 1,800, so 3,600 minutes a day. Capacity: 8 x 400 = 3,200 minutes. The shortfall is 400 minutes a day, about one mechanic, so the queue keeps growing.

**Question 3.** Suppose Brinmoor hires enough mechanics that bikes wait only 1 day for a mechanic, and nothing else changes. How many bikes would be out of service on an average day?

Inputs: breakdowns_per_day = 100, pickup_days = 2, queue_days = 1, repair_days = 2, return_days = 1
Expected answer: 600 (accepted within 3%)
Working: Each bike is now out for 2 + 1 + 2 + 1 = 6 days. 100 bikes a day x 6 days = 600 bikes, or 15% of the fleet. Availability rises only to 85%, still short of the 90% target. Even with no wait at all, 2 + 2 + 1 = 5 days leaves 500 bikes out (87.5%).

**Question 4.** Instead, suppose two mobile crews fix every quick-fix bike at its station within 1 day, and the workshop queue falls to 1 day for all other repairs. Pickup, time on the bench and return take as long as today for each kind of repair. How many bikes would be out of service on an average day?

Inputs: quick_per_day = 50, station_days = 1, brake_per_day = 30, major_per_day = 20, pickup_days = 2, queue_days = 1, brake_bench_days = 1, major_bench_days = 6, return_days = 1
Expected answer: 400 (accepted within 3%)
Working: Quick fixes: 50 a day x 1 day = 50 bikes. Brakes and gears: 30 a day x (2 + 1 + 1 + 1) = 30 x 5 = 150 bikes. Major repairs: 20 a day x (2 + 1 + 6 + 1) = 20 x 10 = 200 bikes. Total 400 bikes, exactly 10% of the fleet, so availability is 90%: on the target line with no room for a bad month. Using the 2-day average bench time for every workshop bike gives 350, which is too optimistic, because the quick fixes that leave the workshop were the fastest on the bench. The workshop's load falls to 3,000 minutes a day, below its 3,200, so a 1-day queue is realistic once the backlog is cleared.

**Question 5.** On top of that, Brinmoor keeps e-bike batteries and motors in stock, so a major repair spends 2 days on the bench instead of 6. How many bikes would be out of service on an average day?

Inputs: quick_per_day = 50, station_days = 1, brake_per_day = 30, major_per_day = 20, pickup_days = 2, queue_days = 1, brake_bench_days = 1, major_bench_days_with_stock = 2, return_days = 1
Expected answer: 320 (accepted within 3%)
Working: A major repair now takes 2 + 1 + 2 + 1 = 6 days instead of 10, so 20 x 4 = 80 fewer bikes are out: 400 - 80 = 320 bikes (50 + 150 + 120). That is 8% of the fleet, so availability is 92%, a 2-point buffer, for about $40,000 once.

## 6. Brainstorm

Beyond repairing bikes faster, what else could Brinmoor do to cut breakdowns or get broken bikes back into service sooner?

Ideas a strong candidate might raise:
- Restart regular preventive checks at stations (tyre pressure, brakes, chains) to stop faults before they happen
- Give quick jobs their own fast lane in the workshop so they never wait behind major repairs
- Add a second workshop shift or weekend overtime to clear the current backlog
- Keep spare e-bike batteries and motors in stock, or swap in a working part and repair the old one later
- Ask riders to report the exact fault in the app, with a photo, so the right crew and parts are sent
- Return repaired bikes on the trucks that already move bikes between stations
- Collect broken bikes more often, or have the mobile crews bring back the bikes they cannot fix
- Push the e-bike supplier to repair faults under warranty or to supply sturdier parts
- Give the mobile crews preventive checks to do in their spare time
- Reward riders for reporting faults quickly

## 7. What a good recommendation includes

Must mention:
- 1,000 bikes are out of service because about 100 break each day and each is out for about 10 days, half of it waiting for a mechanic
- The workshop needs 3,600 mechanic-minutes a day but has 3,200, and half the broken bikes need only a quick fix that could be done at the station
- Recommendation: fix quick faults at the station with two mobile crews, clear the workshop queue and keep e-bike parts in stock, which cuts bikes out of service to about 320 (92% available); more mechanics alone reach only 85%, and station repairs with a short queue only just reach 90%

Good signs:
- Rules out buying bikes: the target is a share of the fleet, so 800 more bikes (about $1.6m) would still leave under 80% available even if none of them broke, and they would break too
- Compares the costs: two crews at about $200,000 a year plus about $40,000 once for parts, against about $600,000 a year of penalties
- Plans a one-off push, such as overtime or temporary mechanics, to clear the 500-bike backlog, starting with the quick fixes already in the queue
- Names the plan's risks: two crews exactly match today's 50 quick fixes a day, and 92% leaves a small buffer, so a third truck (about $90,000 a year) or prevention is a sensible back-up
- Names prevention (restarting routine checks, sturdier e-bike parts) as a next step, with availability tracked weekly

## 8. Model answer outline

1. Clarify: 4,000 bikes, 25% out of service (1,000), a target of 90% of the fleet available (3,600 bikes) within 6 months and penalties of $50,000 a month. Breakdowns doubled to about 100 a day after 1,000 e-bikes were added, with no extra mechanics.
2. Structure: bikes out of service = breakdowns per day x days out of service. Look at the inflow (how many break, which bikes and why), follow a bike through pickup, workshop queue, bench and return, then weigh the options against the 90% line and their costs.
3. Analysis: 1,000 / 100 = 10 days out of service, 5 of them waiting for a mechanic. The workshop needs 3,600 mechanic-minutes a day against 3,200 available, so its queue keeps growing.
4. Insight: half of broken bikes need a 12-minute quick fix that could be done at the station, yet each spends about 9 days out of service. Hiring mechanics alone cuts the queue, but the average bike still takes about 6 days, leaving 600 out of service (85% available).
5. Maths: two mobile crews for quick fixes and a 1-day queue for the rest give 50 + 150 + 200 = 400 out of service, exactly 90%, with no margin. Major repairs spend 6 days on the bench waiting for e-bike parts; keeping parts in stock cuts that to 2 days and brings bikes out of service to 320 (92% available).
6. Recommendation: start two mobile repair crews (about $200,000 a year) and stock e-bike batteries and motors (about $40,000 once), against $600,000 a year of penalties; clear the 500-bike backlog with a fast lane for quick fixes and temporary overtime. Do not buy more bikes: the target is a share of the fleet. Risks: the crews only just match today's quick fixes and 92% is a small buffer. Next, restart preventive checks, consider a third truck and track availability weekly.

---

## Your review (please fill in)

1. Realistic? 
2. Clear? 
3. Fair? 
4. The answer: 
5. Difficulty and time: 
6. Verdict (Sign off as it is / Sign off after these small changes / Needs rework): 
