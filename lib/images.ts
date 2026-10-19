// Every photo on the site, in one place (docs/DESIGN.md, "Photos"). Pages and components
// get their photos only through the helpers at the bottom, which return undefined when a
// slot has no photo, so a slot without one keeps its normal design.
//
// The files are in public/images/<group>/ as WebP (made in Midjourney to docs/IMAGE_BRIEF.md,
// then checked by a reviewer for text, logos, faces and warped objects). tests/images.test.ts
// checks that every file here exists, matches its stated size and is under 400 KB, and that
// every file in public/images is listed here.
//
// Honesty (rules 2.3 and 2.4): these are illustrations. Never caption one as our students,
// customers, a real event or a real office, and never add a firm or university logo.
//
// Plain data with no Node imports, so client components (the case browser) can use it.

export type Photo = {
  /** Path under public/, for next/image. */
  src: string;
  /** The file's real size in pixels (tests/images.test.ts reads the WebP header to check). */
  width: number;
  height: number;
  /** What a screen reader hears where the photo carries meaning. Placements inside a link or used as a
   *  backdrop render it as decorative instead (alt="" and aria-hidden). */
  alt: string;
  /** Where to keep the subject when a slot crops the photo (CSS object-position). */
  objectPosition?: string;
  /** Bright LIGHT photos are softened in dark mode so they don't glare: CSS brightness 0.85 or 0.9. */
  darkDim?: 0.85 | 0.9;
  /** True for a photo that is only ever decoration, so an empty alt is allowed. */
  decorative?: true;
};

type Extra = Pick<Photo, "objectPosition" | "darkDim" | "decorative">;

const RATIO = {
  "3:2": [1600, 1067],
  "4:3": [1600, 1205],
  "16:9": [1600, 897],
  "21:9": [2400, 1029],
} as const;

function photo(group: string, file: string, size: readonly [number, number], alt: string, extra: Extra = {}): Photo {
  return { src: `/images/${group}/${file}.webp`, width: size[0], height: size[1], alt, ...extra };
}

/** Home page sections (IMAGE_BRIEF H1-H7; H4, maths, was rejected and keeps its design). */
export const HOME_PHOTOS = {
  "practice-desk": photo(
    "home",
    "home-practice-desk",
    RATIO["3:2"],
    "Sunlit desk with an open squared notebook and black pen, a glass of water, a closed laptop and a vase of green stems.",
    { objectPosition: "50% 65%", darkDim: 0.85 },
  ),
  interviewer: photo(
    "home",
    "home-interviewer",
    RATIO["4:3"],
    "Two olive-green upholstered chairs facing each other across a small round wooden table with a closed notebook and pen, in a sunlit room.",
    { objectPosition: "50% 60%", darkDim: 0.9 },
  ),
  exhibits: photo(
    "home",
    "home-exhibits",
    RATIO["4:3"],
    "A hand holding a silver pen points at printed, unlabelled bar charts in lime green and blue, spread across a sunlit white desk.",
    { objectPosition: "60% 55%", darkDim: 0.85 },
  ),
  debrief: photo(
    "home",
    "home-debrief",
    RATIO["4:3"],
    "Five wooden blocks rising in height like a bar chart: one lime green, two blue, two plain wood, on a sunlit table.",
    { objectPosition: "52% 75%", darkDim: 0.9 },
  ),
  drills: photo(
    "home",
    "home-drills",
    RATIO["4:3"],
    "A stack of blank white cards beside a silver stopwatch on a cream desk, with palm leaves casting shadows on the wall.",
    { objectPosition: "50% 70%", darkDim: 0.9 },
  ),
  cta: photo(
    "home",
    "home-cta",
    RATIO["21:9"],
    "An empty office at night: one lamp lit on a long desk, an office chair, and blurred city lights beyond floor-to-ceiling windows.",
    { objectPosition: "42% 62%" },
  ),
} satisfies Record<string, Photo>;

