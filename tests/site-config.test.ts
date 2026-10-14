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

  it("has the agreed refund and retention settings", () => {
    expect(siteConfig.refundWindowDays).toBe(7);
    expect(siteConfig.refundMaxAiSessions).toBe(2);
    expect(siteConfig.transcriptRetentionDays).toBe(365);
  });

  it("starts with the consulting track only and tax switched off", () => {
    expect(siteConfig.tracksEnabled).toEqual(["consulting"]);
    expect(siteConfig.stripeTaxEnabled).toBe(false);
  });

  it("carries the non-affiliation disclaimer from rule 2.3", () => {
    expect(siteConfig.disclaimer).toBe(
      "Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site.",
    );
  });
});
