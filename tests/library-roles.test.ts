import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { visibleCases } from "@/lib/content/cases";
import { practiceCases, practiceFirms } from "@/lib/content/practice";
import { findRole, inRole, minutesRange, ROLES, roleCases, rolesForFirm, trackOfFirm } from "@/lib/content/roles";

// The signed-in library: Companies (company, then role, then case) and Cases (browse by role).
// Roles are our own grouping of practice cases (lib/content/roles.ts), so these tests make sure
// nothing is left out of them and that every page below /app/library checks the user itself.

describe("roles", () => {
  it("have unique slugs, labels and a blurb", () => {
    expect(new Set(ROLES.map((r) => r.slug)).size).toBe(ROLES.length);
    expect(new Set(ROLES.map((r) => r.label)).size).toBe(ROLES.length);
    for (const r of ROLES) expect(r.blurb.length, r.slug).toBeGreaterThan(20);
    expect(findRole("investment-banking")?.track).toBe("banking");
    expect(findRole("nope")).toBeUndefined();
  });

  it("name only cases that exist", () => {
    const slugs = new Set(visibleCases().map((c) => c.slug));
    for (const r of ROLES) for (const s of r.slugs ?? []) expect(slugs.has(s), `${r.slug}: ${s}`).toBe(true);
  });

  it("leave no visible case out, so a new case is never missing from the library", () => {
    const left = visibleCases().filter((c) => !ROLES.some((r) => inRole(r, c)));
    expect(left.map((c) => c.slug)).toEqual([]);
  });

  it("each have several cases", () => {
    for (const r of ROLES) expect(roleCases(r).length, r.slug).toBeGreaterThanOrEqual(2);
  });

  it("keep banking cases out of consulting roles and the other way round", () => {
    for (const r of ROLES) for (const c of roleCases(r)) expect(c.track, `${r.slug}: ${c.slug}`).toBe(r.track);
  });

  it("show the length as one number or a range", () => {
    expect(minutesRange([{ est_minutes: 30 }, { est_minutes: 30 }])).toBe("30 min");
    expect(minutesRange([{ est_minutes: 35 }, { est_minutes: 25 }])).toBe("25–35 min");
  });
});

describe("company, then role, then case", () => {
  it("gives every company at least one role, and reaches every one of its practice cases through a role", () => {
    const firms = practiceFirms();
    expect(firms.length).toBeGreaterThan(0);
    for (const f of firms) {
      const roles = rolesForFirm(f);
      expect(roles.length, f.slug).toBeGreaterThan(0);
      for (const { role } of roles) expect(role.track, `${f.slug}: ${role.slug}`).toBe(trackOfFirm(f));
      const reached = new Set(roles.flatMap((r) => r.cases.map((c) => c.slug)));
      for (const c of practiceCases(f)) expect(reached.has(c.slug), `${f.slug}: ${c.slug} is in no role`).toBe(true);
    }
  });
});

describe("the signed-in library pages", () => {
  const pages = [
    "app/app/library/page.tsx",
    "app/app/library/[firm]/page.tsx",
    "app/app/library/[firm]/[role]/page.tsx",
    "app/app/library/roles/[role]/page.tsx",
  ];

  it.each(pages)("%s checks the user itself and is kept out of search results", (file) => {
    expect(existsSync(file), file).toBe(true);
    const text = readFileSync(file, "utf8");
    expect(text).toContain("await requireUser()");
    expect(text).toContain("robots: { index: false }");
  });

  it("show an unknown company or role as not found", () => {
    for (const file of pages.slice(1)) expect(readFileSync(file, "utf8"), file).toContain("notFound()");
  });

  it("start a case from its row, and are on the dashboard and in the menu", () => {
    const parts = readFileSync("components/app/library-parts.tsx", "utf8");
    expect(parts).toContain("`/app/start/${c.slug}`");
    expect(parts).toContain("`/app/library/${firm.slug}`");
    expect(parts).toContain('title="Companies"');
    expect(parts).toContain('title="Cases"');
    expect(readFileSync("app/app/page.tsx", "utf8")).toContain("<LibrarySections");
    expect(readFileSync("components/app-nav.tsx", "utf8")).toContain('"/app/library"');
  });

  it("show no pictures, so no firm logo can appear (rule 2.3), and keep the not-affiliated line", () => {
    const parts = readFileSync("components/app/library-parts.tsx", "utf8");
    expect(parts).not.toMatch(/next\/image|<img|<Image|<Photo|\.(png|jpe?g|svg|webp|gif)\b/i);
    expect(parts).toContain("siteConfig.disclaimer");
  });
});
