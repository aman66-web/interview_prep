import { BreakEvenCalculator } from "@/components/tools/break-even-calculator";
import { ToolPage, toolMetadata } from "@/components/tools/tool-page";
import type { FaqItem } from "@/components/ui/faq";
import { breakEven } from "@/lib/tools/break-even";
import { BREAK_EVEN_EXAMPLE as EX } from "@/lib/tools/examples";
import { formatMoney, formatNumber, formatPercent, formatYearsMonths } from "@/lib/tools/format";

const SLUG = "break-even-calculator";
export const metadata = toolMetadata(SLUG);

const FAQ: FaqItem[] = [
  {
    q: "What is the difference between contribution margin and profit margin?",
    a: "Contribution margin is what each sale leaves after its variable costs, as a share of the price. It ignores fixed costs. Profit margin is what is left after all costs, fixed ones included, as a share of revenue. A product can have a healthy contribution margin and still lose money if it doesn't sell enough to cover its fixed costs.",
  },
  {
    q: "Should the upfront investment be part of break-even?",
    a: "Here, break-even covers the yearly fixed costs, which is what it usually means in a case. The upfront investment is paid once, so the calculator shows it separately as payback: how many years of profit it takes to earn it back. If an interviewer wants the investment included, say which version you are using, spread the investment over the number of years they give you and add that yearly amount to the fixed costs.",
  },
  {
    q: "Why is the break-even volume rounded up?",
    a: "You can't sell part of a unit, and selling one fewer than the exact figure would still leave a small loss. So 33.3 units becomes 34. When the exact figure isn't a whole number, the calculator shows it underneath.",
  },
  {
    q: "What happens if the price is at or below the variable cost?",
    a: "Then each sale makes nothing or loses money before fixed costs are even counted, so there is no break-even point: selling more only makes the loss bigger. The calculator says so instead of showing a negative or impossible volume. The fix is a higher price or a lower variable cost.",
  },
];

export default function BreakEvenPage() {
  const r = breakEven(EX);
  if (!r.ok || !r.breaksEven || r.payback.kind !== "years" || r.profitAtExpected === null || r.marginOfSafety === null) {
    throw new Error("The break-even worked example no longer breaks even.");
  }
  const m = (n: number) => formatMoney(n);

  return (
    <ToolPage
      slug={SLUG}
      title={
        <>
          Break-even <span className="serif-accent">calculator</span>
        </>
      }
      intro="Enter fixed costs, price and variable cost to see how many units cover the costs, the revenue that takes, and how long an investment takes to pay back."
      how={
        <>
          <p>
            Every unit you sell brings in its price and costs its <strong>variable cost</strong> (ingredients, packaging, delivery). What is left is the
            unit&rsquo;s <strong>contribution</strong>: the amount it adds towards the <strong>fixed costs</strong>, such as rent and salaries, which you pay
            however much you sell.
          </p>
          <p>
            Divide the fixed costs by the contribution per unit and you get the <strong>break-even volume</strong>: the number of units at which the
            contributions exactly cover the fixed costs. Below it you make a loss; above it, every extra unit adds its full contribution to profit.
          </p>
          <p>
            With an expected volume, the calculator also shows the yearly profit, the <strong>margin of safety</strong> (how far sales could fall before a
            loss) and the <strong>payback</strong>: the upfront investment divided by the yearly profit.
          </p>
        </>
      }
      formulas={[
        { name: "Contribution per unit", formula: "price − variable cost per unit" },
        { name: "Contribution margin", formula: "contribution per unit ÷ price" },
        { name: "Break-even volume", formula: "fixed costs ÷ contribution per unit" },
        { name: "Break-even revenue", formula: "fixed costs ÷ contribution margin" },
        { name: "Profit", formula: "volume × contribution per unit − fixed costs" },
        { name: "Payback (years)", formula: "upfront investment ÷ yearly profit" },
      ]}
      example={{
        title: EX.title,
        intro: (
          <p>
            A coffee sells for {m(EX.price)} and costs {m(EX.variableCost)} to make. Rent, staff and the licence cost {m(EX.fixedCosts)} a year, setting up
            costs {m(EX.investment)}, and the owner expects to sell {formatNumber(EX.expectedVolume)} cups a year.
          </p>
        ),
        steps: [
          { label: "Contribution per cup", working: `${m(EX.price)} − ${m(EX.variableCost)} = ${m(r.contribution)}` },
          { label: "Contribution margin", working: `${m(r.contribution)} ÷ ${m(EX.price)} = ${formatPercent(r.contributionMargin * 100)}` },
          { label: "Break-even volume", working: `${m(EX.fixedCosts)} ÷ ${m(r.contribution)} = ${formatNumber(r.breakEvenUnitsWhole)} cups a year` },
          { label: "Break-even revenue", working: `${m(EX.fixedCosts)} ÷ ${formatPercent(r.contributionMargin * 100)} = ${m(r.breakEvenRevenue)}` },
          {
            label: `Profit at ${formatNumber(EX.expectedVolume)} cups`,
            working: `${formatNumber(EX.expectedVolume)} × ${m(r.contribution)} − ${m(EX.fixedCosts)} = ${m(r.profitAtExpected)}`,
          },
          { label: "Payback", working: `${m(EX.investment)} ÷ ${m(r.profitAtExpected)} = ${formatNumber(r.payback.years)} years (${formatYearsMonths(r.payback.years)})` },
        ],
        conclusion: `The kiosk needs ${formatNumber(r.breakEvenUnitsWhole)} cups a year to cover its costs. At the expected ${formatNumber(EX.expectedVolume)} it makes ${m(r.profitAtExpected)} a year and earns back its set-up cost in ${formatYearsMonths(r.payback.years)}. Sales could fall by ${formatPercent(r.marginOfSafety * 100, 0)} before it made a loss.`,
      }}
      faq={FAQ}
    >
      <BreakEvenCalculator />
    </ToolPage>
  );
}
