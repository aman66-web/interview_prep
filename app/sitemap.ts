import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/learn/seo";
import { visibleCases } from "@/lib/content/cases";
import { allGuides, findPage, glossary, LEGAL_SLUGS, visibleFirms } from "@/lib/content/writing";
import { DRILL_CATEGORIES } from "@/lib/drills/types";
import { TOOLS } from "@/lib/tools";

// Every public page. Pages made from data are listed from the same lists their routes
// use, so a draft case or firm guide is only listed where drafts are shown (previews).
// lastModified is given only where the content records a real date.

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
  });
  const guides = allGuides();
  const latestGuide = guides.map((g) => g.updated).sort().at(-1);

  return [
    entry("/"),
    entry("/pricing"),
    entry("/cases"),
    ...visibleCases().map((c) => entry(`/cases/${c.slug}`)),
    entry("/drills"),
    ...DRILL_CATEGORIES.map((c) => entry(`/drills/${c}`)),
    entry("/guides", latestGuide),
    ...guides.map((g) => entry(`/guides/${g.slug}`, g.updated)),
    ...visibleFirms().map((f) => entry(`/guides/firms/${f.slug}`, f.updated)),
    entry("/glossary", glossary().updated),
    entry("/tools"),
    ...TOOLS.map((t) => entry(`/tools/${t.slug}`)),
    entry("/for-universities"),
    // About and FAQ are noindex while they are drafts (founder notes), so they are
    // listed only once approved.
    ...(["about", "faq"] as const).flatMap((slug) => {
      const page = findPage(slug);
      return page?.status === "approved" ? [entry(`/${slug}`, page.updated)] : [];
    }),
    ...LEGAL_SLUGS.map((s) => entry(`/legal/${s}`, findPage(s)?.updated)),
  ];
}
