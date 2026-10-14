import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/account")).toBe("/app/account");
    expect(safeNextPath("/app/account?tab=billing#top")).toBe("/app/account?tab=billing#top");
  });

  it("falls back when nothing usable is given", () => {
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath(42)).toBe("/app");
    expect(safeNextPath("app/account")).toBe("/app");
  });

  it("uses the fallback that was asked for", () => {
    expect(safeNextPath("https://evil.example", "/home")).toBe("/home");
  });

  it.each([
    "https://evil.example",
    "http://evil.example/app",
    "//evil.example",
    "//evil.example/app",
    "/\\evil.example",
    "/\\/evil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    "/app\n//evil.example",
    "/\t/evil.example",
  ])("rejects %j", (value) => {
    expect(safeNextPath(value)).toBe("/app");
  });
});