/** One per case, keyed by the case's slug (C1-C20; Flexora, Lumen and Orvessa were rejected). */
export const CASE_PHOTOS: Record<string, Photo> = {
  "harbourline-bakeries": photo(
    "cases",
    "case-harbourline-bakeries",
    RATIO["3:2"],
    "A sunlit café counter with croissants on a wooden board, two coffee cups, an espresso machine and sourdough loaves on a shelf.",
    { objectPosition: "45% 65%" },
  ),
  "aurora-kitchen-uk-entry": photo(
    "cases",
    "case-aurora-kitchen-uk-entry",
    RATIO["3:2"],
    "Nine clear plastic tubs of food, including peas, rice and vegetables, stacked three high on a shelf beside a glass door frame.",
    { objectPosition: "50% 55%", darkDim: 0.9 },
  ),
  "city-ev-chargers": photo(
    "cases",
    "case-city-ev-chargers",
    RATIO["3:2"],
    "A row of electric car charging points with coiled cables along a wet city pavement, lit by low golden sunlight.",
    { objectPosition: "35% 55%", darkDim: 0.9 },
  ),
  // Cropped as the reviewer asked (left and top 21% removed: a lead on a wall peg with a wrong shadow).
  "corvane-vets-acquisition": photo(
    "cases",
    "case-corvane-vets-acquisition",
    [1600, 1066],
    "A small shaggy cream dog sits on a carpeted floor beside two plastic pet carriers on a low wooden bench in sunlight.",
    { objectPosition: "50% 70%", darkDim: 0.9 },
  ),
  "ostrander-pumps-sensor-deal": photo(
    "cases",
    "case-ostrander-pumps-sensor-deal",
    RATIO["3:2"],
    "A small white sensor box with a thin cable, mounted on a large grey industrial pump, with pipes blurred in a bright plant room.",
    { objectPosition: "48% 70%" },
  ),
  "cobbleway-parcel-hub": photo(
    "cases",
    "case-cobbleway-parcel-hub",
    RATIO["3:2"],
    "Plain cardboard parcels on conveyor belts in a large sorting hall, with low sunlight streaming through tall windows.",
    { objectPosition: "50% 65%" },
  ),
  "wrenfield-hotels-profit": photo(
    "cases",
    "case-wrenfield-hotels-profit",
    RATIO["3:2"],
    "Folded white towels on a neatly made white bed, with a pillow, a vase of small flowers and sheer curtains in warm sunlight.",
    { objectPosition: "60% 65%", darkDim: 0.9 },
  ),
  "stowline-backup-pricing": photo(
    "cases",
    "case-stowline-backup-pricing",
    RATIO["3:2"],
    "A dark server unit with two rows of drive bays and a small green status light, on a cabinet beside a blurred server rack.",
    { objectPosition: "60% 74%" },
  ),
  "pellbrook-clinics-waiting-times": photo(
    "cases",
    "case-pellbrook-clinics-waiting-times",
    RATIO["3:2"],
    "An empty waiting room with teal upholstered wooden chairs along two walls, a blank wall-mounted screen and a potted plant in warm sunlight.",
    { objectPosition: "40% 60%", darkDim: 0.9 },
  ),
  "brinmoor-bike-share-repairs": photo(
    "cases",
    "case-brinmoor-bike-share-repairs",
    RATIO["3:2"],
    "A row of white bikes with lime-green panels standing in pale docking posts, a black toolbox on the paving beside them in low sunlight.",
    { objectPosition: "55% 60%", darkDim: 0.9 },
  ),
  "bramblecup-uk-supermarket-deal": photo(
    "cases",
    "case-bramblecup-uk-supermarket-deal",
    RATIO["3:2"],
    "Plain unlabelled cream pots with white lids on a white shelf in sunlight, with a few dried wheat ears lying in front.",
    { objectPosition: "65% 65%", darkDim: 0.85 },
  ),
  "hollinsway-pet-insurance": photo(
    "cases",
    "case-hollinsway-pet-insurance",
    RATIO["3:2"],
    "A tabby cat asleep, curled around a cushion on a cream sofa beside a chunky knitted blanket, with a set of keys nearby.",
    { objectPosition: "35% 60%", darkDim: 0.9 },
  ),
  "london-cargo-bikes": photo(
    "cases",
    "case-london-cargo-bikes",
    RATIO["3:2"],
    "A black three-wheeled cargo bike with a wooden box of cardboard parcels, parked on a sunny street of white terraced houses.",
    { objectPosition: "55% 65%", darkDim: 0.9 },
  ),
  "us-dog-walking-market": photo(
    "cases",
    "case-us-dog-walking-market",
    RATIO["3:2"],
    "A person seen from behind walking four dogs on leads along a leaf-covered suburban pavement in low autumn sun.",
    { objectPosition: "50% 60%" },
  ),
  "cragwell-climbing-growth": photo(
    "cases",
    "case-cragwell-climbing-growth",
    RATIO["3:2"],
    "An empty indoor bouldering wall covered in colourful climbing holds, with a thick crash mat below and sunlight from tall windows.",
    { objectPosition: "65% 45%", darkDim: 0.9 },
  ),
  "larkmoor-meal-kit-acquisition": photo(
    "cases",
    "case-larkmoor-meal-kit-acquisition",
    RATIO["3:2"],
    "An open cardboard box of fresh vegetables and herbs on a kitchen counter, with small spice jars, garlic cloves and a blank lined card.",
    { objectPosition: "50% 60%", darkDim: 0.9 },
  ),
  "cobalt-basin-ski-resort": photo(
    "cases",
    "case-cobalt-basin-ski-resort",
    RATIO["3:2"],
    "Empty chairlift chairs on cables above a smooth snowy slope, with snow-covered pine trees under a clear blue sky.",
    { objectPosition: "55% 40%", darkDim: 0.85 },
  ),
};

