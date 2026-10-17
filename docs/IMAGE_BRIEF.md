# Image brief for Midjourney (16 Oct 2026)

66 images for the CaseSpar website, made in Midjourney by Claude in Chrome with the founder. Claude Code (the cloud session) then converts them to small web files, writes the descriptions for screen readers, and places them on the pages.

## Rules (all of them, every image)

1. **No text anywhere in the picture.** No letters, numbers, words, signs, labels, screens with readable writing or numbers on charts. Midjourney writes nonsense text, and on a maths product a wrong-looking number looks careless.
2. **No logos or brands.** No firm names, no consulting firm offices you could recognise, no university crests or famous university buildings, no shop names, no car or bike brands.
3. **No faces that could pass for our students or customers** (rule 2.4: no fake proof). People appear only as hands, from behind, or blurred in the distance.
4. **No famous landmarks** (Big Ben, the Shard, the Empire State Building and so on). "An unnamed city" only.
5. **Midjourney licence:** the account must be on a paid plan for the images to be used commercially. If MARTZEY LTD earns more than US$1 million a year, Midjourney's terms need the Pro or Mega plan (founder to check). Don't buy or upgrade anything without the founder's yes.

## Settings

- Use Midjourney's current default model. Don't add `--v`.
- Add `--style raw` to every prompt (less "arty", more like a real photograph).
- Add `--no text, letters, numbers, words, logo, watermark, signature` to every prompt.
- Add the image's aspect ratio from the table, for example `--ar 3:2`.

### The two house styles

Put the style's words after the subject.

- **LIGHT** (most images): `editorial still-life photograph, soft natural window light, calm warm off-white background, a few lime-green and deep indigo accents, clean minimal composition with generous empty space, shallow depth of field, premium magazine look, realistic`
- **NIGHT** (dark panels): `moody editorial photograph at night, deep navy and indigo tones with a soft violet glow and one small lime-green highlight, calm minimal composition with generous empty space, realistic`

So a full prompt looks like:
`a premium bakery café counter in the morning, croissants and sourdough loaves on wooden shelves, espresso machine, no people, no signage, editorial still-life photograph, soft natural window light, ... realistic --ar 3:2 --style raw --no text, letters, numbers, words, logo, watermark, signature`

### Keep the set looking like one family

1. Make **H1** first (LIGHT). Pick the best of the four and upscale it. Copy that image's link and use it as a style reference on every other LIGHT image: add `--sref <that link> --sw 50`.
2. Make **P11** first among the NIGHT images and do the same for the other NIGHT images.

### Choosing the best of the four

Pick the one that has:
- no text or logos anywhere, including on packaging and screens;
- nothing warped, such as hands, fingers, chair legs or bike wheels;
- the house colours (off-white with lime and indigo, or navy at night);
- calm empty space on one side, where text can sit on the page.

If none of the four passes, press **Vary (Strong)** or run the prompt again, at most 3 times. If it still fails, keep the best one and say so in the report.

Then **Upscale (Subtle)** and download the upscaled PNG.

## The images

Every file name ends in `.png`. Ratios are Midjourney `--ar` values.

### Home page (7)

| # | File name | Where it goes | Ratio | Style | Subject |
|---|---|---|---|---|---|
| H1 | home-practice-desk | "How it works" section | 3:2 | LIGHT | a candidate's desk set up for case interview practice: an open squared notebook with hand-drawn boxes and arrows that cannot be read, a pen, a closed laptop, a glass of water, morning light |
| H2 | home-interviewer | "Why it works": the interviewer | 4:3 | LIGHT | two chairs facing each other across a small round table in a bright, quiet meeting room, one notebook on the table, empty room |
| H3 | home-exhibits | "Why it works": exhibits | 4:3 | LIGHT | printed bar charts and line charts with abstract shapes only, lime and indigo bars, spread on a desk, a hand holding a pen points at one chart |
| H4 | home-maths | "Why it works": maths checked | 4:3 | LIGHT | a pencil and scrap paper covered in handwritten long multiplication that cannot be read, an eraser, a coffee cup, no calculator |
| H5 | home-debrief | The debrief section | 4:3 | LIGHT | five small wooden blocks of different heights standing in a row like a bar chart, some painted lime and some indigo, on a light table |
| H6 | home-drills | The drills section | 4:3 | LIGHT | blank flash cards fanned out on a desk next to a small stopwatch |
| H7 | home-cta | The last "start free" band | 21:9 | NIGHT | an empty office floor at dusk with one warm desk lamp on, floor-to-ceiling windows, the lights of an unnamed city blurred outside |

