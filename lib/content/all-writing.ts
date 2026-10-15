// Every written page (guides, firm guides, about/FAQ/legal pages and the glossary),
// imported directly so it is bundled into the app (no file reading at run time).
// When you add a file to content/guides/, content/firms/ or content/pages/, add it
// here too: tests/content-writing.test.ts fails if a file is missing from these lists.
import bain from "@/content/firms/bain.json";
import bcg from "@/content/firms/bcg.json";
import mckinsey from "@/content/firms/mckinsey.json";
import glossaryFile from "@/content/glossary.json";
import caseInterviewMaths from "@/content/guides/case-interview-maths.json";
import growth from "@/content/guides/growth-case-interview.json";
import practiseAlone from "@/content/guides/how-to-practise-case-interviews-alone.json";
import structure from "@/content/guides/how-to-structure-a-case-interview.json";
import marketEntry from "@/content/guides/market-entry-case-interview.json";
import marketSizing from "@/content/guides/market-sizing-case-interview.json";
import mergers from "@/content/guides/mergers-and-acquisitions-case-interview.json";
import operations from "@/content/guides/operations-case-interview.json";
import pricing from "@/content/guides/pricing-case-interview.json";
import profitability from "@/content/guides/profitability-case-interview.json";
import about from "@/content/pages/about.json";
import disclaimer from "@/content/pages/disclaimer.json";
import faq from "@/content/pages/faq.json";
import privacy from "@/content/pages/privacy.json";
import refunds from "@/content/pages/refunds.json";
import terms from "@/content/pages/terms.json";

/** In the order /guides lists them: the case types first (most common first), then the skills. */
export const rawGuides: unknown[] = [
  profitability,
  marketEntry,
  marketSizing,
  mergers,
  pricing,
  growth,
  operations,
  structure,
  caseInterviewMaths,
  practiseAlone,
];

/** In the order /guides lists them. */
export const rawFirms: unknown[] = [bain, bcg, mckinsey];

export const rawPages: unknown[] = [about, faq, terms, privacy, refunds, disclaimer];

export const rawGlossary: unknown = glossaryFile;