/** The banner at the top of a guide, keyed by the guide's slug (G1-G10; market sizing and M&A were rejected). */
export const GUIDE_PHOTOS: Record<string, Photo> = {
  "profitability-case-interview": photo(
    "guides",
    "guide-profitability",
    RATIO["16:9"],
    "A brass balance scale in warm sunlight, with a few coins and a small stack of paper receipts at its base.",
    { objectPosition: "65% 50%", darkDim: 0.85 },
  ),
  "market-entry-case-interview": photo(
    "guides",
    "guide-market-entry",
    RATIO["16:9"],
    "An open white panelled door leading from a dim hallway with a wooden floor into a bright, sunlit empty room.",
    { objectPosition: "50% 50%", darkDim: 0.9 },
  ),
  "pricing-case-interview": photo(
    "guides",
    "guide-pricing",
    RATIO["16:9"],
    "Blank cream paper price tags of different sizes, each with a looped string, laid out in rows on a pale sunlit surface.",
    { objectPosition: "50% 55%", darkDim: 0.85 },
  ),
  "growth-case-interview": photo(
    "guides",
    "guide-growth",
    RATIO["16:9"],
    "Six potted plants in a row on a sunlit shelf, rising from a tiny seedling on the left to a tall leafy plant.",
    { objectPosition: "60% 55%", darkDim: 0.9 },
  ),
  "operations-case-interview": photo(
    "guides",
    "guide-operations",
    RATIO["16:9"],
    "Two long rows of identical small wooden pegs lined up on a narrow belt along a wooden bench, in soft window light.",
    { objectPosition: "40% 75%", darkDim: 0.85 },
  ),
  "how-to-structure-a-case-interview": photo(
    "guides",
    "guide-structuring",
    RATIO["16:9"],
    "A small wire tree on a round cork base, branching from one stem into many arms tipped with lime and dark blue beads.",
    { objectPosition: "50% 45%", darkDim: 0.9 },
  ),
  "case-interview-maths": photo(
    "guides",
    "guide-case-maths",
    RATIO["16:9"],
    "A silver mechanical pencil resting on squared paper filled with faint, illegible handwritten workings, with a dark eraser nearby in slanting sunlight.",
    { objectPosition: "50% 60%", darkDim: 0.9 },
  ),
  "how-to-practise-case-interviews-alone": photo(
    "guides",
    "guide-practising-alone",
    RATIO["16:9"],
    "A quiet desk by a tall window with a silver desk lamp, an open notebook, a small stopwatch and a stack of closed books.",
    { objectPosition: "45% 65%" },
  ),
};