### Cases (20): one per case, shown on the case cards and at the top of each case page

All 3:2, LIGHT. Natural scenes are fine, but keep the house colours where they fit.

| # | File name | Case | Subject |
|---|---|---|---|
| C1 | case-harbourline-bakeries | Bakery chain profit | a premium bakery café counter in the morning, croissants and sourdough loaves on wooden shelves, an espresso machine, no people, no signage |
| C2 | case-aurora-kitchen-uk-entry | Frozen meals entering the UK | neat rows of premium frozen ready meals in plain unbranded packaging behind a frosted supermarket freezer door |
| C3 | case-city-ev-chargers | Sizing EV chargers | a row of public electric car charging points on a city street at dusk, charging cables, wet pavement reflections, no brand names |
| C4 | case-flexora-gym-software-pricing | Gym software pricing | a modern boutique gym front desk with a tablet on a stand, the screen showing soft abstract coloured blocks, kettlebells in the background, no people |
| C5 | case-lumen-tutoring-growth | Online tutoring growth | an online tutoring setup on a kitchen table in the evening: laptop, headphones, a notebook with geometry sketches, warm lamp, no faces |
| C6 | case-corvane-vets-acquisition | Vet clinic acquisition | a calm modern veterinary clinic reception, a dog lead hanging on a hook, two pet carriers on a bench, no people |
| C7 | case-ostrander-pumps-sensor-deal | Pump maker buying a sensor startup | a large industrial water pump in a clean plant room with a small wireless sensor attached to it, cool indigo light |
| C8 | case-cobbleway-parcel-hub | Parcel hub operations | a parcel sorting hub at night, conveyor belts carrying plain cardboard parcels, gentle motion blur, no logos |
| C9 | case-wrenfield-hotels-profit | Hotel profit | a neatly made hotel bed with folded white towels, warm morning light through sheer curtains |
| C10 | case-stowline-backup-pricing | Backup software pricing | a server rack in a quiet data centre, soft indigo light, one small lime status light, shallow depth of field |
| C11 | case-pellbrook-clinics-waiting-times | Clinic waiting times | an empty clinic waiting room with rows of chairs, a blank display screen on the wall, soft daylight |
| C12 | case-brinmoor-bike-share-repairs | Bike share repairs | a city bike-share docking station in early morning with several unbranded bikes, one with a flat tyre, a mechanic's toolbox nearby |
| C13 | case-bramblecup-uk-supermarket-deal | Plant-based yoghurt deal | plant-based yoghurt pots in plain unbranded packaging on a supermarket chilled shelf, a few oat stalks in front |
| C14 | case-hollinsway-pet-insurance | Pet insurance | a cat curled up asleep on a sofa next to a folded blanket and a set of house keys, cosy living room |
| C15 | case-orvessa-subscriber-growth | Language app subscribers | a phone on a café table showing an abstract learning app screen made of colourful blocks, headphones and a small notebook beside it |
| C16 | case-london-cargo-bikes | Sizing London's cargo bikes | an electric cargo bike with a wooden cargo box of parcels parked on a terraced residential street, overcast light, no landmarks |
| C17 | case-us-dog-walking-market | Sizing US dog walking | a dog walker seen from behind holding four leads, the dogs trotting ahead on a leafy suburban sidewalk in autumn |
| C18 | case-cragwell-climbing-growth | Climbing gym growth | an indoor bouldering wall with colourful holds, chalk dust in the air, crash mats, no people |
| C19 | case-larkmoor-meal-kit-acquisition | Supermarket buying a meal-kit firm | an opened meal-kit box on a kitchen counter with fresh vegetables, small spice pots and a blank recipe card |
| C20 | case-cobalt-basin-ski-resort | Ski resort profit | a ski resort chairlift over deep fresh snow under a clear blue sky, empty chairs, pine trees |

