import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { allCases } from "@/lib/content/cases";
import { allFirms, allGuides } from "@/lib/content/writing";
import { DRILL_CATEGORIES } from "@/lib/drills";
import {
  allPhotos,
  CASE_PHOTOS,
  caseImage,
  DRILL_PHOTOS,
  drillImage,
  GUIDE_PHOTOS,
  guideImage,
  homeImage,
  pageImage,
  TOOL_PHOTOS,
  toolImage,
} from "@/lib/images";
import { TOOLS } from "@/lib/tools";

// The site's photos (docs/DESIGN.md, "Photos"): every photo in lib/images.ts is a real, small
// WebP of the stated size, every file in public/images is listed there, and every key names a
// real case, guide, drill category or tool. No new dependencies: the WebP header is read here.

const root = process.cwd();
const MAX_BYTES = 400 * 1024;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Width and height from a WebP file's header (lossy "VP8 ", lossless "VP8L" or extended "VP8X"). */
function webpSize(buf: Buffer): { width: number; height: number } {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("not a WebP file");
  }
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  if (chunk === "VP8 ") {
    // Frame tag (3 bytes) and start code 9d 01 2a, then 14-bit width and height.
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) throw new Error("bad VP8 start code");
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    if (buf[20] !== 0x2f) throw new Error("bad VP8L signature");
    const bits = buf.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  throw new Error(`unknown WebP chunk ${chunk}`);
}

