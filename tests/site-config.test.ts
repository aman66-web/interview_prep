import { describe, expect, it } from "vitest";
import { siteConfig } from "@/site.config";

// These pin the business numbers from the kit (section 4) so a change is
// always deliberate.
describe("siteConfig", () => {
  it("has the agreed prices", () => {
    expect(siteConfig.prices.monthly).toBe(39);
    expect(siteConfig.prices.pass90).toBe(99);
    expect(siteConfig.prices.currency).toBe("USD");
  });

  it("has the agreed usage limits", () => {
    expect(siteConfig.limits.free.aiCasesTotal).toBe(1);
    expect(siteConfig.limits.free.drillsPerDay).toBe(20);
    expect(siteConfig.limits.paid.aiCasesPerDay).toBe(3);
    expect(siteConfig.limits.paid.aiCasesPerMonth).toBe(60);
    expect(siteConfig.limits.candidateTurnsPerSession).toBe(40);
  });

  it("has the agreed refund and retention settings (no refunds: founder, 15 Oct 2026)", () => {
    expect(siteConfig.refunds).toBe("final-sale");
    expect(siteConfig.transcriptRetentionDays).toBe(365);
  });

  it("has the consulting and banking tracks (banking: founder, 16 Oct 2026) and tax switched off", () => {
    expect(siteConfig.tracksEnabled).toEqual(["consulting", "banking"]);
    expect(siteConfig.stripeTaxEnabled).toBe(false);
  });

  it("carries the non-affiliation disclaimer from rule 2.3", () => {
    expect(siteConfig.disclaimer).toBe(
      "Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site.",
    );
  });
});
