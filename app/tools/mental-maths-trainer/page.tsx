import { MentalMathsTrainer } from "@/components/tools/mental-maths-trainer";
import { ToolPage, toolMetadata } from "@/components/tools/tool-page";
import type { FaqItem } from "@/components/ui/faq";
import { exampleQuestions, formatAnswer, TOPICS } from "@/lib/tools/mental-maths";
import { siteConfig } from "@/site.config";

const SLUG = "mental-maths-trainer";
export const metadata = toolMetadata(SLUG);

const FAQ: FaqItem[] = [
  {
    q: "How do I type big numbers and percentages?",
    a: "However you like: 4000000, 4,000,000, 4m and 4 million all count. Percentages work with or without the % sign. Where a question asks for $ million, 484 and 484m both count.",
  },
  {
    q: "How exact do my answers need to be?",
    a: "Most answers are whole numbers or simple decimals, and they must be exact. Where an answer needs rounding, such as two thirds as a percentage, anything within half a percentage point counts, so 66.7 and 67 are both right.",
  },
  {
    q: "Is my score saved?",
    a: "No. The trainer runs entirely in your browser: questions are made on your device, answers are checked there, and nothing is sent to us or stored. Reloading the page clears the round.",
  },
  {
    q: "How is this different from the drills?",
    a: `The drills are a fixed set of questions in mental maths, market sizing, frameworks and chart reading, with a worked explanation for each. A free account gives you ${siteConfig.limits.free.drillsPerDay} a day. The trainer makes new maths questions for as long as you like, against the clock, with no account.`,
  },
];

export default function MentalMathsPage() {
  const examples = exampleQuestions();
  return (
    <ToolPage
      slug={SLUG}
      title={
        <>
          Mental maths <span className="serif-accent">trainer</span>
        </>
      }
      intro="Timed rounds of the maths case interviews lean on: percentages, growth, margins, big numbers and break-even. Instant feedback, with the working."
      how={
        <>
          <p>
            Pick a round length and the topics you want. A question appears; type your answer and press Enter. You see at once whether it was right, with
            the working, and the next question is already waiting. Stuck? Skip it.
          </p>
          <p>
            When the clock stops you get your score, your <strong>accuracy</strong> (right answers out of those you answered), your average time per answer
            and every question with its answer, so you can see which kind trips you up.
          </p>
          <p>
            The questions practise {TOPICS.map((t) => t.label.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1")}. Steady beats fast: a right answer
            in 20 seconds is worth more than a wrong one in 5.
          </p>
        </>
      }
      formulas={[
        { name: "A percentage of a number", formula: "find 10% first, then scale: 15% = 10% + 5%" },
        { name: "Percentage change", formula: "(new − old) ÷ old" },
        { name: "Two years of growth", formula: "start × (1 + g) × (1 + g)" },
        { name: "Profit margin", formula: "(revenue − costs) ÷ revenue" },
        { name: "Big numbers", formula: "digits first, then count the zeros" },
        { name: "Break-even volume", formula: "fixed costs ÷ (price − variable cost)" },
        { name: "Payback", formula: "investment ÷ yearly profit" },
      ]}
      example={{
        title: "One question from each topic",
        intro: <p>Questions like these come up in every round. Each one shows the working once you answer.</p>,
        steps: examples.map((q) => ({ label: q.prompt, answer: formatAnswer(q), working: q.explanation })),
        note: "Made by the same code as the trainer, and our tests recompute every answer.",
        prose: true,
      }}
      faq={FAQ}
    >
      <MentalMathsTrainer />
    </ToolPage>
  );
}
