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

Helper classes: `.bg-aurora` (hero wash), `.bg-night-glow`, `.glass` (frosted), `.bg-dots`, `.text-gradient` (brand gradient text), `.serif-accent` (the italic serif phrase), `.wordmark`.

Fonts: Inter Tight (`font-sans`, default), Instrument Serif via `.serif-accent` only, Geist Mono (`font-mono`) for kickers, timers and numbers in tables.

## Components (`components/ui/`)

- `Container` (`size`: default 76rem, `narrow` 48rem for reading, `wide` 88rem for full-bleed panels), `Section` (vertical rhythm), `SectionHeading` (eyebrow + h2 + intro), `PageHeader` (the top of every inner page: aurora panel with eyebrow, h1, intro and optional children such as buttons).
- `Card` (`tone`: surface, soft, lime, lavender, mint, peach, sky, butter, night, brand; `padding`: none, sm, md, lg; `interactive` for hover lift) and `IconBadge`.
- `ButtonLink` / `Button` / `buttonClasses()` (`variant`: primary, secondary, lime, ghost, inverse; `size`: sm, md, lg; `arrow` adds the bubble; `full`). Form submit buttons use `Button type="submit"` or `buttonClasses()` on a `<button>`.
- `Eyebrow`, `Kicker`, `Tag` (tones listed in `badge.tsx`).
- `Faq` + `faqJsonLd` + `JsonLd`, `Marquee`, `Prose` + `TableOfContents` (renders content blocks), icons in `icons.tsx` (add new line icons there in the same style: 24px viewBox, stroke `currentColor`, `aria-hidden`).
- Marketing pieces: `components/marketing/case-card.tsx` (`CaseCard`, `DifficultyMeter`, `CASE_TYPE_TONES`), `components/marketing/mocks.tsx` (decorative product pictures).

## Patterns

- **Inner page:** `<PageHeader eyebrow title intro>` then `<Container>` sections with `mt-10`/`mt-16` spacing. Headings: h1 only in PageHeader; h2 `text-2xl sm:text-3xl font-medium tracking-tight`.
- **Accent phrase:** at most one `<span className="serif-accent">…</span>` per heading.
- **Radius:** big cards `rounded-[1.75rem]`, panels `rounded-[2rem]`–`[2.25rem]`, inner tiles `rounded-2xl`, pills `rounded-full`.
- **Forms:** label above the field (`text-sm font-medium text-ink`), fields `h-12 rounded-2xl bg-surface px-4 ring-1 ring-inset ring-line focus:ring-2 focus:ring-brand outline-none`, help text `text-sm text-muted`, errors `text-danger` with `role="alert"` or an `aria-live` region. Every input has a `<label>`.
- **Notices:** `rounded-2xl p-4` in a status tone, with `role="status"` (or `role="alert"` for errors).
- **Tables:** inside a `rounded-[1.5rem] ring-1 ring-line overflow-x-auto` wrapper; header row `bg-surface-2 text-xs uppercase tracking-wide text-muted`; numbers `tabular-nums text-right`.
- **Empty states:** a soft card with one sentence and one button.
- **Mobile first:** check 390px wide. No horizontal page scroll (wide tables scroll inside their wrapper). Tap targets at least 40px.
- **Accessibility:** keyboard reachable, visible focus (global outline), `aria-current` on active nav, decorative pictures `aria-hidden` with a text alternative nearby, contrast AA in both themes. `prefers-reduced-motion` is handled globally.

## Honesty rules that affect design (rules 2.3, 2.4)

- No logos of firms or universities, no testimonials, star ratings, user counts, "as seen in" strips or offer claims. Marquees and stat strips show product facts counted from data.
- Product pictures use real case numbers and say "Example" where scores are shown.
- The disclaimer (`siteConfig.disclaimer`) is in the footer; firm pages and the pricing page must also show it in the page body.
