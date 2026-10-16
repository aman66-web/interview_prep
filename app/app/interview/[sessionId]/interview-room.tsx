"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { bareField, fieldShell, noOutline } from "@/components/app/field";
import { StageBar } from "@/components/app/stage-bar";
import { useVoiceMode, VoiceControls } from "@/components/app/voice-mode";
import { Chart } from "@/components/chart";
import { ExhibitTable } from "@/components/exhibit-table";
import { exhibitChartSpec } from "@/components/practice/exhibit-chart";
import { Alert, ArrowLeft, ArrowRight, Calculator as CalculatorIcon, ChartBars, Clock, Flag, Info, Notes, Send, Sparkle } from "@/components/ui/icons";
import { evaluate } from "@/lib/content/expr";
import { useSessionText } from "@/lib/client/use-session-storage";
import { type Stage } from "@/lib/ai/stages";
import { cn } from "@/lib/ui/cn";

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

const TAB_ICONS: Record<Tab, ReactNode> = {
  Exhibits: <ChartBars size={15} />,
  Notes: <Notes size={15} />,
  Calculator: <CalculatorIcon size={15} />,
  Timer: <Clock size={15} />,
};

/** Seconds since `startedAt`, ticking once a second. 0 on the server and the first render, so they agree. */
function useElapsedSeconds(startedAt: string) {
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
  return now === null ? 0 : Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function InterviewRoom({
  sessionId,
  caseTitle,
  caseType,
  estMinutes,
  startedAt,
  initialMessages,
  initialStage,
  initialTurns,
  turnsMax,
  maxChars,
  initialExhibits,
}: {
  sessionId: string;
  caseTitle: string;
  caseType: string;
  estMinutes: number;
  startedAt: string;
  initialMessages: Message[];
  initialStage: Stage;
  initialTurns: number;
  turnsMax: number;
  maxChars: number;
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
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeIsExhibit, setNoticeIsExhibit] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [tab, setTab] = useState<Tab>("Exhibits");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const keepGoingRef = useRef<HTMLButtonElement>(null);
  const elapsed = useElapsedSeconds(startedAt);

  // Voice mode (off until the candidate switches it on). What they say fills the reply box and
  // is sent through send() below, exactly like a typed answer, so every limit still applies.
  const voice = useVoiceMode({
    maxChars,
    onTranscript: setInput,
    onSubmit: (text) => {
      if (stage === "debrief") return "refused";
      if (busy) return "busy";
      void send("message", text, text);
      return "sent";
    },
    startContext: () => {
      const last = messages.at(-1);
      return { prefix: input, readAloud: !busy && last?.role === "assistant" ? last.content : "" };
    },
  });

  // Keep the newest message in view, inside the conversation panel (the page itself does not jump).
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, draft, busy]);

  // The reply box grows with what is typed, up to a limit (smaller on short laptop screens,
  // so Send stays in view), then scrolls.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const cap = Math.max(96, Math.min(240, Math.round(window.innerHeight * 0.25)));
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, cap)}px`;
  }, [input]);

  // When "Finish now" turns into the confirmation, move focus to it (the button that was focused has gone).
  useEffect(() => {
    if (confirmFinish) keepGoingRef.current?.focus();
  }, [confirmFinish]);

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
    setScoring(action === "finish");
    setError(null);
    setNotice(null);
    setNoticeIsExhibit(false);
    setConfirmFinish(false);
    voice.turnStarted();
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
          voice.replyDelta(event.text);
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
          if (event.finished) {
            voice.stop();
            router.push(`/app/debrief/${sessionId}`);
          } else {
            voice.replyEnded();
          }
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
        voice.turnFailed();
        setDraft("");
        if (shown) {
          setMessages((m) => (m.at(-1)?.content === shown ? m.slice(0, -1) : m));
          if (action === "message") setInput(previous || shown);
        }
      } else {
        // Normally already told by the "state" event; this covers a reply stream that ended
        // without one, so voice mode never stays on "Thinking" with the microphone open.
        voice.replyEnded();
      }
      setBusy(false);
      setScoring(false);
      // In voice mode, leave focus where it is (on a phone, focusing the box opens the keyboard).
      if (!voice.isOn()) inputRef.current?.focus();
    }
  }

  const finished = stage === "debrief";
  const canSend = !busy && !finished && input.trim().length > 0;

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.indexOf(tab);
    const next =
      e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length] : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length] : e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[tabs.length - 1] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  const chip =
    "inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-3 disabled:pointer-events-none disabled:opacity-50";

  return (
    // On laptops and desktops the room fills the screen below the sticky site header (4.75rem tall),
    // so the reply box and Send are in view without scrolling, down to about 1024 x 600. The
    // conversation and the tools scroll inside it. (The account bar is hidden here on large screens.)
    <div className="mx-auto w-full max-w-[76rem] px-3 pb-6 pt-4 sm:px-6 lg:flex lg:h-[calc(100dvh-4.75rem)] lg:min-h-[32rem] lg:flex-col lg:px-8 lg:pb-4 lg:pt-3">
      <header className="shrink-0 rounded-[1.75rem] bg-surface p-4 shadow-soft ring-1 ring-inset ring-line sm:px-6 sm:py-5 lg:py-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", finished ? "bg-subtle" : "animate-pulse bg-lime ring-2 ring-lime/30")} />
                {finished ? "Interview finished" : "Live interview"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{caseType}</span>
            </p>
            <h1 className="mt-1.5 text-xl font-medium leading-tight tracking-tight text-ink sm:text-2xl">{caseTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              title={`Time since you started (this case is written to take about ${estMinutes} minutes)`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 font-mono text-[13px] tabular-nums text-ink ring-1 ring-inset ring-line"
            >
              <Clock size={14} className="text-muted" />
              {clock(elapsed)}
            </span>
            <Link
              href="/app"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted ring-1 ring-inset ring-line transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ArrowLeft size={15} />
              Leave for now
            </Link>
          </div>
        </div>
        <StageBar stage={stage} className="mt-4 lg:mt-3" />
      </header>

      <div className="mt-3 grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
        <section
          aria-label="Conversation"
          className="flex flex-col overflow-hidden rounded-[1.75rem] bg-surface shadow-soft ring-1 ring-inset ring-line lg:min-h-0 lg:overflow-y-auto"
        >
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="max-h-[62vh] min-h-[18rem] flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:max-h-none lg:min-h-0"
          >
            {messages.map((m, i) => (
              <Bubble key={i} who={m.role}>
                {m.content}
              </Bubble>
            ))}
            {busy && !draft ? (
              <div className="flex gap-3">
                <Avatar />
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-subtle">Interviewer</p>
                  <p aria-live="polite" className="inline-flex items-center gap-2.5 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-sm text-muted ring-1 ring-inset ring-line">
                    <span aria-hidden="true" className="flex items-center gap-1">
                      <span className="size-1.5 animate-pulse rounded-full bg-subtle" />
                      <span className="size-1.5 animate-pulse rounded-full bg-subtle [animation-delay:150ms]" />
                      <span className="size-1.5 animate-pulse rounded-full bg-subtle [animation-delay:300ms]" />
                    </span>
                    {scoring ? "Scoring your interview. This takes a few seconds…" : "The interviewer is thinking…"}
                  </p>
                </div>
              </div>
            ) : null}
            {draft ? (
              <Bubble who="assistant" streaming>
                {draft}
              </Bubble>
            ) : null}
          </div>

          {notice || error ? (
            <div className="space-y-2 px-3 pt-3 sm:px-4">
              {notice ? (
                <p role="status" className="flex items-start gap-2.5 rounded-2xl bg-sky px-4 py-3 text-sm text-ink">
                  <Info size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span>
                    {notice}
                    {noticeIsExhibit ? (
                      <>
                        {" "}
                        <a href="#tools" className="font-medium underline underline-offset-4 lg:hidden">
                          Jump to the exhibit
                        </a>
                      </>
                    ) : null}
                  </span>
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="flex items-start gap-2.5 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-ink">
                  <Alert size={16} className="mt-0.5 shrink-0 text-danger" />
                  <span>{error}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          <form
            className="p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) void send("message", input.trim(), input.trim());
            }}
          >
            {confirmFinish ? (
              <div role="group" aria-label="Finish the interview" className="mb-3 flex flex-col gap-3 rounded-2xl bg-danger-soft p-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm leading-relaxed text-ink">
                  <span className="font-semibold">Finish now?</span> The interview ends here and your debrief is scored on what you have said so far.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void send("finish", null, null)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-danger px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#0b0b0d]"
                  >
                    <Flag size={15} />
                    Yes, finish and score my interview
                  </button>
                  <button
                    ref={keepGoingRef}
                    type="button"
                    onClick={() => setConfirmFinish(false)}
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface"
                  >
                    Keep going
                  </button>
                </div>
              </div>
            ) : null}

            <VoiceControls voice={voice} disabled={busy || finished} draft={input} />

            <div className="rounded-[1.4rem] bg-surface-2 ring-1 ring-inset ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand">
              <div className="flex items-center justify-between gap-3 px-4 pt-3">
                <label htmlFor="reply" className="text-xs font-medium text-muted">
                  Your reply
                </label>
                <span aria-hidden="true" className={cn("font-mono text-[11px] tabular-nums", input.length > maxChars * 0.9 ? "text-warning" : "text-subtle")}>
                  {input.length.toLocaleString("en-US")} / {maxChars.toLocaleString("en-US")}
                </span>
              </div>
              <textarea
                id="reply"
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  voice.userTyped(); // typing pauses listening, so the typing is not overwritten
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSend) {
                    e.preventDefault();
                    void send("message", input.trim(), input.trim());
                  }
                }}
                rows={2}
                maxLength={maxChars}
                disabled={busy || finished}
                aria-describedby="reply-help"
                style={noOutline}
                placeholder={
                  finished ? "This interview has finished." : voice.phase === "listening" ? "Listening… say your answer out loud" : "Answer as you would out loud…"
                }
                className="block max-h-60 min-h-[3.5rem] w-full resize-none bg-transparent px-4 pb-2 pt-1.5 text-[15px] leading-relaxed text-ink placeholder:text-subtle disabled:opacity-60"
              />
              <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2">
                <button type="button" disabled={busy || finished} onClick={() => void send("message", ASK_DATA_TEXT, ASK_DATA_TEXT)} className={chip}>
                  <ChartBars size={15} />
                  Ask for data
                </button>
                <button type="button" disabled={busy || finished} onClick={() => void send("advance", null, MOVE_ON_TEXT)} className={chip}>
                  <ArrowRight size={15} />
                  Move to next stage
                </button>
                {confirmFinish ? null : (
                  <button type="button" disabled={busy || finished} onClick={() => setConfirmFinish(true)} className={chip}>
                    <Flag size={15} />
                    Finish now
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!canSend}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-ink pl-4 pr-1.5 text-sm font-medium text-ink-contrast shadow-soft transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Send"}
                  <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-lime text-lime-ink">
                    <Send size={14} />
                  </span>
                </button>
              </div>
            </div>
            <p id="reply-help" className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-xs text-muted">
              <span>
                Press{" "}
                <kbd className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink ring-1 ring-inset ring-line">Ctrl</kbd> +{" "}
                <kbd className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink ring-1 ring-inset ring-line">Enter</kbd> (or Command + Enter) to send.
              </span>
              <span className="font-mono tabular-nums">
                Turn {Math.min(turns + 1, turnsMax)} of {turnsMax}
              </span>
            </p>
          </form>
        </section>

        <aside
          id="tools"
          aria-label="Tools"
          className="flex scroll-mt-24 flex-col overflow-hidden rounded-[1.75rem] bg-surface shadow-soft ring-1 ring-inset ring-line lg:min-h-0"
        >
          <div role="tablist" aria-label="Tools" onKeyDown={onTabKey} className="m-2 grid grid-cols-4 gap-1 rounded-full bg-surface-2 p-1 ring-1 ring-inset ring-line">
            {tabs.map((name) => {
              const selected = tab === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  id={`tab-${name}`}
                  aria-selected={selected}
                  aria-controls={`panel-${name}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(name)}
                  className={cn(
                    "relative inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full px-1 text-[13px] font-medium transition-colors",
                    selected ? "bg-ink text-ink-contrast shadow-soft" : "text-muted hover:text-ink",
                  )}
                >
                  <span className="hidden sm:block lg:hidden xl:block">{TAB_ICONS[name]}</span>
                  <span className="truncate">{name}</span>
                  {name === "Exhibits" && exhibits.length > 0 ? (
                    <span
                      className={cn(
                        "grid size-[18px] shrink-0 place-items-center rounded-full font-mono text-[10px]",
                        selected ? "bg-lime text-lime-ink" : "bg-ink text-ink-contrast",
                      )}
                    >
                      {exhibits.length}
                      <span className="sr-only"> shared</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {/* Every panel stays in the page and only the selected one shows, so switching tabs never
              loses the calculator's sum, and every tab's aria-controls points at a real panel. */}
          {tabs.map((name) => (
            <div
              key={name}
              role="tabpanel"
              id={`panel-${name}`}
              aria-labelledby={`tab-${name}`}
              tabIndex={0}
              hidden={tab !== name}
              className="min-h-[16rem] flex-1 overflow-y-auto px-4 pb-5 pt-2 focus-visible:outline-offset-[-4px] sm:px-5 lg:min-h-0"
            >
              {name === "Exhibits" ? <ExhibitsPanel exhibits={exhibits} /> : null}
              {name === "Notes" ? <NotesPanel sessionId={sessionId} /> : null}
              {name === "Calculator" ? <Calculator /> : null}
              {name === "Timer" ? <Timer seconds={elapsed} estMinutes={estMinutes} /> : null}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <span aria-hidden="true" className="mt-5 grid size-8 shrink-0 place-items-center rounded-full bg-night text-lime ring-1 ring-inset ring-white/10">
      <Sparkle size={15} />
    </span>
  );
}

function Bubble({ who, streaming = false, children }: { who: "user" | "assistant"; streaming?: boolean; children: ReactNode }) {
  const you = who === "user";
  return (
    <div className={cn("flex gap-3", you ? "justify-end" : "justify-start")}>
      {you ? null : <Avatar />}
      <div className={cn("flex min-w-0 max-w-[88%] flex-col sm:max-w-[78%]", you ? "items-end" : "items-start")}>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-subtle">{you ? "You" : "Interviewer"}</p>
        <p
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            you ? "rounded-tr-md bg-ink text-ink-contrast" : "rounded-tl-md bg-surface-2 text-ink ring-1 ring-inset ring-line",
          )}
        >
          {children}
          {streaming ? <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] animate-pulse bg-ink/60" /> : null}
        </p>
      </div>
    </div>
  );
}

function ExhibitsPanel({ exhibits }: { exhibits: Exhibit[] }) {
  if (exhibits.length === 0) {
    return (
      <div className="flex h-full min-h-[14rem] flex-col items-center justify-center rounded-[1.5rem] bg-surface-2 p-6 text-center ring-1 ring-inset ring-line">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-surface text-ink ring-1 ring-inset ring-line">
          <ChartBars size={22} />
        </span>
        <p className="mt-4 font-medium text-ink">No exhibits yet</p>
        <p className="mt-1 max-w-[18rem] text-sm leading-relaxed text-muted">
          The interviewer shares exhibits during the analysis, when you ask for data or as the case moves on. They appear here.
        </p>
      </div>
    );
  }
  // Newest first, so the exhibit just shared is the one in view.
  const ordered = exhibits.map((e, i) => ({ e, n: i + 1 })).reverse();
  return (
    <div className="space-y-5">
      {ordered.map(({ e, n }) => {
        const spec = exhibitChartSpec(e);
        return (
          <section key={e.id} aria-label={`Exhibit ${n}`}>
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Exhibit {n}
              {n === exhibits.length && exhibits.length > 1 ? <span className="rounded-full bg-lime px-2 py-0.5 font-sans text-[10px] normal-case tracking-normal text-lime-ink">Newest</span> : null}
            </p>
            {spec ? (
              <>
                <h3 className="mt-2 text-sm font-medium leading-snug text-ink">{e.title}</h3>
                <Chart spec={spec} />
              </>
            ) : (
              <ExhibitTable title={e.title} columns={e.columns} rows={e.rows} />
            )}
          </section>
        );
      })}
    </div>
  );
}

function NotesPanel({ sessionId }: { sessionId: string }) {
  const [notes, setNotes] = useSessionText(`interview-notes:${sessionId}`);
  return (
    <div className="flex h-full flex-col">
      <label htmlFor="notes" className="text-sm font-medium text-ink">
        Your notes
      </label>
      <div className={cn(fieldShell, "mt-2 flex flex-1 bg-butter")}>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={12}
          placeholder={"Goal:\nStructure:\nNumbers:"}
          style={noOutline}
          className={cn(bareField, "min-h-[16rem] flex-1 resize-none p-4 font-mono text-[13px] leading-relaxed placeholder:text-ink/40")}
        />
      </div>
      <p className="mt-2 text-xs text-muted">Kept in this browser tab only. We never receive your notes.</p>
    </div>
  );
}

const SYMBOLS = [
  { show: "+", insert: "+", name: "plus" },
  { show: "−", insert: "-", name: "minus" },
  { show: "×", insert: "*", name: "times" },
  { show: "÷", insert: "/", name: "divided by" },
  { show: "^", insert: "^", name: "to the power of" },
  { show: "(", insert: "(", name: "open bracket" },
  { show: ")", insert: ")", name: "close bracket" },
] as const;

function Calculator() {
  const [expression, setExpression] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  let result: string | null = null;
  let problem: string | null = null;
  if (expression.trim()) {
    try {
      const value = evaluate(expression.replace(/[×x]/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ""));
      result = (Math.round(value * 1e8) / 1e8).toLocaleString("en-US", { maximumFractionDigits: 8 });
    } catch {
      problem = "Keep going, or check the brackets and symbols.";
    }
  }

  function insert(text: string) {
    const el = fieldRef.current;
    const start = el?.selectionStart ?? expression.length;
    const end = el?.selectionEnd ?? start;
    setExpression(expression.slice(0, start) + text + expression.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  }

  return (
    <div>
      <label htmlFor="calc" className="text-sm font-medium text-ink">
        Calculator
      </label>
      <div className={cn(fieldShell, "mt-2 bg-surface-2")}>
        <input
          id="calc"
          ref={fieldRef}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. 120 * 80 / 1000"
          style={noOutline}
          className={cn(bareField, "h-12 px-4 font-mono text-[15px]")}
        />
      </div>
      <div role="group" aria-label="Add a symbol" className="mt-2 flex flex-wrap gap-1.5">
        {SYMBOLS.map((s) => (
          <button
            key={s.name}
            type="button"
            aria-label={s.name}
            onClick={() => insert(s.insert)}
            className="grid h-9 min-w-10 place-items-center rounded-full bg-surface px-3 font-mono text-[15px] text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-3"
          >
            {s.show}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setExpression("")}
          className="h-9 rounded-full px-3 text-[13px] font-medium text-muted ring-1 ring-inset ring-line transition-colors hover:bg-surface-3 hover:text-ink"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 rounded-[1.5rem] bg-night p-5 text-on-night">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">Result</p>
        <p role="status" aria-live="polite" className="mt-1 min-h-10 break-all font-mono text-3xl tabular-nums text-white">
          {result !== null ? `= ${result}` : ""}
        </p>
        {problem ? <p className="mt-1 text-sm text-on-night-muted">{problem}</p> : null}
      </div>
      <p className="mt-3 text-sm text-muted">Use + - * / ^ and brackets. In the interview, say each step out loud too.</p>
    </div>
  );
}

function Timer({ seconds, estMinutes }: { seconds: number; estMinutes: number }) {
  const size = 200;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = Math.min(1, seconds / (estMinutes * 60));
  const over = seconds > estMinutes * 60;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="self-start text-sm font-medium text-ink">Time since you started</p>
      <div className="relative mt-5 grid place-items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * share} ${c}`}
            className={over ? "stroke-warning" : "stroke-brand"}
          />
        </svg>
        <div className="absolute text-center">
          <p className="font-mono text-4xl font-medium tabular-nums text-ink" role="timer" aria-live="off">
            {clock(seconds)}
          </p>
          <p className="mt-1 text-xs text-muted">of about {estMinutes} min</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-muted">
        This case is written to take about {estMinutes} minutes. The clock is just for your own pacing.
      </p>
    </div>
  );
}