/** The drill category cards on /drills (D1-D4; mental maths was rejected). */
export const DRILL_PHOTOS: Record<string, Photo> = {
  "market-sizing": photo(
    "drills",
    "drill-market-sizing",
    RATIO["4:3"],
    "A high, angled view over the flat rooftops of a dense city of pale low-rise buildings and trees in golden morning light.",
    { objectPosition: "50% 60%" },
  ),
  frameworks: photo(
    "drills",
    "drill-frameworks",
    RATIO["4:3"],
    "Rows of blank sticky notes on a pale wall beside a window, the first column lime green and dark blue, the rest cream.",
    { objectPosition: "58% 45%", darkDim: 0.85 },
  ),
  "chart-reading": photo(
    "drills",
    "drill-chart-reading",
    RATIO["4:3"],
    "A brass magnifying glass resting on printed bar charts with blue and tan bars on a desk, beside a glass of water.",
    { objectPosition: "60% 55%", darkDim: 0.9 },
  ),
};

/** The free tool cards on /tools, keyed by the tool's slug (T1-T4; break-even was rejected). */
export const TOOL_PHOTOS: Record<string, Photo> = {
  "market-sizing-calculator": photo(
    "tools",
    "tool-market-sizing",
    RATIO["4:3"],
    "A plain pale wooden ball beside a coiled cloth tape measure, its end draped over the ball, in soft sunlight.",
    { objectPosition: "50% 60%", darkDim: 0.85 },
  ),
  "mental-maths-trainer": photo(
    "tools",
    "tool-mental-maths-trainer",
    RATIO["4:3"],
    "A glass hourglass with sand running through it on a sunlit table, next to a small spiral notepad with a dark pencil.",
    { objectPosition: "65% 55%", darkDim: 0.9 },
  ),
  "growth-rate-calculator": photo(
    "tools",
    "tool-growth-rate",
    RATIO["4:3"],
    "Six stacks of gold-coloured coins in a row on a table, each stack taller than the one before from left to right.",
    { objectPosition: "50% 70%", darkDim: 0.85 },
  ),
};

/** Page banners and panels (P1-P14; P4, the tools page, was rejected). */
export const PAGE_PHOTOS = {
  cases: photo(
    "pages",
    "page-cases",
    RATIO["16:9"],
    "A neat stack of closed ring binders in lime, indigo, peach and mint covers on a pale table, lit by slanting window light.",
    { objectPosition: "50% 70%", darkDim: 0.85 },
  ),
  drills: photo(
    "pages",
    "page-drills",
    RATIO["16:9"],
    "Curving pale running track lanes marked with white lines, crossed by soft tree shadows in low morning sunlight.",
    { objectPosition: "45% 50%" },
  ),
  guides: photo(
    "pages",
    "page-guides",
    RATIO["16:9"],
    "An open blank notebook with a ribbon bookmark and a black pen on a sunlit cream table beside a palm plant.",
    { objectPosition: "50% 60%", darkDim: 0.85 },
  ),
  pricing: photo(
    "pages",
    "page-pricing",
    RATIO["16:9"],
    "Two blank hardback covers standing side by side, one lime green and one deep indigo, against a sunlit cream wall.",
    { objectPosition: "50% 65%", darkDim: 0.9 },
  ),
  about: photo(
    "pages",
    "page-about",
    RATIO["16:9"],
    "A quiet desk by a window at dusk with an open laptop, a potted plant, a white lamp and a small pile of notebooks.",
    { objectPosition: "50% 65%", darkDim: 0.9 },
  ),
  faq: photo(
    "pages",
    "page-faq",
    RATIO["16:9"],
    "A row of paper speech bubbles in lime, mint, white, cream, peach and indigo standing on a sunlit floor.",
    { objectPosition: "40% 70%", darkDim: 0.9 },
  ),
  universities: photo(
    "pages",
    "page-universities",
    RATIO["16:9"],
    "Rows of empty wooden chairs in a sunlit seminar room facing a whiteboard with abstract hand-drawn boxes and arrows.",
    { objectPosition: "55% 60%", darkDim: 0.9 },
  ),
  glossary: photo(
    "pages",
    "page-glossary",
    RATIO["16:9"],
    "An open oak card-catalogue drawer filled with rows of blank cream index cards, warm sunlight across the wood.",
    { objectPosition: "45% 50%", darkDim: 0.9 },
  ),
  // Only on the firm guides section of /guides, as decoration, under a heading that names no firm. Never on a
  // single firm's guide: beside a firm's name it would read as that firm's office (rules 2.3 and 2.4).
  "firm-guides": photo(
    "pages",
    "page-firm-guides",
    RATIO["16:9"],
    "An empty, bright office lobby at dawn with cream sofas, tall glass windows, white columns and potted plants on a polished floor.",
    { objectPosition: "55% 55%", darkDim: 0.85 },
  ),
  login: photo(
    "pages",
    "page-login",
    [1600, 2000],
    "A green desk lamp lighting an open notebook and pen on a dark desk at night, blurred city lights beyond the window.",
    { objectPosition: "45% 60%" },
  ),
  dashboard: photo(
    "pages",
    "page-dashboard",
    RATIO["21:9"],
    "Soft stripes of sunlight through blinds falling across a calm off-white wall, with a hint of a green plant in the corner.",
    { objectPosition: "50% 50%", darkDim: 0.85 },
  ),
  "not-found": photo(
    "pages",
    "page-not-found",
    [1600, 1600],
    "A single wooden chair in a bright empty room with a herringbone floor, a sunlit wall and a tall white door left ajar.",
    { objectPosition: "60% 70%", darkDim: 0.9 },
  ),
  debrief: photo(
    "pages",
    "page-debrief",
    RATIO["21:9"],
    "A single spotlight shining down onto an empty dark navy stage floor, leaving a soft pale green circle of light.",
    { objectPosition: "50% 60%" },
  ),
} satisfies Record<string, Photo>;

