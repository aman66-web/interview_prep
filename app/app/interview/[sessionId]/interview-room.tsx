"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExhibitTable } from "@/components/exhibit-table";
import { evaluate } from "@/lib/content/expr";
import { useSessionText } from "@/lib/client/use-session-storage";
import { PROGRESS_STAGES, STAGE_LABELS, type Stage } from "@/lib/ai/stages";

type Message = { role: "user" | "assistant"; content: string };
type Exhibit = { id: string; title: string; kind: "table" | "bar" | "line"; columns: string[]; rows: (string | number)[][] };

type TurnEvent =
  | { t: "delta"; text: string }
  | { t: "notice"; message: string }
  | { t: "state"; stage: Stage; turns: number; turnsMax: number; exhibits: Exhibit[]; finished: boolean }
  | { t: "error"; code: string; message: string };

const MOVE_ON_TEXT = "(I'd like to move on to the next stage.)";
const ASK_DATA_TEXT = "Could I see any data or exhibits that would help with this?";

const tabs = ["Exhibits", "Notes", "Calculator", "Timer"] as const;
type Tab = (typeof tabs)[number];

export function InterviewRoom({
  sessionId,
  caseTitle,
  startedAt,
  initialMessages,
  initialStage,
  initialTurns,
  turnsMax,
  initialExhibits,
}: {
  sessionId: string;
  caseTitle: string;
  startedAt: string;
  initialMessages: Message[];
  initialStage: Stage;
  initialTurns: number;
  turnsMax: number;
  initialExhibits: Exhibit[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [stage, setStage] = useState<Stage>(initialStage);
  const [turns, setTurns] = useState(initialTurns);
  const [exhibits, setExhibits] = useState<Exhibit[]>(initialExhibits);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeIsExhibit, setNoticeIsExhibit] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [tab, setTab] = useState<Tab>("Exhibits");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, draft]);

  // A new exhibit is the thing to look at: switch to it.
  const exhibitCount = exhibits.length;
  const lastExhibitCount = useRef(initialExhibits.length);
  useEffect(() => {
    if (exhibitCount > lastExhibitCount.current) setTab("Exhibits");
    lastExhibitCount.current = exhibitCount;
  }, [exhibitCount]);

  async function send(action: "message" | "advance" | "finish", text: string | null, shown: string | null) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setNoticeIsExhibit(false);
    setConfirmFinish(false);
    const previous = input;
    if (shown) {
      setMessages((m) => [...m, { role: "user", content: shown }]);
      setInput("");
    }

    let reply = "";
    let failed = false;
    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action, ...(text ? { message: text } : {}) }),
      });
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error((body as { error?: string } | null)?.error ?? "Something went wrong. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handle = (event: TurnEvent) => {
        if (event.t === "delta") {
          reply += event.text;
          setDraft(reply);
        } else if (event.t === "notice") {
          setNotice(event.message);
        } else if (event.t === "error") {
          failed = true;
          setError(event.message);
        } else if (event.t === "state") {
          // Copy first: React runs the updater later, after `reply` has been reset below.
          const completeReply = reply;
          if (completeReply) setMessages((m) => [...m, { role: "assistant", content: completeReply }]);
          reply = "";
          setDraft("");
          setStage(event.stage);
          setTurns(event.turns);
          if (event.exhibits.length > exhibits.length) {
            setNotice("The interviewer shared an exhibit. It is in the Exhibits tab.");
            setNoticeIsExhibit(true);
          }
          setExhibits(event.exhibits);
          if (event.finished) router.push(`/app/debrief/${sessionId}`);
        }
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (line) handle(JSON.parse(line) as TurnEvent);
          newline = buffer.indexOf("\n");
        }
      }
    } catch (e) {
      failed = true;
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      if (failed) {
        // The turn was not saved: take back the message so the candidate can send it again.
        setDraft("");
        if (shown) {
          setMessages((m) => (m.at(-1)?.content === shown ? m.slice(0, -1) : m));
          if (action === "message") setInput(previous || shown);
        }
      }
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const finished = stage === "debrief";
  const canSend = !busy && !finished && input.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{caseTitle}</h1>
        <nav aria-label="Interview progress" className="mt-3">
          <ol className="flex flex-wrap gap-x-1 gap-y-1 text-sm">
            {PROGRESS_STAGES.map((s, i) => {
              const current = s === stage || (stage === "intro" && s === "clarifying");
              const done = PROGRESS_STAGES.indexOf(stage === "intro" ? "clarifying" : stage) > i || stage === "debrief";
              return (
                <li key={s} aria-current={current ? "step" : undefined} className="flex items-center gap-1">
                  <span
                    className={`rounded-full border px-3 py-1 ${current ? "border-accent bg-accent text-accent-foreground" : done ? "border-border text-foreground" : "border-border text-muted"}`}
                  >
                    {done ? "✓ " : ""}
                    {STAGE_LABELS[s]}
                  </span>
                  {i < PROGRESS_STAGES.length - 1 ? <span aria-hidden="true" className="text-muted">&rarr;</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Conversation" className="flex min-h-[28rem] flex-col">
          <div role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-4 overflow-y-auto rounded-md border border-border p-4 lg:max-h-[32rem]">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-6 sm:ml-16" : "mr-6 sm:mr-16"}>
                <p className="text-xs font-medium text-muted">{m.role === "user" ? "You" : "Interviewer"}</p>
                <p className={`mt-1 whitespace-pre-wrap rounded-md p-3 ${m.role === "user" ? "bg-accent text-accent-foreground" : "border border-border"}`}>{m.content}</p>
              </div>
            ))}
            {busy && !draft ? (
              <p className="mr-6 text-sm text-muted sm:mr-16" aria-live="polite">
                The interviewer is thinking…
              </p>
            ) : null}
            {draft ? (
              <div className="mr-6 sm:mr-16">
                <p className="text-xs font-medium text-muted">Interviewer</p>
                <p className="mt-1 whitespace-pre-wrap rounded-md border border-border p-3">{draft}</p>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {notice ? (
            <p role="status" className="mt-3 rounded-md border border-border p-3 text-sm">
              {notice}
              {noticeIsExhibit ? (
                <>
                  {" "}
                  <a href="#tools" className="underline lg:hidden">
                    Jump to the exhibit
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          {error ? <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) void send("message", input.trim(), input.trim());
            }}
          >
            <label htmlFor="reply" className="block text-sm font-medium">
              Your reply
            </label>
            <textarea
              id="reply"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSend) {
                  e.preventDefault();
                  void send("message", input.trim(), input.trim());
                }
              }}
              rows={4}
              maxLength={2000}
              disabled={busy || finished}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-base"
            />
            <p className="mt-1 text-xs text-muted">Press Ctrl+Enter (or Command+Enter) to send. Turn {Math.min(turns + 1, turnsMax)} of {turnsMax}.</p>

            <div className="mt-3 flex flex-wrap gap-3">
              <button type="submit" disabled={!canSend} className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground disabled:opacity-60">
                {busy ? "Sending…" : "Send"}
              </button>
              <button
                type="button"
                disabled={busy || finished}
                onClick={() => void send("message", ASK_DATA_TEXT, ASK_DATA_TEXT)}
                className="rounded-md border border-border px-4 py-2.5 disabled:opacity-60"
              >
                Ask for data
              </button>
              <button
                type="button"
                disabled={busy || finished}
                onClick={() => void send("advance", null, MOVE_ON_TEXT)}
                className="rounded-md border border-border px-4 py-2.5 disabled:opacity-60"
              >
                Move to next stage
              </button>
              {confirmFinish ? (
                <span className="flex flex-wrap items-center gap-2">
                  <button type="button" disabled={busy} onClick={() => void send("finish", null, null)} className="rounded-md bg-red-600 px-4 py-2.5 font-medium text-white disabled:opacity-60">
                    Yes, finish and score my interview
                  </button>
                  <button type="button" onClick={() => setConfirmFinish(false)} className="underline">
                    Keep going
                  </button>
                </span>
              ) : (
                <button type="button" disabled={busy || finished} onClick={() => setConfirmFinish(true)} className="rounded-md border border-border px-4 py-2.5 disabled:opacity-60">
                  Finish now
                </button>
              )}
            </div>
          </form>
        </section>

        <aside id="tools" aria-label="Tools" className="scroll-mt-4 rounded-md border border-border">
          <div role="tablist" aria-label="Tools" className="flex border-b border-border">
            {tabs.map((name) => (
              <button
                key={name}
                role="tab"
                id={`tab-${name}`}
                aria-selected={tab === name}
                aria-controls={`panel-${name}`}
                tabIndex={tab === name ? 0 : -1}
                onClick={() => setTab(name)}
                className={`flex-1 px-2 py-3 text-sm ${tab === name ? "border-b-2 border-accent font-semibold" : "text-muted"}`}
              >
                {name}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-4">
            {tab === "Exhibits" ? <ExhibitsPanel exhibits={exhibits} /> : null}
            {tab === "Notes" ? <NotesPanel sessionId={sessionId} /> : null}
            {tab === "Calculator" ? <Calculator /> : null}
            {tab === "Timer" ? <Timer startedAt={startedAt} /> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ExhibitsPanel({ exhibits }: { exhibits: Exhibit[] }) {
  if (exhibits.length === 0) {
    return <p className="text-sm text-muted">No exhibits yet. Ask the interviewer for data when you know what you need.</p>;
  }
  return (
    <div>
      {exhibits.map((e) => (
        <ExhibitTable key={e.id} title={e.title} columns={e.columns} rows={e.rows} />
      ))}
    </div>
  );
}

function NotesPanel({ sessionId }: { sessionId: string }) {
  const [notes, setNotes] = useSessionText(`interview-notes:${sessionId}`);
  return (
    <div>
      <label htmlFor="notes" className="block text-sm font-medium">
        Your notes
      </label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={12}
        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <p className="mt-1 text-xs text-muted">Kept in this browser tab only. We never receive your notes.</p>
    </div>
  );
}

function Calculator() {
  const [expression, setExpression] = useState("");
  let result: string | null = null;
  let problem: string | null = null;
  if (expression.trim()) {
    try {
      const value = evaluate(expression.replace(/[×x]/g, "*").replace(/÷/g, "/").replace(/,/g, ""));
      result = (Math.round(value * 1e8) / 1e8).toLocaleString("en-US", { maximumFractionDigits: 8 });
    } catch {
      problem = "Keep going, or check the brackets and symbols.";
    }
  }
  return (
    <div>
      <label htmlFor="calc" className="block text-sm font-medium">
        Calculator
      </label>
      <input
        id="calc"
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        inputMode="decimal"
        autoComplete="off"
        placeholder="e.g. 120 * 80 / 1000"
        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2"
      />
      <p className="mt-3 text-sm text-muted">Use + - * / ^ and brackets.</p>
      <p role="status" aria-live="polite" className="mt-2 text-2xl font-semibold tabular-nums">
        {result !== null ? `= ${result}` : ""}
      </p>
      {problem ? <p className="text-sm text-muted">{problem}</p> : null}
    </div>
  );
}

function Timer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);
  const seconds = now === null ? 0 : Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div>
      <p className="text-sm font-medium">Time since you started</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums" role="timer" aria-live="off">
        {mm}:{ss}
      </p>
      <p className="mt-2 text-sm text-muted">A real case interview usually lasts 25 to 40 minutes. This is just for your own pacing.</p>
    </div>
  );
}
