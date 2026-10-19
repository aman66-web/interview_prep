import type { CSSProperties } from "react";

// Text fields in the signed-in app draw their focus ring on a wrapper ("shell"), so
// the ring follows the wrapper's rounded corners. The site-wide :focus-visible outline
// in app/globals.css is not in a CSS layer, so it beats Tailwind's outline utilities
// (and resets border-radius); the field itself switches it off inline instead. The
// wrapper's ring-2 in the brand colour is the visible focus indicator.

export const fieldShell =
  "rounded-2xl bg-surface ring-1 ring-inset ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand";

/** Classes for the input inside a shell. */
export const bareField = "block w-full bg-transparent text-ink placeholder:text-subtle";

/** Inline style for the input inside a shell. */
export const noOutline: CSSProperties = { outline: "none" };
