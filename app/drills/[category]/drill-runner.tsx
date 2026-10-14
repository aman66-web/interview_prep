"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Chart } from "@/components/chart";
import { useSessionNumber } from "@/lib/client/use-session-number";
import type { PublicDrill } from "@/lib/drills/types";
import { checkDrill, type CheckDrillResult } from "../actions";

const inputClass = "mt-1 block w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-base";
const buttonClass = "rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground disabled:opacity-60";

export function DrillRunner({
  category,
  drills,
  dailyLimit,
  anonymousLimit,
}: {
  category: string;
  drills: PublicDrill[];
  dailyLimit: number;
  anonymousLimit: number;
}) {
  // Where this tab left off, and how many drills a visitor without an account has tried.
  const [storedIndex, setStoredIndex] = useSessionNumber(`drill-position:${category}`);
  const [storedAnonymous, setStoredAnonymous] = useSessionNumber("drill-anonymous-count");
  const [indexOverride, setIndexOverride] = useState<number | null>(null);
  const [anonymousLocal, setAnonymousLocal] = useState(0);
  const index = (indexOverride ?? storedIndex) % drills.length;
  const anonymousCount = Math.max(storedAnonymous, anonymousLocal);

  const [value, setValue] = useState("");
  const [result, setResult] = useState<CheckDrillResult | null>(null);
  const [score, setScore] = useState({ correct: 0, answered: 0 });
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Start the timer for the drill on screen.
  useEffect(() => {
    startedAt.current = Date.now();
  }, [index]);

  const drill = drills[index];
  const gated = signedIn === false && anonymousCount >= anonymousLimit;
  const answered = result?.status === "checked";

  useEffect(() => {
    if (result && resultRef.current) resultRef.current.focus();
  }, [result]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || answered || gated) return;
    if (!value.trim()) {
      setResult({ status: "invalid", message: drill.kind === "choice" ? "Choose one of the options." : "Enter a number first." });
      return;
    }
    const elapsedMs = Math.min(3_600_000, Math.max(0, Date.now() - startedAt.current));
    startTransition(async () => {
      const outcome = await checkDrill({ drillId: drill.id, response: value, elapsedMs });
      setResult(outcome);
      if (outcome.status === "checked") {
        setSignedIn(outcome.signedIn);
        setScore((s) => ({ correct: s.correct + (outcome.correct ? 1 : 0), answered: s.answered + 1 }));
        if (!outcome.signedIn) {
          const nextCount = anonymousCount + 1;
          setAnonymousLocal(nextCount);
          setStoredAnonymous(nextCount);
        }
      }
    });
  }

  function next() {
    const nextIndex = (index + 1) % drills.length;
    setIndexOverride(nextIndex);
    setStoredIndex(nextIndex);
    setValue("");
    setResult(null);
  }

  const checked = result?.status === "checked" ? result : null;

  return (
    <div>
      <p className="text-sm text-muted" aria-live="polite">
        Drill {index + 1} of {drills.length}
        {score.answered > 0 ? ` · ${score.correct} of ${score.answered} right this session` : ""}
      </p>

      <h2 className="mt-2 text-lg font-semibold">{drill.title}</h2>
      <p className="mt-2 text-lg">{drill.prompt}</p>
      {drill.chart ? <Chart spec={drill.chart} /> : null}

      {gated ? (
        <div role="alert" className="mt-6 rounded-md border border-border p-4">
          <p className="font-medium">Create a free account to keep practising.</p>
          <p className="mt-1 text-muted">
            You&rsquo;ve tried {anonymousLimit} drills without an account. A free account gives you {dailyLimit} drills a
            day and keeps your history. No card needed.
          </p>
          <Link href="/login?next=/drills" className={`${buttonClass} mt-4 inline-block`}>
            Start free
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4">
          {drill.kind === "choice" ? (
            <fieldset disabled={answered || pending}>
              <legend className="text-sm font-medium">Choose one answer</legend>
              <div className="mt-2 space-y-2">
                {drill.options.map((option, i) => (
                  <label key={option} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                    <input
                      type="radio"
                      name="choice"
                      value={String(i)}
                      checked={value === String(i)}
                      onChange={() => setValue(String(i))}
                      className="mt-1"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div>
              <label htmlFor="answer" className="block text-sm font-medium">
                Your answer{drill.unit ? ` (${drill.unit})` : ""}
              </label>
              <input
                id="answer"
                name="answer"
                inputMode="decimal"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={answered || pending}
                className={inputClass}
              />
            </div>
          )}

          {!answered ? (
            <button type="submit" disabled={pending} className={`${buttonClass} mt-4`}>
              {pending ? "Checking…" : "Check answer"}
            </button>
          ) : null}
        </form>
      )}

      <div ref={resultRef} tabIndex={-1} role="status" aria-live="polite" className="mt-4 outline-none">
        {result?.status === "invalid" || result?.status === "error" ? (
          <p className="text-red-600 dark:text-red-400">{result.message}</p>
        ) : null}

        {result?.status === "limit" ? (
          <div className="rounded-md border border-border p-4">
            <p className="font-medium">You&rsquo;ve used today&rsquo;s {result.limit} free drills.</p>
            <p className="mt-1 text-muted">Come back tomorrow, or see what the paid plans include.</p>
            <Link href="/pricing" className="mt-3 inline-block underline">
              See plans
            </Link>
          </div>
        ) : null}

        {checked ? (
          <div className="rounded-md border border-border p-4">
            <p className="text-lg font-semibold">{checked.correct ? "Correct" : "Not quite"}</p>
            <p className="mt-1">
              <span className="text-muted">{checked.correct ? "Answer: " : "The answer is: "}</span>
              {checked.correctAnswer}
            </p>
            <p className="mt-2 text-muted">{checked.explanation}</p>
            {checked.remainingToday !== null ? (
              <p className="mt-2 text-sm text-muted">{checked.remainingToday} free drills left today.</p>
            ) : null}
            <button type="button" onClick={next} className={`${buttonClass} mt-4`}>
              Next drill
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
