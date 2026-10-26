# Design system

The look: a light, calm canvas with big rounded white cards, near-black pill buttons with a round arrow "bubble", one lime accent, soft pastel cards in bento grids, a deep blue "night" panel for contrast, and one italic serif phrase per heading. Dark mode mirrors all of it. The home page (`app/page.tsx`) is the reference; copy its patterns.

## Tokens (`app/globals.css`)

Use the Tailwind colour names below, never raw hex (except inside `night` sections, where white is fine). Every token has a dark-mode twin, so pages get dark mode for free.

| Use | Classes |
|---|---|
| Page background | `bg-canvas` (set on `body`) |
| Cards, inputs | `bg-surface`, `bg-surface-2` (soft), `bg-surface-3` (track/empty) |
| Text | `text-ink` (main), `text-muted` (secondary), `text-subtle` (hints, captions) |
| Lines | `ring-1 ring-inset ring-line` on cards, `border-line` for dividers (always give a border a colour: the default is the text colour) |
| Accent | `bg-lime text-lime-ink` (one highlight per screen), `text-brand` / `bg-brand-soft text-brand-ink` (links, focus, small accents) |
| Pastels for cards and tags | `bg-lavender`, `bg-mint`, `bg-peach`, `bg-sky`, `bg-butter` with `text-ink` |
| Night panels | `bg-night` or `.bg-night-glow`, text `text-white` / `text-on-night` / `text-on-night-muted` |
| Status | `text-success bg-success-soft`, `text-warning bg-warning-soft`, `text-danger bg-danger-soft` |
| Shadows | `shadow-soft` (resting), `shadow-float` (hover, floating cards) |

Helper classes: `.bg-aurora` (hero wash), `.bg-night-glow`, `.glass` (frosted), `.glass-bar` (the header: 94% opaque so text stays readable where blur is unavailable), `.bg-dots`, `.text-gradient` (brand gradient text), `.serif-accent` (the italic serif phrase), `.wordmark`.

Fonts: Inter Tight (`font-sans`, default), Instrument Serif via `.serif-accent` only, Geist Mono (`font-mono`) for kickers, timers and numbers in tables.

## Components (`components/ui/`)

- `Container` (`size`: default 76rem, `narrow` 48rem for reading, `wide` 88rem for full-bleed panels), `Section` (vertical rhythm), `SectionHeading` (eyebrow + h2 + intro), `PageHeader` (the top of every inner page: aurora panel with eyebrow, h1, intro and optional children such as buttons).
- `Card` (`tone`: surface, soft, lime, lavender, mint, peach, sky, butter, night, brand; `padding`: none, sm, md, lg; `interactive` for hover lift) and `IconBadge`.
- `ButtonLink` / `Button` / `buttonClasses()` (`variant`: primary, secondary, lime, ghost, inverse; `size`: sm, md, lg; `arrow` adds the bubble; `full`). Form submit buttons use `Button type="submit"` or `buttonClasses()` on a `<button>`.
- `Eyebrow`, `Kicker`, `Tag` (tones listed in `badge.tsx`).
- `Faq` + `faqJsonLd` + `JsonLd`, `Marquee`, `Prose` + `TableOfContents` (renders content blocks), icons in `icons.tsx` (add new line icons there in the same style: 24px viewBox, stroke `currentColor`, `aria-hidden`).
- Marketing pieces: `components/marketing/case-card.tsx` (`CaseCard`, `DifficultyMeter`, `CASE_TYPE_TONES`), `components/marketing/mocks.tsx` (decorative product pictures).

## The home page is always dark

Founder's choice, 26 Oct 2026: the home page shows the black look on every device, even when the visitor's device is set to light. It marks itself with a hidden `<span data-force-dark>` (`app/page.tsx`). `app/globals.css` has a block (`:root:has([data-force-dark])`) that repeats the dark tokens, an override for `.bg-aurora`, and a `dark:` variant that also applies on marked pages, so photo dimming and the other `dark:` styles work there. Every other page still follows the visitor's device. `tests/site-shell.test.ts` checks the repeated tokens stay identical to the dark ones: when you change a dark token, change it in both places. To make another page always dark, add the same span to it; to turn the home page back to following the device, remove the span.

## Contrast

Every text token meets WCAG AA (4.5:1) on canvas, surface, surface-2 and surface-3 in both themes; the ratios are in the comment at the top of `app/globals.css`, and `tests/site-shell.test.ts` checks them. If you change a colour, keep that test passing.

## Patterns

