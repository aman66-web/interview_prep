import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Founder, 27 Oct 2026: pressing a paid feature must say the person needs to upgrade.
// A locked case in the signed-in library opens a small upgrade window (the browser's own
// <dialog>) instead of leaving the page; without JavaScript the link still opens the case's
// start page, which carries the same message. (Checked in a real browser when built.)

const dialog = readFileSync("components/app/locked-case-link.tsx", "utf8");
const parts = readFileSync("components/app/library-parts.tsx", "utf8");

describe("the upgrade window", () => {
  it("is the browser's own dialog: modal, labelled, closable, and sends people to the plans", () => {
    expect(dialog).toContain("<dialog");
    expect(dialog).toContain("showModal()");
    expect(dialog).toMatch(/aria-labelledby=\{titleId\}/);
    expect(dialog).toContain('href="/pricing"');
    expect(dialog).toContain("Not now");
    expect(dialog).toContain("Upgrade to open this case");
  });

  it("keeps a real link underneath, so it still works without JavaScript", () => {
    expect(dialog).toMatch(/<Link\s+href=\{href\}/);
    expect(dialog).toContain("event.preventDefault()");
  });

  it("counts the paywall view for the funnel, and takes prices from the site config", () => {
    expect(dialog).toContain('notePaywallSeen("start", slug)');
    expect(dialog).toContain("siteConfig.prices.monthly");
    expect(dialog).toContain("siteConfig.prices.pass90");
  });

  it("is used for locked cases only in the library lists, never for the free starter or paid accounts", () => {
    expect(parts).toContain("const locked = !paid && !c.freeStarter;");
    expect(parts).toMatch(/locked \? \(\s*(\/\/[^\n]*\n\s*)?<LockedCaseLink/);
  });
});
