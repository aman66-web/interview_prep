// Every case file, imported directly so it is bundled into the app (no file
// reading at run time). When you add a file to content/cases/, add it here too:
// tests/content-library.test.ts fails if a file is missing from this list.
import aurora from "@/content/cases/aurora-kitchen-uk-entry.json";
import evChargers from "@/content/cases/city-ev-chargers.json";
import flexora from "@/content/cases/flexora-gym-software-pricing.json";
import harbourline from "@/content/cases/harbourline-bakeries.json";
import lumen from "@/content/cases/lumen-tutoring-growth.json";

export const rawCases: unknown[] = [harbourline, aurora, evChargers, flexora, lumen];
