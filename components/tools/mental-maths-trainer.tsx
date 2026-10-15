"use client";

import { useEffect, useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Check, Clock, Cross, Refresh } from "@/components/ui/icons";
import { makeRng, type Rng } from "@/lib/drills/rng";
import { formatNumber } from "@/lib/tools/format";
import { ALL_TOPICS, checkAnswer, formatAnswer, nextQuestion, randomSeed, ROUND_LENGTHS, TOPICS, type MathsQuestion, type Topic } from "@/lib/tools/mental-maths";
import { cn } from "@/lib/ui/cn";
import { NO_OUTLINE } from "./fields";

// The mental maths trainer (/tools/mental-maths-trainer). Timed rounds of generated
// questions, checked instantly. Everything happens in this browser tab: no answers
// are sent anywhere and nothing is stored, so a reload starts afresh.

type Phase = "setup" | "running" | "done";
type Attempt = { q: MathsQuestion; given: string; correct: boolean | null; ms: number };

const lengthLabel = (s: number) => (s < 120 ? `${s} seconds` : `${s / 60} minutes`);
const clock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function MentalMathsTrainer() {
  const id = useId();
  const [phase, setPhase] = useState<Phase>("setup");
  const [length, setLength] = useState<number>(60);
  const [topics, setTopics] = useState<Topic[]>(ALL_TOPICS);
  const [question, setQuestion] = useState<MathsQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);

  const rng = useRef<Rng | null>(null);
  const asked = useRef(new Set<string>());
  const shownAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // The clock: ticks while a round runs and ends it at zero.
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) setPhase("done");
    }, 200);
    return () => clearInterval(timer);
  }, [phase, endsAt]);

  // When a round ends, move focus to the results so they are read out.
  useEffect(() => {
    if (phase === "done") doneRef.current?.focus();
  }, [phase]);

  function ask() {
    const q = nextQuestion(rng.current!, topics, asked.current);
    asked.current.add(q.prompt);
    shownAt.current = Date.now();
    setQuestion(q);
    setAnswer("");
    setInputError(null);
  }

  function start() {
    if (topics.length === 0) return;
    rng.current = makeRng(randomSeed());
    asked.current = new Set();
    setHistory([]);
    const t = Date.now();
    setEndsAt(t + length * 1000);
    setNow(t);
    ask();
    setPhase("running");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function record(correct: boolean | null) {
    if (!question) return;
    setHistory((h) => [...h, { q: question, given: answer.trim(), correct, ms: Date.now() - shownAt.current }]);
    ask();
    inputRef.current?.focus();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "running" || !question) return;
    const check = checkAnswer(question, answer);
    if (!check.valid) {
      setInputError(check.message);
      return;
    }
    record(check.correct);
  }

  function toggleTopic(topic: Topic) {
    setTopics((all) => (all.includes(topic) ? all.filter((t) => t !== topic) : ALL_TOPICS.filter((t) => t === topic || all.includes(t))));
  }

  const remaining = Math.max(0, endsAt - now);
  const right = history.filter((a) => a.correct === true).length;
  const wrong = history.filter((a) => a.correct === false).length;
  const last = history.at(-1) ?? null;

  if (phase === "setup") {
    return (
      <div className="bg-night-glow rounded-[2rem] p-6 text-on-night sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">Mental maths trainer</p>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl">
              As many as you can <span className="serif-accent text-lime">before the clock stops.</span>
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-on-night-muted">
              Type your answer and press Enter. You see straight away whether it was right, with the working. Nothing is sent or saved.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
            className="rounded-[1.5rem] bg-white/[0.05] p-5 ring-1 ring-inset ring-white/10 sm:p-6"
          >
            <fieldset>
              <legend className="text-sm font-medium text-white">Round length</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {ROUND_LENGTHS.map((s) => (
                  <label
                    key={s}
                    className="inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-sm font-medium text-on-night ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/10 has-[:checked]:bg-lime has-[:checked]:text-lime-ink has-[:checked]:ring-transparent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lime"
                  >
                    <input type="radio" name={`${id}-length`} value={s} checked={length === s} onChange={() => setLength(s)} className="sr-only" />
                    {lengthLabel(s)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-white">Topics</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {TOPICS.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/[0.06] has-[:checked]:bg-white/[0.09] has-[:checked]:ring-white/30 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lime"
                  >
                    <input type="checkbox" checked={topics.includes(t.id)} onChange={() => toggleTopic(t.id)} className="peer sr-only" />
                    <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ring-1 ring-inset ring-white/30 peer-checked:bg-lime peer-checked:text-lime-ink peer-checked:ring-transparent">
                      {topics.includes(t.id) ? <Check size={13} strokeWidth={3} /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-white">{t.label}</span>
                      <span className="block text-xs leading-snug text-on-night-muted">{t.blurb}</span>
                    </span>
                  </label>
                ))}
              </div>
              {topics.length === 0 ? (
                <p role="alert" className="mt-3 text-sm text-[#fca5a5]">
                  Choose at least one topic.
                </p>
              ) : null}
            </fieldset>
            <button type="submit" disabled={topics.length === 0} className={cn(buttonClasses({ variant: "inverse", size: "lg", arrow: true, full: true }), "mt-7")}>
              <span>Start a {lengthLabel(length).replace("seconds", "second").replace("minutes", "minute")} round</span>
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-[#0b1020] text-white">
                <Clock size={18} />
              </span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const answered = right + wrong;
    const skipped = history.length - answered;
    const accuracy = answered > 0 ? Math.round((right / answered) * 100) : 0;
    const endedEarly = remaining > 500;
    const answeredTimes = history.filter((a) => a.correct !== null).map((a) => a.ms);
    const avg = answeredTimes.length > 0 ? answeredTimes.reduce((s, ms) => s + ms, 0) / answeredTimes.length / 1000 : null;
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby={`${id}-done`} className="bg-night-glow rounded-[2rem] p-6 text-on-night sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">Round over</p>
          <h2 id={`${id}-done`} ref={doneRef} tabIndex={-1} className="mt-4 text-3xl font-medium tracking-tight text-white focus:outline-none sm:text-4xl">
            {right} right {right === 1 ? "answer" : "answers"} {endedEarly ? "before you stopped" : `in ${lengthLabel(length)}`}
          </h2>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <dt className="text-sm text-on-night-muted">Accuracy</dt>
              <dd className="mt-1 text-4xl font-medium tracking-tight text-lime tabular-nums">{answered > 0 ? `${accuracy}%` : "–"}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-night-muted">Answered</dt>
              <dd className="mt-1 text-4xl font-medium tracking-tight text-white tabular-nums">{answered}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-night-muted">Skipped</dt>
              <dd className="mt-1 text-2xl font-medium text-white tabular-nums">{skipped}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-night-muted">Average time an answer</dt>
              <dd className="mt-1 text-2xl font-medium text-white tabular-nums">{avg === null ? "–" : `${formatNumber(avg, 1)} s`}</dd>
            </div>
          </dl>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={start} className={buttonClasses({ variant: "inverse", size: "lg" })}>
              <Refresh size={18} /> Try again
            </button>
            <button type="button" onClick={() => setPhase("setup")} className={cn(buttonClasses({ variant: "ghost", size: "lg" }), "text-white hover:bg-white/10")}>
              Change length or topics
            </button>
          </div>
          <p className="mt-6 text-xs text-on-night-muted">This score stays on this page only. Nothing was sent or saved.</p>
        </section>
        <section aria-labelledby={`${id}-review`} className="rounded-[2rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-8">
          <h2 id={`${id}-review`} className="text-xl font-medium tracking-tight text-ink">
            Your answers
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 text-muted">No answers this round. Press Try again when you&rsquo;re ready.</p>
          ) : (
            <ol className="mt-5 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
              {history.map((a, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                      a.correct === true ? "bg-success-soft text-success" : a.correct === false ? "bg-danger-soft text-danger" : "bg-surface-3 text-muted",
                    )}
                  >
                    {a.correct === true ? <Check size={13} strokeWidth={3} /> : a.correct === false ? <Cross size={13} strokeWidth={3} /> : <span className="text-xs">–</span>}
                    <span className="sr-only">{a.correct === true ? "Right" : a.correct === false ? "Wrong" : "Skipped"}</span>
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="text-ink">{a.q.prompt}</p>
                    <p className="mt-1 text-muted">
                      {a.correct === null ? "Skipped." : <>You said {a.given}.</>} Answer: <span className="font-medium text-ink">{formatAnswer(a.q)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    );
  }

  // Running
  const fraction = Math.min(1, remaining / (length * 1000));
  return (
    <div className="bg-night-glow rounded-[2rem] p-5 text-on-night sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span role="timer" aria-label="Time left" className={cn("rounded-full px-4 py-2 font-mono text-2xl tabular-nums", remaining <= 10_000 ? "bg-lime text-lime-ink" : "bg-white/10 text-white")}>
            {clock(remaining)}
          </span>
          <span className="sr-only" aria-live="polite">
            {remaining <= 10_000 && remaining > 9_000 ? "10 seconds left" : ""}
          </span>
        </div>
        <p className="text-sm text-on-night-muted">
          <span className="font-medium text-white tabular-nums">{right}</span> right · <span className="tabular-nums">{wrong}</span> wrong
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-lime transition-[width] duration-200 ease-linear" style={{ width: `${fraction * 100}%` }} />
      </div>

      {question ? (
        <form onSubmit={submit} className="mx-auto mt-10 max-w-2xl sm:mt-14" noValidate>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">
            {TOPICS.find((t) => t.id === question.topic)?.label} · question {history.length + 1}
          </p>
          <p id={`${id}-q`} className="mt-4 text-center text-2xl font-medium leading-snug tracking-tight text-white sm:text-[2rem]">
            {question.prompt}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor={`${id}-answer`} className="sr-only">
              Your answer{question.unit ? ` (${question.unit === "%" ? "percent" : question.unit})` : ""}
            </label>
            <div className={cn("flex h-14 flex-1 items-center gap-2 rounded-2xl bg-white/[0.08] px-5 ring-1 ring-inset ring-white/20 focus-within:ring-2 focus-within:ring-lime", inputError && "ring-2 ring-[#fca5a5]")}>
              {question.unit === "$" || question.unit === "$ million" ? <span aria-hidden="true" className="text-lg text-on-night-muted">$</span> : null}
              <input
                id={`${id}-answer`}
                ref={inputRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (inputError) setInputError(null);
                }}
                aria-describedby={`${id}-q ${inputError ? `${id}-err` : ""}`}
                aria-invalid={inputError ? true : undefined}
                className="h-full w-full min-w-0 bg-transparent text-xl text-white tabular-nums outline-none placeholder:text-on-night-muted/60 focus-visible:outline-none"
                style={NO_OUTLINE}
                placeholder="Your answer"
              />
              {question.unit && question.unit !== "$" ? (
                <span aria-hidden="true" className="shrink-0 text-sm text-on-night-muted">
                  {question.unit === "$ million" ? "million" : question.unit}
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button type="submit" className={cn(buttonClasses({ variant: "lime", size: "lg" }), "h-14 flex-1 sm:flex-none")}>
                Check
              </button>
              <button type="button" onClick={() => record(null)} className={cn(buttonClasses({ variant: "ghost", size: "lg" }), "h-14 text-white hover:bg-white/10")}>
                Skip
              </button>
            </div>
          </div>
          {inputError ? (
            <p id={`${id}-err`} role="alert" className="mt-3 text-sm text-[#fca5a5]">
              {inputError}
            </p>
          ) : null}
          <p className="mt-3 text-center text-xs text-on-night-muted">Press Enter to check. 4m, 4 million and 4,000,000 all work.</p>
        </form>
      ) : null}

      <div aria-live="polite" aria-atomic="true" className="mx-auto mt-8 min-h-24 max-w-2xl">
        {last ? (
          <div
            className={cn(
              "rounded-2xl p-4 text-sm leading-relaxed ring-1 ring-inset",
              last.correct === true ? "bg-[#4ade80]/10 ring-[#4ade80]/30" : last.correct === false ? "bg-[#f87171]/10 ring-[#f87171]/30" : "bg-white/[0.05] ring-white/10",
            )}
          >
            <p className="font-medium text-white">
              {last.correct === true ? "Right." : last.correct === false ? `Not quite: you said ${last.given}.` : "Skipped."} The answer is {formatAnswer(last.q)}.
            </p>
            <p className="mt-1 text-on-night-muted">
              <span className="sr-only">Working for: {last.q.prompt} </span>
              {last.q.explanation}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-center">
        <button type="button" onClick={() => setPhase("done")} className="text-sm text-on-night-muted underline decoration-white/30 underline-offset-4 hover:text-white">
          End the round now
        </button>
      </div>
    </div>
  );
}