/** The three pictures on /for-universities (U1-U3). */
export const UNIVERSITY_PHOTOS = {
  workshop: photo(
    "universities",
    "uni-workshop",
    RATIO["3:2"],
    "A room full of people seen from behind in warm sunlight, facing a blurred figure standing by a whiteboard of faint diagrams.",
    { objectPosition: "55% 50%" },
  ),
  "careers-fair": photo(
    "universities",
    "uni-careers-fair",
    RATIO["3:2"],
    "A table with a white cloth holding neat stacks of blank leaflets and a small potted tree, in soft sunlight against a cream wall.",
    { objectPosition: "55% 60%", darkDim: 0.9 },
  ),
  "practice-pairs": photo(
    "universities",
    "uni-practice-pairs",
    RATIO["3:2"],
    "Two cups of coffee and two notebooks on a wooden table between two empty chairs, with striped sunlight across the wall.",
    { objectPosition: "50% 65%" },
  ),
} satisfies Record<string, Photo>;

// Own keys only, so a slug like "constructor" or "__proto__" never finds anything.
function lookup(table: Record<string, Photo>, key: string): Photo | undefined {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

// Each returns undefined when that slot has no photo (a rejected image, or a case added
// after the photos were made), and the slot then keeps its design without one.
export const caseImage = (slug: string) => lookup(CASE_PHOTOS, slug);
export const guideImage = (slug: string) => lookup(GUIDE_PHOTOS, slug);
export const drillImage = (category: string) => lookup(DRILL_PHOTOS, category);
export const toolImage = (slug: string) => lookup(TOOL_PHOTOS, slug);
export const homeImage = (name: string) => lookup(HOME_PHOTOS, name);
export const pageImage = (name: string) => lookup(PAGE_PHOTOS, name);
export const universityImage = (name: string) => lookup(UNIVERSITY_PHOTOS, name);

/** Every photo, for the tests. */
export function allPhotos(): { group: string; key: string; photo: Photo }[] {
  const groups: [string, Record<string, Photo>][] = [
    ["home", HOME_PHOTOS],
    ["cases", CASE_PHOTOS],
    ["guides", GUIDE_PHOTOS],
    ["drills", DRILL_PHOTOS],
    ["tools", TOOL_PHOTOS],
    ["pages", PAGE_PHOTOS],
    ["universities", UNIVERSITY_PHOTOS],
  ];
  return groups.flatMap(([group, table]) => Object.entries(table).map(([key, photo]) => ({ group, key, photo })));
}
