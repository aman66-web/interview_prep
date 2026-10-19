import { MarketSizingCalculator } from "@/components/tools/market-sizing-calculator";
import { ToolPage, toolMetadata } from "@/components/tools/tool-page";
import type { FaqItem } from "@/components/ui/faq";
import { SIZING_EXAMPLE as EX } from "@/lib/tools/examples";
import { formatCompact, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/tools/format";
import { sizeMarket } from "@/lib/tools/market-sizing";

const SLUG = "market-sizing-calculator";
export const metadata = toolMetadata(SLUG);

const FAQ: FaqItem[] = [
  {
    q: "Top-down or bottom-up: which should I use?",
    a: "Top-down starts from a big number, such as a population, and narrows it with shares and rates, the way this calculator works. Bottom-up starts from one unit, such as one shop's sales, and scales it up. Both are fine. Use whichever the case gives you data for, and if you have time, sense-check one with the other.",
  },
  {
    q: "How precise should a market sizing answer be?",
    a: "Round your assumptions so the maths stays easy to do in your head, and aim for the right order of magnitude rather than an exact figure. What you need to defend is the chain: every step should be a number you can explain in a sentence.",
  },
  {
    q: "Why do some assumptions move the answer more than others?",
    a: "Because the steps multiply, a 10% change in any one of them moves the answer by about 10%. What differs is how unsure you are: a population figure might be off by 5%, a guess about how often people buy might be off by 50%. Dividing steps are also lopsided: guessing a replacement cycle 40% too short raises the answer by two thirds, while guessing it 40% too long lowers it by under a third.",
  },
  {
    q: "What does \"could be off by\" mean?",
    a: "It is your own guess at how far each assumption might be from the truth. The calculator moves each one to the bottom and the top of that range, keeping the others fixed, and shows the answer at both ends. That is a simple sensitivity check, often drawn as a tornado chart, and it tells you which assumption to check first or to ask the interviewer about.",
  },
];

export default function MarketSizingPage() {
  const r = sizeMarket(EX);
  if (!r.ok || r.marketValue === null || r.mostSensitive === null) throw new Error("The market sizing worked example is broken.");
  const top = r.sensitivity[r.mostSensitive];
  const money = (n: number) => formatMoneyCompact(n, EX.currency);
  const rows = r.chain.slice(1);

  return (
    <ToolPage
      slug={SLUG}
      title={
        <>
          Market sizing <span className="serif-accent">calculator</span>
        </>
      }
      intro="Build a top-down estimate one step at a time, name each assumption, and see which one moves the answer most."
      how={
        <>
          <p>
            A top-down estimate is a <strong>chain</strong>. You start from a number you can stand behind, such as the people in a country, then narrow it
            with <strong>shares</strong> (the 20% who ride a bike), scale it with <strong>numbers</strong> (two purchases a year) or{" "}
            <strong>divide</strong> it (a helmet lasts five years, so a fifth of owners buy one each year). Multiply by an <strong>average price</strong>{" "}
            to turn units into money.
          </p>
          <p>
            Give each assumption a range for how far off it could be. The calculator then moves each one to the bottom and top of its range, one at a time,
            and shows the answer at both ends. The assumption with the <strong>widest swing</strong> is the one the answer depends on most.
          </p>
          <p>You can type big numbers in short form: 50m, 1.2bn and 250k all work.</p>
        </>
      }
      formulas={[
        { name: "Market size (units)", formula: "start × step 1 × step 2 × …   (a ÷ step divides)" },
        { name: "A share step", formula: "running total × share ÷ 100" },
        { name: "Market value", formula: "market size × average price" },
        { name: "Sensitivity of one assumption", formula: "answer with it at the top of its range − answer with it at the bottom" },
      ]}
      example={{
        title: EX.title,
        intro: (
          <p>
            How many bike helmets are sold each year in an invented country of {formatCompact(EX.start.value)} people, and what are they worth?
          </p>
        ),
        steps: [
          { label: EX.start.label, working: `${formatNumber(EX.start.value)} people` },
          ...rows.map((row) => ({
            label: row.label,
            working: `${row.op === "divide" ? "÷" : "×"} ${row.op === "percent" ? `${formatNumber(row.value)}%` : formatNumber(row.value)} = ${formatNumber(row.runningTotal)}`,
          })),
          { label: "Average price", working: `${formatNumber(r.units)} × ${EX.currency}${formatNumber(EX.price!.value)} = ${money(r.marketValue)} a year` },
          {
            label: `Most sensitive: ${top.label.toLowerCase()} (±${top.rangePct}%)`,
            working: `${money(top.low)} to ${money(top.high)}, a swing of ${formatPercent(top.swingPct, 0)}`,
          },
        ],
        conclusion: `About ${formatCompact(r.units)} ${EX.unitLabel}, worth ${money(r.marketValue)}. The answer leans hardest on ${top.label.toLowerCase()}, so that is the assumption to check first, or to ask the interviewer about.`,
      }}
      faq={FAQ}
    >
      <MarketSizingCalculator />
    </ToolPage>
  );
}