### Guides (10): the banner at the top of each guide

All 16:9, LIGHT.

| # | File name | Guide | Subject |
|---|---|---|---|
| G1 | guide-profitability | Profitability cases | an old brass balance scale on a desk, a few coins on one side and a small stack of plain receipts on the other |
| G2 | guide-market-entry | Market entry cases | an open door leading from a dim corridor into a bright, sunlit room |
| G3 | guide-market-sizing | Market sizing cases | a large glass jar full of coloured beads, with a tape measure lying beside it |
| G4 | guide-mergers-and-acquisitions | M&A cases | two large jigsaw puzzle pieces, one lime and one indigo, about to fit together on a light table |
| G5 | guide-pricing | Pricing cases | blank paper price tags of different sizes on strings, arranged on a light surface |
| G6 | guide-growth | Growth cases | a row of potted seedlings growing from small to tall, left to right |
| G7 | guide-operations | Operations cases | an orderly production line of identical small wooden parts on a conveyor belt |
| G8 | guide-structuring | How to structure a case | an issue tree made of string and coloured pins on a corkboard, branching from one pin into several, lime and indigo pins |
| G9 | guide-case-maths | Case maths | a mechanical pencil and an eraser on squared paper full of handwritten workings that cannot be read |
| G10 | guide-practising-alone | How to practise alone | a quiet library desk by a window at dusk, a single lamp, an open notebook and a stopwatch |

### Drills (4) and free tools (4): the cards on those pages

All 4:3, LIGHT.

| # | File name | Where | Subject |
|---|---|---|---|
| D1 | drill-mental-maths | Mental maths drills | a stopwatch lying on a notepad covered in quick handwritten sums that cannot be read |
| D2 | drill-market-sizing | Market sizing drills | a top-down aerial view of the rooftops of a dense, unnamed city in early morning light |
| D3 | drill-frameworks | Framework drills | blank sticky notes in pastel colours arranged in neat columns on a white wall |
| D4 | drill-chart-reading | Chart reading drills | printed charts with abstract bars and lines on a desk, a magnifying glass resting over one of them |
| T1 | tool-market-sizing | Market sizing calculator | a tape measure wrapped around a small plain globe |
| T2 | tool-break-even | Break-even calculator | a simple wooden seesaw balance with two equal weights, perfectly level |
| T3 | tool-mental-maths-trainer | Mental maths trainer | an hourglass next to a small notepad and a pencil |
| T4 | tool-growth-rate | Growth rate calculator | stacks of coins rising in height from left to right |

### Page banners (14)

