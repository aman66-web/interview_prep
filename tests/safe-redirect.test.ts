import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/account")).toBe("/app/account");
    expect(safeNextPath("/app/account?tab=billing#top")).toBe("/app/account?tab=billing#top");
    expect(safeNextPath("/pricing")).toBe("/pricing");
    expect(safeNextPath("/app/start/harbourline-bakeries")).toBe("/app/start/harbourline-bakeries");
  });

  it("keeps encoded values in the query as they were", () => {
    expect(safeNextPath("/app?next=%2Fpricing")).toBe("/app?next=%2Fpricing");
    expect(safeNextPath("/cases?q=caf%C3%A9")).toBe("/cases?q=caf%C3%A9");
  });

  it("returns the normalised path when dot segments stay on this site", () => {
    expect(safeNextPath("/app/../pricing")).toBe("/pricing");
    expect(safeNextPath("/app/./account")).toBe("/app/account");
    expect(safeNextPath("/..")).toBe("/");
  });

  it("falls back when nothing usable is given", () => {
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath(42)).toBe("/app");
    expect(safeNextPath(["/app"])).toBe("/app");
    expect(safeNextPath("app/account")).toBe("/app");
    expect(safeNextPath(" /app")).toBe("/app");
    expect(safeNextPath(`/${"a".repeat(5000)}`)).toBe("/app");
  });

  it("uses the fallback that was asked for", () => {
    expect(safeNextPath("https://evil.example", "/home")).toBe("/home");
    expect(safeNextPath("/.//evil.example", "/home")).toBe("/home");
  });

  it.each([
    // Other websites, written plainly
    "https://evil.example",
    "http://evil.example/app",
    "//evil.example",
    "//evil.example/app",
    "///evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    // Dot segments that the URL parser folds into "//"
    "/.//evil.example/phish",
    "/./\\evil.example",
    "/a/..//evil.example",
    "/app/../..//evil.example",
    "/./..//evil.example",
    "/.\\/evil.example",
    // Percent-encoded dots, slashes and backslashes
    "/%2e//evil.example",
    "/%2E//evil.example",
    "/%2e%2e//evil",
    "/a/%2e%2e//evil.example",
    "/%2e%2e%2f%2fevil.example",
    "/%2F/evil.example",
    "/%2f%2fevil.example",
    "/%5Cevil.example",
    "/%5c%5cevil.example",
    "%2F%2Fevil.example",
    "/.%2F%2Fevil.example",
    // Tabs, newlines and other control characters (browsers drop them from URLs)
    "/app\n//evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r\n/evil.example",
    "/%09/evil.example",
    "/%0a/evil.example",
    "/%0d%0a/evil.example",
    "/%00/evil.example",
    "/app\u007f",
    "/app\u0085",
    // Broken percent-encoding
    "/%E0%A4%A",
    "/app?x=100%",
  ])("rejects %j", (value) => {
    expect(safeNextPath(value)).toBe("/app");
  });

  it("never returns anything a browser would read as another website", () => {
    const tricky = ["/", ".", "..", "%2e", "%2E", "%2f", "%2F", "%5c", "%5C", "\\", "/", "a", "%09", "?", "#"];
    // Every combination of up to four pieces after a leading "/".
    const outputs = new Set<string>();
    const build = (prefix: string, depth: number) => {
      outputs.add(safeNextPath(prefix + "evil.example"));
      if (depth === 0) return;
      for (const piece of tricky) build(prefix + piece, depth - 1);
    };
    build("/", 4);
    for (const out of outputs) {
      expect(out.startsWith("/")).toBe(true);
      expect(out.charAt(1)).not.toBe("/");
      expect(out.charAt(1)).not.toBe("\\");
      expect(new URL(out, "https://casespar.test").origin).toBe("https://casespar.test");
    }
  });
});