- **Inner page:** `<PageHeader eyebrow title intro>` then `<Container>` sections with `mt-10`/`mt-16` spacing. Headings: h1 only in PageHeader; h2 `text-2xl sm:text-3xl font-medium tracking-tight`.
- **Accent phrase:** at most one `<span className="serif-accent">…</span>` per heading.
- **Radius:** big cards `rounded-[1.75rem]`, panels `rounded-[2rem]`–`[2.25rem]`, inner tiles `rounded-2xl`, pills `rounded-full`.
- **Forms:** label above the field (`text-sm font-medium text-ink`), fields `h-12 rounded-2xl bg-surface px-4 ring-1 ring-inset ring-line focus:ring-2 focus:ring-brand outline-none`, help text `text-sm text-muted`, errors `text-danger` with `role="alert"` or an `aria-live` region. Every input has a `<label>`.
- **Notices:** `rounded-2xl p-4` in a status tone, with `role="status"` (or `role="alert"` for errors).
- **Tables:** inside a `rounded-[1.5rem] ring-1 ring-line overflow-x-auto` wrapper; header row `bg-surface-2 text-xs uppercase tracking-wide text-muted`; numbers `tabular-nums text-right`.
- **Empty states:** a soft card with one sentence and one button.
- **Header:** the main links show from 56rem (about 900px) wide; below that the menu button opens the phone menu. On `/app` and `/admin` the header and footer swap their sign-up prompts for a Dashboard link (`components/site-nav.tsx`).
- **Mobile first:** check 390px wide. No horizontal page scroll (wide tables scroll inside their wrapper). Tap targets at least 40px.
- **Accessibility:** keyboard reachable, visible focus (global outline), `aria-current` on active nav, decorative pictures `aria-hidden` with a text alternative nearby, contrast AA in both themes. `prefers-reduced-motion` is handled globally.

## Photos

The site's photos were made in Midjourney to `docs/IMAGE_BRIEF.md`, checked one by one by a reviewer (no text, logos, faces or warped objects), and converted to WebP.

- **Where they live:** `public/images/<group>/` (`home`, `cases`, `guides`, `drills`, `tools`, `pages`, `universities`), keeping the brief's file names. The LinkedIn images (`social-*`) are never put on the site.
- **One registry:** `lib/images.ts` lists every photo with its `src`, real `width` and `height`, the reviewer's `alt` text, a focal point (`objectPosition`) and, for bright photos, `darkDim`. Pages get photos only through its helpers (`caseImage(slug)`, `guideImage(slug)`, `drillImage(category)`, `toolImage(slug)`, `homeImage(name)`, `pageImage(name)`, `universityImage(name)`). A helper returns `undefined` when a slot has no photo, and the slot keeps its normal design: case cards show a panel in the case type's colour, drill and tool cards a dotted panel with their icon, headers no picture.
- **One component:** `<Photo>` (`components/ui/photo.tsx`) wraps `next/image`. Its `className` is the frame (an aspect ratio or a height, plus the radius), so nothing shifts while it loads. Always pass `sizes`. Use `preload` only for the one photo at the top of a page. Use `decorative` (empty alt, hidden from screen readers) for a photo inside a link (cards) or used as a backdrop; otherwise the reviewer's alt text is read out. Nothing is resized on the fly: every photo has an 800 px copy beside it (`<name>-800.webp`), and `lib/image-loader.ts` (set in `next.config.ts`) gives frames up to 800 px the small copy and larger frames the original, so there is no image-optimisation usage to pay for.
- **Where they sit:** page banners beside the text in `PageHeader` (`image` prop; under the text on phones); a guide's banner in `ArticleHeader` (`image` prop) with the short-answer card overlapping it; a case's photo above its "At a glance" card; case, drill and tool cards with the photo inset at the top; the dashboard's welcome band (`AppHeader` `image`); the debrief's spotlight behind its score panel; the home page's sections and the footer's closing band (home page only).
- **No text on photos.** Solid cards may overlap a photo or float on it. The one exception, the debrief's spotlight behind its scores, is a night photo under a deep blue wash, so the text is on near-solid colour.
- **Dark mode:** bright photos get `darkDim` (CSS brightness 0.85 or 0.9) so they don't glare; the night photos need none. A hairline ring stops pale photos melting into a pale page.
- **Adding or replacing one:** WebP, at most 1600 px wide (2400 for 21:9), under 400 KB. Put it in its group folder, add an entry to `lib/images.ts` with its real size, alt text that describes only what is visible, and its focal point. Make its 800 px copy too (same name plus `-800`, quality about 78). When a picture changes, give both files a new name (browsers and the CDN cache by address). `tests/images.test.ts` checks every entry's file, format, size and dimensions, that every file is listed, that every key names a real case, guide, drill category or tool, and that pages never hard-code an image path.
- **No photo yet (rejected by the reviewer, 16 Oct 2026):** home "maths checked", the Flexora, Lumenwick and Orvessa cases, the market sizing and M&A guides, mental maths drills, the break-even tool and the tools page banner. Their slots keep the plain design until a new image passes review.

## Honesty rules that affect design (rules 2.3, 2.4)

- No logos of firms or universities, no testimonials, star ratings, user counts, "as seen in" strips or offer claims. Marquees and stat strips show product facts counted from data.
- Photos are illustrations: never caption one as our students, customers, a real club or event, or a real office. People appear only from behind or blurred. The office lobby appears only in the firm guides section of /guides, as decoration under a heading that names no firm. It is never on a single firm's guide, because beside a firm's name a sighted reader would take it for that firm's office whatever the alt text says (`tests/images.test.ts` checks).
- Product pictures (`components/marketing/mocks.tsx`) use the free profitability guide's worked example (`MOCK_EXAMPLE`), never a case from the library (that would give its answers away), and carry an "Example" tag.
- The disclaimer (`siteConfig.disclaimer`) is in the footer; firm pages and the pricing page must also show it in the page body.
