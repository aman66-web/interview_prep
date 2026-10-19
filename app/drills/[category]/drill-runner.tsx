"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Chart } from "@/components/chart";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, Bolt, Check, Cross, Lock } from "@/components/ui/icons";
import { useSessionNumber } from "@/lib/client/use-session-storage";
import type { PublicDrill } from "@/lib/drills/types";
import { cn } from "@/lib/ui/cn";
import { checkDrill, type CheckDrillResult } from "../actions";

// One drill at a time: type an answer (or pick an option), press Enter, get instant
// feedback with the worked explanation, then Next. Answers are checked on the server
// (../actions.ts); this component only ever sees the public view of each drill.

const LETTERS = "ABCDEFGH";

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
  // This visit only (kept in memory, never stored): right answers, attempts and the current run of right answers.
  const [score, setScore] = useState({ correct: 0, answered: 0, streak: 0, best: 0 });
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const focusAfterNext = useRef(false);

  // Start the timer for the drill on screen, and after "Next" put the cursor in the answer box.
  useEffect(() => {
    startedAt.current = Date.now();
    if (focusAfterNext.current) {
      focusAfterNext.current = false;
      bodyRef.current?.querySelector<HTMLElement>("#answer, input[name='choice'], [data-autofocus]")?.focus();
    }
  }, [index]);

  const drill = drills[index];
  const gated = signedIn === false && anonymousCount >= anonymousLimit;
  const answered = result?.status === "checked";
  const checked = result?.status === "checked" ? result : null;

  // After a check, focus "Next drill" so Enter moves on; a limit message takes focus itself.
  useEffect(() => {
    if (result?.status === "checked") document.getElementById("next-drill")?.focus();
    else if (result?.status === "limit") resultRef.current?.focus();
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
        setScore((s) => {
          const streak = outcome.correct ? s.streak + 1 : 0;
          return { correct: s.correct + (outcome.correct ? 1 : 0), answered: s.answered + 1, streak, best: Math.max(s.best, streak) };
        });
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
    focusAfterNext.current = true;
    setIndexOverride(nextIndex);
    setStoredIndex(nextIndex);
    setValue("");
    setResult(null);
  }

  const progress = ((index + 1) / drills.length) * 100;
  const anonymousLeft = Math.max(0, anonymousLimit - anonymousCount);

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-surface shadow-soft ring-1 ring-inset ring-line">
      {/* Progress and this visit's score */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pb-4 pt-5 sm:px-8">
        <p className="text-sm font-medium text-ink tabular-nums" aria-live="polite">
          Drill {index + 1} of {drills.length}
        </p>
        <div className="flex items-center gap-2 text-sm">
          {score.streak >= 2 ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-lime px-3 font-medium text-lime-ink">
              <Bolt size={14} />
              {score.streak} in a row
            </span>
          ) : null}
          {score.answered > 0 ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 tabular-nums text-ink ring-1 ring-inset ring-line">
              <span className="font-semibold">{score.correct}</span>
              <span className="text-muted">
                of {score.answered} right<span className="sr-only"> this session</span>
              </span>
            </span>
          ) : null}
        </div>
      </div>
      <div aria-hidden="true" className="h-1 bg-surface-3">
        <div className="h-full rounded-r-full bg-gradient-to-r from-brand to-brand-2 transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div ref={bodyRef} className="p-5 sm:p-8">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{drill.title}</h2>
        <p className="mt-3 text-lg font-medium leading-snug tracking-tight text-ink sm:text-[1.65rem] sm:leading-[1.3]">{drill.prompt}</p>
        {drill.chart ? <Chart spec={drill.chart} /> : null}

        {gated ? (
          <div role="alert" className="mt-6 rounded-[1.5rem] bg-lavender p-5 sm:p-6">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-surface text-ink ring-1 ring-inset ring-line">
              <Lock size={18} />
            </span>
            <p className="mt-4 text-lg font-medium text-ink">Create a free account to keep practising.</p>
            <p className="mt-1.5 leading-relaxed text-ink/75">
              You&rsquo;ve tried {anonymousLimit} drills without an account. A free account gives you {dailyLimit} drills a
              day and keeps your history. No card needed.
            </p>
            <ButtonLink href="/login?next=/drills" arrow className="mt-5" data-autofocus>
              Start free
            </ButtonLink>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6" noValidate>
            {drill.kind === "choice" ? (
              <fieldset disabled={answered || pending}>
                <legend className="text-sm font-medium text-ink">Choose one answer</legend>
                <div className="mt-3 grid gap-2.5">
                  {drill.options.map((option, i) => {
                    const chosen = value === String(i);
                    const right = checked !== null && option === checked.correctAnswer;
                    const wrongChoice = checked !== null && chosen && !checked.correct;
                    return (
                      <label
                        key={option}
                        className={cn(
                          "flex cursor-pointer items-start gap-3.5 rounded-2xl p-4 ring-inset transition-[background-color,box-shadow]",
                          right
                            ? "bg-success-soft ring-1 ring-success/40"
                            : wrongChoice
                              ? "bg-danger-soft ring-1 ring-danger/40"
                              : chosen
                                ? "bg-brand-soft ring-2 ring-brand"
                                : "bg-surface ring-1 ring-line hover:bg-surface-2 hover:ring-line-strong",
                          (answered || pending) && "cursor-default",
                          answered && !right && !wrongChoice && "opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          name="choice"
                          value={String(i)}
                          checked={chosen}
                          onChange={() => setValue(String(i))}
                          className="mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full bg-surface ring-1 ring-inset ring-line-strong transition-shadow checked:ring-[6px] checked:ring-brand disabled:cursor-default"
                        />
                        <span aria-hidden="true" className="mt-px font-mono text-xs font-medium text-subtle">
                          {LETTERS[i]}
                        </span>
                        <span className="flex-1 leading-snug text-ink">{option}</span>
                        {right ? <Check size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-success" /> : null}
                        {wrongChoice ? <Cross size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-danger" /> : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-ink">
                  Your answer{drill.unit ? ` (${drill.unit})` : ""}
                </label>
                <div
                  className={cn(
                    "mt-2 flex h-14 w-full items-stretch overflow-hidden rounded-2xl bg-surface-2 ring-inset transition-shadow sm:max-w-sm",
                    checked
                      ? checked.correct
                        ? "ring-2 ring-success/60"
                        : "ring-2 ring-danger/60"
                      : "ring-1 ring-line focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand",
                  )}
                >
                  <input
                    id="answer"
                    name="answer"
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={answered || pending}
                    aria-describedby="answer-help"
                    className="min-w-0 flex-1 bg-transparent px-4 font-mono text-xl tabular-nums text-ink outline-none placeholder:text-subtle focus-visible:outline-none disabled:opacity-80"
                  />
                  {drill.unit ? (
                    <span aria-hidden="true" className="flex items-center border-l border-line px-4 text-sm text-muted">
                      {drill.unit}
                    </span>
                  ) : null}
                </div>
                <p id="answer-help" className="mt-2 text-xs text-subtle">
                  {drill.kind === "estimate" ? "A sensible estimate counts. " : ""}Press Enter to check.
                </p>
              </div>
            )}

            {!answered ? (
              <Button type="submit" size="lg" disabled={pending} className="mt-5 w-full sm:w-auto">
                {pending ? "Checking…" : "Check answer"}
              </Button>
            ) : null}
          </form>
        )}

        <div ref={resultRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
          {result?.status === "invalid" || result?.status === "error" ? (
            <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
              <Alert size={18} className="mt-px shrink-0" />
              <span>{result.message}</span>
            </p>
          ) : null}

          {result?.status === "limit" ? (
            <div className="mt-6 rounded-[1.5rem] bg-warning-soft p-5 sm:p-6">
              <p className="text-lg font-medium text-ink">You&rsquo;ve used today&rsquo;s {result.limit} free drills.</p>
              <p className="mt-1.5 text-ink/75">Come back tomorrow, or see what the paid plans include.</p>
              <ButtonLink href="/pricing" variant="secondary" arrow className="mt-5">
                See plans
              </ButtonLink>
            </div>
          ) : null}

          {checked ? (
            <div
              className={cn(
                "mt-6 rounded-[1.5rem] p-5 ring-1 ring-inset sm:p-6",
                checked.correct ? "bg-success-soft ring-success/25" : "bg-danger-soft ring-danger/25",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    checked.correct ? "bg-success text-surface" : "bg-danger text-surface",
                  )}
                >
                  {checked.correct ? <Check size={20} strokeWidth={2.6} /> : <Cross size={18} strokeWidth={2.6} />}
                </span>
                <p className="text-xl font-semibold tracking-tight text-ink">{checked.correct ? "Correct" : "Not quite"}</p>
              </div>
              <p className="mt-4 text-[15px] text-ink">
                <span className="text-muted">{checked.correct ? "Answer: " : "The answer is: "}</span>
                <span className="font-semibold">{checked.correctAnswer}</span>
              </p>
              <div className="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line sm:p-5">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">How to work it out</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">{checked.explanation}</p>
              </div>
              {checked.remainingToday !== null ? (
                <p className="mt-4 text-sm text-muted">{checked.remainingToday} free drills left today.</p>
              ) : null}
              {!checked.signedIn && anonymousLeft > 0 ? (
                <p className="mt-4 text-sm text-muted">
                  {anonymousLeft} more {anonymousLeft === 1 ? "try" : "tries"} without an account.{" "}
                  <Link href="/login?next=/drills" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                    Create a free account
                  </Link>{" "}
                  for {dailyLimit} a day.
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button id="next-drill" onClick={next} size="lg" arrow className="w-full sm:w-auto">
                  Next drill
                </Button>
                <span className="hidden text-xs text-subtle sm:inline">or press Enter</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
