import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Guards for the rules in CLAUDE.md that are easy to break by accident
// (the same idea as the repo-rules tests in the preflightpass project).

const root = process.cwd();

function walk(dir: string, pattern: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full, pattern);
    return pattern.test(name) ? [full] : [];
  });
}

const source = ["app", "components", "lib", "content"]
  .flatMap((d) => walk(join(root, d), /\.(ts|tsx|js|jsx|mjs|css|json|md|mdx)$/))
  .map((full) => ({ path: relative(root, full).split(sep).join("/"), text: readFileSync(full, "utf8") }));

const code = source.filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f.path));
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("the repository rules", () => {
  it("find the source files they are meant to check", () => {
    expect(source.length).toBeGreaterThan(20);
    expect(code.length).toBeGreaterThan(10);
  });

  it("show the non-affiliation notice in the footer and on the pricing page (rule 2.3)", () => {
    expect(read("components/site-footer.tsx")).toContain("siteConfig.disclaimer");
    expect(read("app/pricing/page.tsx")).toContain("siteConfig.disclaimer");
    expect(read("app/layout.tsx")).toContain("<SiteFooter");
    // Any firm guide added later must carry it too.
    for (const file of walk(join(root, "app/guides/firms"), /\.tsx$/)) {
      expect(readFileSync(file, "utf8"), file).toContain("siteConfig.disclaimer");
    }
  });

  it("keep the disclaimer wording exactly as the kit requires", () => {
    expect(read("site.config.ts")).toContain(
      "Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site.",
    );
  });

  it("contain no invented proof: testimonials, offer claims, ratings or user counts (rule 2.4)", () => {
    const banned =
      /testimonial|landed (an |their |the )?offers?|got (an |their )?offers? (at|from)|offer rate|success rate|money.back guarantee|guaranteed (to )?(pass|offer|job)|trusted by \d|join(ed)? \d[\d,]*\+? (students|users|candidates|people)|\d[\d,]*\+? (happy )?(students|users|candidates) (have|has|got)|rated \d(\.\d)?\s*(\/|out of)\s*5/i;
    const offenders = source.filter((f) => banned.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("do not ship firm logos (rule 2.3)", () => {
    const files = walk(join(root, "public"), /\.(png|jpe?g|svg|webp|gif|ico)$/i).map((f) => relative(root, f));
    const firmNames = /mckinsey|boston.?consulting|\bbcg\b|\bbain\b|deloitte|accenture|oliver.?wyman|kearney|roland.?berger|strategy&|\bey\b|\bkpmg\b|\bpwc\b/i;
    expect(files.filter((f) => firmNames.test(f))).toEqual([]);
    // Firm names may appear in text only to describe something, never as an image source.
    const imageUsesFirm = code.filter((f) => /<(Image|img)\b[^>]*(mckinsey|bcg|bain)/i.test(f.text)).map((f) => f.path);
    expect(imageUsesFirm).toEqual([]);
  });

  it("load no third-party trackers, ad pixels or analytics scripts (rule 2.7)", () => {
    const trackers = /googletagmanager|google-analytics|gtag\(|\bfbq\(|facebook\.net|connect\.facebook|hotjar|segment\.com|mixpanel|clarity\.ms|linkedin\.com\/insight|snap\.licdn|static\.ads-twitter|tiktok.*pixel/i;
    expect(code.filter((f) => trackers.test(f.text)).map((f) => f.path)).toEqual([]);
    const externalScripts = code.filter((f) => /<script[^>]+src=["']https?:/i.test(f.text)).map((f) => f.path);
    expect(externalScripts).toEqual([]);
  });

  it("set cookies only for the login session, from the Supabase helper files (rule 2.7)", () => {
    const allowed = new Set(["lib/supabase/server.ts", "lib/supabase/proxy.ts"]);
    const offenders = code
      .filter((f) => /document\.cookie|set-cookie|\bcookies\(\)|from ["']next\/headers["'][^;]*cookies/i.test(f.text))
      .map((f) => f.path)
      .filter((path) => !allowed.has(path));
    expect(offenders).toEqual([]);
  });

  it("keep browser storage to this tab's functional drill position (rule 2.7)", () => {
    expect(code.filter((f) => /\blocalStorage\b/.test(f.text)).map((f) => f.path)).toEqual([]);
    const session = code.filter((f) => /\bsessionStorage\b/.test(f.text)).map((f) => f.path);
    expect(session).toEqual(["lib/client/use-session-storage.ts"]);
  });

  it("reach the AI provider only through lib/ai, and the SDK only from one file (rule 2.8)", () => {
    const sdk = code.filter((f) => /@anthropic-ai\/sdk|api\.anthropic\.com/.test(f.text)).map((f) => f.path);
    expect(sdk).toEqual(["lib/ai/llm-anthropic.ts"]);
    const outsideLib = code
      .filter((f) => !f.path.startsWith("lib/ai/") && /llm-anthropic/.test(f.text))
      .map((f) => f.path);
    expect(outsideLib).toEqual([]);
  });

  it("reach Stripe only through lib/stripe/client.ts, with no card details stored (section 15)", () => {
    expect(code.filter((f) => /api\.stripe\.com/.test(f.text)).map((f) => f.path)).toEqual(["lib/stripe/client.ts"]);
    expect(code.filter((f) => /from ["']stripe["']|require\(["']stripe["']\)/.test(f.text)).map((f) => f.path)).toEqual([]);
    expect(code.filter((f) => /card_number|cardNumber|\bcvc\b|\bcvv\b/i.test(f.text)).map((f) => f.path)).toEqual([]);
  });

  it("never log email addresses or other personal data (rule 2.7)", () => {
    const offenders = code
      .filter((f) => /console\.(log|error|warn|info)\([^)]*\b(email|user\.email|formData)/i.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("have no secret keys or tokens committed in source", () => {
    const secretLooking = /sk_live_[A-Za-z0-9]{10,}|sk_test_[A-Za-z0-9]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|sk-ant-[A-Za-z0-9_-]{10,}|whsec_[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\./;
    expect(source.filter((f) => secretLooking.test(f.text)).map((f) => f.path)).toEqual([]);
  });
});