const photos = allPhotos();
const publicFile = (src: string) => join(root, "public", ...src.replace(/^\//, "").split("/"));

describe("the photo registry (lib/images.ts)", () => {
  it("lists the site's photos", () => {
    expect(photos.length).toBeGreaterThan(40);
    expect(new Set(photos.map((p) => p.photo.src)).size, "each file is listed once").toBe(photos.length);
  });

  it.each(photos.map((p) => [`${p.group}/${p.key}`, p.photo] as const))("%s is a WebP under 400 KB with the stated size", (_name, photo) => {
    expect(photo.src).toMatch(/^\/images\/[a-z]+\/[a-z0-9-]+\.webp$/);
    const file = publicFile(photo.src);
    expect(existsSync(file), `${photo.src} is missing from public/`).toBe(true);
    const buf = readFileSync(file);
    expect(buf.length, `${photo.src} is ${Math.round(buf.length / 1024)} KB`).toBeLessThan(MAX_BYTES);
    expect(webpSize(buf)).toEqual({ width: photo.width, height: photo.height });
  });

  it("gives every photo alt text, unless it is marked as decoration only", () => {
    for (const { group, key, photo } of photos) {
      if (photo.decorative) continue;
      expect(photo.alt.trim().length, `${group}/${key} needs alt text`).toBeGreaterThan(20);
      // Rule 2.4: a description of the scene, never a claim about who is in it (plurals too).
      expect(photo.alt, `${group}/${key}`).not.toMatch(/\b(students?|customers?|clients?|members?|users?|candidates?|our team|office of)\b/i);
    }
  });

  it("never names a firm in alt text (rule 2.3)", () => {
    const names = allFirms().flatMap((f) => [f.name, f.short_name]).filter((n): n is string => typeof n === "string" && n.length > 2);
    expect(names.length).toBeGreaterThan(0);
    for (const { group, key, photo } of photos) {
      for (const name of names) expect(photo.alt.toLowerCase(), `${group}/${key} names ${name}`).not.toContain(name.toLowerCase());
    }
  });

  it("only uses CSS-safe focal points and the two dark-mode dims", () => {
    for (const { group, key, photo } of photos) {
      if (photo.objectPosition) expect(photo.objectPosition, `${group}/${key}`).toMatch(/^\d{1,3}% \d{1,3}%$/);
      if (photo.darkDim !== undefined) expect([0.85, 0.9], `${group}/${key}`).toContain(photo.darkDim);
    }
  });

  it.each(photos.map((p) => [`${p.group}/${p.key}`, p.photo] as const))("%s has its 800 px copy for small frames", (_name, photo) => {
    const small = publicFile(photo.src.replace(/\.webp$/, "-800.webp"));
    expect(existsSync(small), small).toBe(true);
    const buf = readFileSync(small);
    const size = webpSize(buf);
    expect(size.width).toBe(Math.min(800, photo.width));
    expect(Math.abs(size.height - Math.round((photo.height * size.width) / photo.width))).toBeLessThanOrEqual(1);
    expect(statSync(small).size).toBeLessThan(150 * 1024);
  });

  it("serves the small copy to small frames and the original to large ones, with no resizing service", async () => {
    const { default: loader } = await import("@/lib/image-loader");
    expect(loader({ src: "/images/cases/case-harbourline-bakeries.webp", width: 640 })).toBe("/images/cases/case-harbourline-bakeries-800.webp");
    expect(loader({ src: "/images/cases/case-harbourline-bakeries.webp", width: 800 })).toBe("/images/cases/case-harbourline-bakeries-800.webp");
    expect(loader({ src: "/images/cases/case-harbourline-bakeries.webp", width: 1200 })).toBe("/images/cases/case-harbourline-bakeries.webp");
    expect(loader({ src: "/icon.svg", width: 640 })).toBe("/icon.svg");
    const config = readFileSync(join(root, "next.config.ts"), "utf8");
    expect(config).toMatch(/loader:\s*"custom"/);
  });

  it("lists every file in public/images, and nothing else is in there", () => {
    const listed = new Set(photos.flatMap((p) => [publicFile(p.photo.src), publicFile(p.photo.src.replace(/\.webp$/, "-800.webp"))]));
    const files = walk(join(root, "public", "images"));
    const unlisted = files.filter((f) => !listed.has(f)).map((f) => relative(root, f).split(sep).join("/"));
    expect(unlisted, "add these to lib/images.ts or delete them").toEqual([]);
  });

  it("keeps the social-media images (LinkedIn only) out of the site", () => {
    const social = walk(join(root, "public")).filter((f) => /(^|[\\/])social-[^\\/]*$/i.test(f));
    expect(social).toEqual([]);
    expect(photos.filter((p) => /social-/.test(p.photo.src))).toEqual([]);
  });
});

describe("the photo slots", () => {
  it("key case photos by the slug of a real case", () => {
    const slugs = new Set(allCases.map((c) => c.slug));
    expect(Object.keys(CASE_PHOTOS).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("key guide photos by the slug of a real guide", () => {
    const slugs = new Set(allGuides().map((g) => g.slug));
    expect(Object.keys(GUIDE_PHOTOS).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("key drill photos by a real drill category", () => {
    expect(Object.keys(DRILL_PHOTOS).filter((c) => !(DRILL_CATEGORIES as readonly string[]).includes(c))).toEqual([]);
  });

  it("key tool photos by the slug of a real tool", () => {
    const slugs = new Set(TOOLS.map((t) => t.slug));
    expect(Object.keys(TOOL_PHOTOS).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("return nothing for a slot without a photo, so it keeps its own design", () => {
    // Rejected by the reviewer (IMAGE_BRIEF): they must not come back by accident.
    expect(caseImage("flexora-gym-software-pricing")).toBeUndefined();
    expect(caseImage("lumen-tutoring-growth")).toBeUndefined();
    expect(caseImage("orvessa-subscriber-growth")).toBeUndefined();
    expect(guideImage("market-sizing-case-interview")).toBeUndefined();
    expect(guideImage("mergers-and-acquisitions-case-interview")).toBeUndefined();
    expect(drillImage("mental-maths")).toBeUndefined();
    expect(toolImage("break-even-calculator")).toBeUndefined();
    expect(homeImage("maths")).toBeUndefined();
    expect(pageImage("tools")).toBeUndefined();
    // Unknown keys, including ones that exist on every object.
    for (const key of ["no-such-case", "constructor", "__proto__", "toString", ""]) {
      expect(caseImage(key)).toBeUndefined();
      expect(pageImage(key)).toBeUndefined();
    }
  });

  it("find the photos that do exist", () => {
    expect(caseImage("harbourline-bakeries")?.src).toBe("/images/cases/case-harbourline-bakeries.webp");
    expect(guideImage("profitability-case-interview")?.src).toBe("/images/guides/guide-profitability.webp");
    expect(drillImage("chart-reading")?.src).toBe("/images/drills/drill-chart-reading.webp");
    expect(toolImage("growth-rate-calculator")?.src).toBe("/images/tools/tool-growth-rate.webp");
    expect(pageImage("not-found")?.src).toBe("/images/pages/page-not-found.webp");
  });
});

describe("where the photos are used", () => {
  const sourceFiles = ["app", "components"]
    .flatMap((d) => walk(join(root, d)))
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ path: relative(root, f).split(sep).join("/"), text: readFileSync(f, "utf8") }));

  it("goes through the registry and the Photo component, never a hard-coded image path", () => {
    const offenders = sourceFiles.filter((f) => /["'`]\/images\//.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
    // (A plain <img> is fine for a picture our own routes generate, like the share card.)
    const rawImages = sourceFiles.filter((f) => f.path !== "components/ui/photo.tsx" && /from ["']next\/image["']/.test(f.text)).map((f) => f.path);
    expect(rawImages, "use <Photo> from components/ui/photo.tsx").toEqual([]);
  });

  it("puts no photo on a single firm's guide, where it would read as that firm's office (rules 2.3, 2.4)", () => {
    const firmPage = sourceFiles.find((f) => f.path === "app/guides/firms/[firm]/page.tsx");
    expect(firmPage, "the firm guide page moved; update this test").toBeDefined();
    expect(firmPage!.text).not.toMatch(/\b(pageImage|guideImage|caseImage|Photo)\b|image=\{/);
  });

  it("uses only our own pre-sized photos: no resizing service, no remote images (next.config.ts)", () => {
    const config = readFileSync(join(root, "next.config.ts"), "utf8");
    expect(config).toMatch(/loaderFile:\s*"\.\/lib\/image-loader\.ts"/);
    expect(config).not.toMatch(/remotePatterns|domains:/);
  });
});
