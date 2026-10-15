import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAppPath } from "@/components/site-nav";

// The site's shell: the header and footer around every page, the 404 page, and the
// colour tokens in app/globals.css (rule 2.12: good contrast, light and dark themes).

const css = readFileSync("app/globals.css", "utf8");

describe("the header and footer on signed-in pages", () => {
  it("treat /app, /admin and everything under them as the signed-in area", () => {
    for (const path of ["/app", "/app/", "/app/account", "/app/interview/abc", "/app/debrief/abc", "/admin", "/admin/x"]) {
      expect(isAppPath(path), path).toBe(true);
    }
    for (const path of ["/", "/apple", "/application", "/administrator", "/cases", "/login", "/pricing", "/share/abc", "/account-deleted", "", null, undefined]) {
      expect(isAppPath(path), String(path)).toBe(false);
    }
  });

  it("swap Log in and Start free for Dashboard there, and drop the footer's sign-up banner", () => {
    const header = readFileSync("components/site-header.tsx", "utf8");
    const nav = readFileSync("components/site-nav.tsx", "utf8");
    const footer = readFileSync("components/site-footer.tsx", "utf8");
    expect(header).toContain("<HeaderActions />");
    expect(header).not.toContain('href="/login"'); // only through HeaderActions, which checks the path
    expect(nav).toMatch(/if \(inApp\)[\s\S]*Dashboard/);
    expect(footer).toMatch(/<OutsideApp>[\s\S]*Start practising free[\s\S]*<\/OutsideApp>/);
  });
});

describe("the 404 page", () => {
  it("exists, with its own title and links onward", () => {
    expect(existsSync("app/not-found.tsx")).toBe(true);
    const text = readFileSync("app/not-found.tsx", "utf8");
    expect(text).toMatch(/title: "Page not found"/);
    for (const href of ['"/cases"', '"/guides"', '"/drills"', '"/tools"', '"/"']) expect(text).toContain(href);
  });
});

// ---- Colour tokens -----------------------------------------------------------------

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

const lightBlock = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
const darkBlock = css.slice(darkStart, css.indexOf("@theme inline"));
const light = tokens(lightBlock);
const dark = { ...light, ...tokens(darkBlock) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("colour tokens (WCAG AA, 4.5:1 for text)", () => {
  const backgrounds = ["canvas", "surface", "surface-2", "surface-3"];

  it.each([
    ["light", light],
    ["dark", dark],
  ] as const)("%s: ink, muted, subtle and warning text are readable on every page background", (_name, t) => {
    for (const text of ["ink", "muted", "subtle", "warning", "danger", "success"]) {
      for (const bg of backgrounds) {
        expect(t[text], `--${text}`).toBeDefined();
        expect(contrast(t[text], t[bg]), `--${text} on --${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ] as const)("%s: status text is readable on its own soft background", (_name, t) => {
    for (const tone of ["warning", "danger", "success"]) {
      expect(contrast(t[tone], t[`${tone}-soft`]), `--${tone} on --${tone}-soft`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("subtle text stays readable on the pastel cards", () => {
    for (const t of [light, dark]) {
      for (const bg of ["lavender", "mint", "peach", "sky", "butter", "brand-soft"]) {
        expect(contrast(t.subtle, t[bg]), `--subtle on --${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("browser-drawn parts and frosted glass", () => {
  it("tell the browser which theme is showing, so scrollbars and controls match", () => {
    expect(lightBlock).toMatch(/color-scheme:\s*light/);
    expect(darkBlock).toMatch(/color-scheme:\s*dark/);
  });

  it("write only the standard backdrop-filter (a hand-written -webkit- copy makes the optimiser drop it)", () => {
    expect(css).toMatch(/backdrop-filter:/);
    expect(css).not.toMatch(/-webkit-backdrop-filter/);
  });

  it("keep the header nearly opaque, so page text never shows through it", () => {
    const rule = css.slice(css.indexOf(".glass-bar {"), css.indexOf("}", css.indexOf(".glass-bar {")));
    const share = Number(rule.match(/var\(--surface\)\s+(\d+)%/)?.[1]);
    expect(share).toBeGreaterThanOrEqual(90);
    expect(readFileSync("components/site-header.tsx", "utf8")).toContain("glass-bar");
    expect(readFileSync("components/site-nav.tsx", "utf8")).toMatch(/id="mobile-menu"[\s\S]*?bg-surface /);
  });
});