| # | File name | Page | Ratio | Style | Subject |
|---|---|---|---|---|---|
| P1 | page-cases | /cases (the case library) | 16:9 | LIGHT | a neat stack of closed case-file folders in lime, indigo, peach and mint covers, no writing |
| P2 | page-drills | /drills | 16:9 | LIGHT | running track lanes seen from directly above in morning light |
| P3 | page-guides | /guides | 16:9 | LIGHT | an open notebook with a ribbon bookmark and a pen, flat lay, lots of empty space |
| P4 | page-tools | /tools | 16:9 | LIGHT | a tidy flat lay of a ruler, a pencil, a protractor and blank sticky notes |
| P5 | page-pricing | /pricing | 16:9 | LIGHT | two blank paper tickets side by side on a light surface, one lime and one indigo |
| P6 | page-about | /about | 16:9 | LIGHT | a small studio workspace at dusk with a laptop, a plant and a notebook, warm lamp, no people |
| P7 | page-faq | /faq | 16:9 | LIGHT | folded paper speech bubbles in pastel colours on a light background |
| P8 | page-universities | /for-universities | 16:9 | LIGHT | a seminar room with rows of empty chairs facing a whiteboard of abstract boxes and arrows, afternoon light |
| P9 | page-glossary | /glossary | 16:9 | LIGHT | rows of blank index cards in a wooden card-catalogue drawer |
| P10 | page-firm-guides | /guides/firms | 16:9 | LIGHT | an empty modern glass office lobby at dawn, no signage and no logos |
| P11 | page-login | The side panel of the sign-in page | 4:5 | NIGHT | a desk lamp lighting an open notebook on a dark desk at night, city lights blurred through the window |
| P12 | page-dashboard | The welcome band on a signed-in person's dashboard | 21:9 | LIGHT | soft abstract light streaks of lime and indigo across a calm off-white wall, like morning sun through blinds |
| P13 | page-not-found | The "page not found" page | 1:1 | LIGHT | a single empty chair in a bright empty room with a door left slightly open |
| P14 | page-debrief | The top of the scored debrief page | 21:9 | NIGHT | a single spotlight on an empty stage floor, deep navy, a faint lime rim of light |

### Universities page (3) and social posts (4)

| # | File name | Where | Ratio | Style | Subject |
|---|---|---|---|---|---|
| U1 | uni-workshop | /for-universities | 3:2 | LIGHT | a student society workshop seen from the back row: the backs of heads blurred, a whiteboard of abstract diagrams at the front, afternoon light |
| U2 | uni-careers-fair | /for-universities | 3:2 | LIGHT | a careers fair table with neat stacks of blank leaflets and a small potted plant, no logos, no people |
| U3 | uni-practice-pairs | /for-universities | 3:2 | LIGHT | two notebooks and two coffee cups on a library table as if two people are practising together, the chairs empty |
| S1 | social-launch | LinkedIn launch post | 191:100 | LIGHT | the same desk scene as H1 seen from slightly higher, with more empty space on the left |
| S2 | social-maths | Square post about case maths | 1:1 | LIGHT | a pencil balanced across a piece of squared paper, minimal |
| S3 | social-debrief | Square post about the debrief | 1:1 | LIGHT | five wooden blocks of different heights, as in H5, seen from the front |
| S4 | social-universities | LinkedIn post for societies | 191:100 | LIGHT | a bright, empty seminar room with chairs set out in pairs facing each other |

## Saving and sending the images

1. Save every upscaled PNG into one folder on the founder's Mac: `~/Downloads/mock-partner-images/`. Use the file name from the table, for example `case-harbourline-bakeries.png`. Claude Code in the terminal can rename the downloaded files with `mv`. Never change any other file.
2. Send them to GitHub on a branch of their own, called `images-raw` (Vercel is set not to build this branch):
   - In the terminal: `git clone --depth 1 --branch claude/gifted-shannon-r42f73 https://github.com/aman66-web/interview_prep.git ~/mock-partner-upload`, then `cd ~/mock-partner-upload`, `git checkout -b images-raw`, `mkdir incoming`, copy the PNGs into `incoming/`, `git add incoming`, `git commit -m "Raw Midjourney images for the website"` and `git push -u origin images-raw`.
   - Push to `images-raw` only. Never push to `claude/gifted-shannon-r42f73` or `main`.
   - If git asks for a GitHub login, stop and let the founder sign in (for example with `gh auth login --web`).
   - If git can't reach GitHub at all, open https://github.com/aman66-web/interview_prep, create the branch `images-raw` from `claude/gifted-shannon-r42f73` in the branch menu, open "Add file", then "Upload files", and ask the founder to drag the PNGs in from Finder, at most 10 per commit.
3. Report: how many images were made, any that needed more than 3 tries or still have a flaw, and that the branch is pushed. Then the founder tells Claude Code (cloud): "The images are on the images-raw branch."
