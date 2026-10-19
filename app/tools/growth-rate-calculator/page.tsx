import { GrowthRateCalculator } from "@/components/tools/growth-rate-calculator";
import { ToolPage, toolMetadata } from "@/components/tools/tool-page";
import type { FaqItem } from "@/components/ui/faq";
import { GROWTH_EXAMPLE as EX } from "@/lib/tools/examples";
import { formatNumber, formatPercent } from "@/lib/tools/format";
import { cagr, compareDoubling, futureValue, type Outcome } from "@/lib/tools/growth";

const SLUG = "growth-rate-calculator";
export const metadata = toolMetadata(SLUG);

function must<T>(o: Outcome<T>): T {
  if (!o.ok) throw new Error(`Growth page example: ${o.message}`);
  return o.value;
}

export default function GrowthRatePage() {
  const rate = must(cagr(EX.cagr.start, EX.cagr.end, EX.cagr.years));
  const multiple = EX.cagr.end / EX.cagr.start;
  const totalGrowth = (multiple - 1) * 100;
  const naive = totalGrowth / EX.cagr.years;
  const naiveEnd = must(futureValue(EX.cagr.start, naive, EX.cagr.years));
  const future = must(futureValue(EX.future.value, EX.future.ratePct, EX.future.years));
  const d8 = must(compareDoubling(EX.doubling.ratePct));
  const d25 = must(compareDoubling(25));
  const d50 = must(compareDoubling(50));
  const halving = must(cagr(100, 50, 2));
  // The rule of 72's worst miss between 2% and 20% a year.
  const worst = Math.max(...Array.from({ length: 19 }, (_, i) => Math.abs(must(compareDoubling(i + 2)).errorPct)));

  const faq: FaqItem[] = [
    {
      q: "Why not just divide the total growth by the number of years?",
      a: `Because growth compounds: each year's growth is on top of the last. Going from ${EX.cagr.start} to ${EX.cagr.end} in ${EX.cagr.years} years is ${formatPercent(totalGrowth, 0)} growth in total, but ${formatPercent(naive, 0)} a year for ${EX.cagr.years} years would take ${EX.cagr.start} to about ${formatNumber(naiveEnd, 1)}. The steady rate that lands on ${EX.cagr.end} is about ${formatPercent(rate, 1)}.`,
    },
    {
      q: "How accurate is the rule of 72?",
      a: `Very accurate at everyday rates: at ${EX.doubling.ratePct}% it says ${formatNumber(d8.rule72, 2)} years and the exact answer is ${formatNumber(d8.exact, 2)}. Between 2% and 20% a year it is never more than ${formatPercent(Math.ceil(worst), 0)} out. It drifts at high rates: at 25% it says ${formatNumber(d25.rule72, 2)} years against an exact ${formatNumber(d25.exact, 2)}, and at 50% ${formatNumber(d50.rule72, 2)} against ${formatNumber(d50.exact, 2)}.`,
    },
    {
      q: "Can a growth rate be negative?",
      a: `Yes. If the end value is below the start value, the yearly rate is negative. Something that halves over two years shrinks by about ${formatPercent(Math.abs(halving), 1)} a year, not 25%, for the same compounding reason.`,
    },
    {
      q: "What units can I use?",
      a: "Any, as long as the start and end values use the same one: dollars, customers, stores or units sold. Years can be fractions, such as 2.5.",
    },
  ];

  return (
    <ToolPage
      slug={SLUG}
      title={
        <>
          Growth rate <span className="serif-accent">calculator</span>
        </>
      }
      intro="Work out a compound annual growth rate, what a value grows to, and how long it takes to double, with the rule of 72 beside the exact answer."
      how={
        <>
          <p>
            The <strong>compound annual growth rate</strong> (CAGR) is the single steady yearly rate that takes a start value to an end value. Real growth
            is bumpy, but CAGR lets you compare a five-year story with a three-year one on the same footing.
          </p>
          <p>
            <strong>Future value</strong> runs the other way: start from today&rsquo;s value and apply the rate once for every year. Each year grows on top
            of the last, which is why compound growth beats adding the same percentage each year.
          </p>
          <p>
            <strong>Doubling time</strong> is how many years a steady rate takes to double something. The exact answer uses logarithms; the{" "}
            <strong>rule of 72</strong> (72 divided by the rate in %) gets close enough for case maths in a second.
          </p>
        </>
      }
      formulas={[
        { name: "CAGR", formula: "(end ÷ start) ^ (1 ÷ years) − 1" },
        { name: "Future value", formula: "value × (1 + rate) ^ years" },
        { name: "Doubling time, exact", formula: "ln 2 ÷ ln(1 + rate)" },
        { name: "Doubling time, rule of 72", formula: "72 ÷ rate in %" },
      ]}
      example={{
        title: EX.cagr.title,
        intro: (
          <p>
            Revenue grew from ${EX.cagr.start} million to ${EX.cagr.end} million over {EX.cagr.years} years. What was the yearly growth rate, and what
            happens next?
          </p>
        ),
        steps: [
          { label: "Total change", working: `${EX.cagr.end} ÷ ${EX.cagr.start} = ${formatNumber(multiple, 2)} (${formatPercent(totalGrowth, 0)} in total)` },
          { label: `Spread over ${EX.cagr.years} years`, working: `${formatNumber(multiple, 2)} ^ (1 ÷ ${EX.cagr.years}) = ${formatNumber(1 + rate / 100, 4)}` },
          { label: "Growth rate (CAGR)", working: `${formatNumber(1 + rate / 100, 4)} − 1 = ${formatPercent(rate, 2)} a year` },
          { label: EX.future.title, working: `$${EX.future.value}m × ${formatNumber(1 + EX.future.ratePct / 100, 4)} ^ ${EX.future.years} = $${formatNumber(future, 1)}m` },
          { label: `Doubling time at ${EX.doubling.ratePct}%`, working: `exact ${formatNumber(d8.exact, 2)} years; rule of 72: 72 ÷ ${EX.doubling.ratePct} = ${formatNumber(d8.rule72, 2)} years` },
        ],
        conclusion: `Revenue grew about ${formatPercent(rate, 1)} a year. The trap: ${formatPercent(totalGrowth, 0)} in total divided by ${EX.cagr.years} years is ${formatPercent(naive, 0)}, which overstates it, because growth compounds.`,
      }}
      faq={faq}
    >
      <GrowthRateCalculator />
    </ToolPage>
  );
}
