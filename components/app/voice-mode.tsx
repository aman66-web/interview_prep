"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Pause, Play, StopCircle } from "@/components/ui/icons";
import {
  VoiceController,
  type RecognitionLike,
  type SubmitResult,
  type SynthLike,
  type UtteranceLike,
  type VoicePhase,
  type VoiceProblem,
} from "@/lib/voice/controller";
import {
  onDeviceAvailable,
  recognitionConstructor,
  recognitionLanguage,
  voiceSupport,
  type SpeechWindowLike,
  type VoiceSupport,
} from "@/lib/voice/support";
import { cn } from "@/lib/ui/cn";

// Voice mode for the interview room: the switch, the Listening / Thinking / Speaking state,
// and the glue between the room and lib/voice/controller.ts. Only the browser's own Web
// Speech API is used. We never record or keep audio: the room receives the text of the
// answer and sends it exactly as if it had been typed. Nothing is stored in the browser;
// voice mode is off whenever the page opens.

let support: VoiceSupport | null = null;
const subscribeNever = () => () => {};
function readSupport(): VoiceSupport {
  support ??= voiceSupport(window as unknown as SpeechWindowLike);
  return support;
}

const PROBLEMS: Record<VoiceProblem, string> = {
  blocked: "Voice mode needs the microphone. Allow it for this site in your browser's settings, then switch voice mode on again.",
  "no-microphone": "No microphone was found. Check that one is connected and allowed, then switch voice mode on again.",
  network: "Your browser's speech service isn't answering, so voice mode is off. Voice works in Chrome, Edge and Safari.",
  language: "Your browser can't listen in English here, so voice mode is off.",
  stopped: "Your browser keeps stopping the microphone, so voice mode is off. You can switch it on again.",
};

export type VoiceModeOptions = {
  maxChars: number;
  /** The words heard so far, for the reply box. */
  onTranscript: (text: string) => void;
  /** Send the answer as if it was typed. */
  onSubmit: (text: string) => SubmitResult;
  /** When switching on: the text already in the box, and the interviewer's latest message to read out. */
  startContext: () => { prefix: string; readAloud: string };
};

export function useVoiceMode(options: VoiceModeOptions) {
  const supported = useSyncExternalStore(subscribeNever, readSupport, () => null);
  const [phase, setPhase] = useState<VoicePhase>("off");
  const [asking, setAsking] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [problem, setProblem] = useState<VoiceProblem | null>(null);
  const [clipped, setClipped] = useState(false);
  const ctrl = useRef<VoiceController | null>(null);
  const onDevice = useRef(false);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  // Where the browser can turn speech into text on the device, use that: the audio then never
  // leaves the device. Asked once, quietly; nothing is downloaded.
  useEffect(() => {
    let live = true;
    // Chrome loads its list of voices on first request; ask now so a British voice is ready later.
    if (readSupport().supported) window.speechSynthesis.getVoices();
    void onDeviceAvailable(recognitionConstructor(window as unknown as SpeechWindowLike), recognitionLanguage(navigator.language)).then((yes) => {
      if (live) onDevice.current = yes;
    });
    return () => {
      live = false;
    };
  }, []);

  // Never leave the microphone on in a hidden tab or after leaving the page.
  useEffect(() => {
    const holder = ctrl;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") holder.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      holder.current?.stop();
    };
  }, []);

  function controller(): VoiceController | null {
    if (ctrl.current) return ctrl.current;
    const w = window as unknown as SpeechWindowLike;
    const Recognition = recognitionConstructor(w);
    if (!Recognition) return null;
    ctrl.current = new VoiceController(
      {
        createRecognition: () => new Recognition() as RecognitionLike,
        synth: window.speechSynthesis as unknown as SynthLike,
        createUtterance: (text) => new SpeechSynthesisUtterance(text) as unknown as UtteranceLike,
      },
      {
        maxChars: latest.current.maxChars,
        halfDuplex: readSupport().halfDuplex,
        listenLang: recognitionLanguage(navigator.language),
        onDevice: onDevice.current,
      },
      {
        onPhase: (p) => {
          setPhase(p);
          // The "longest answer" note belongs to the answer being spoken, not the next one.
          if (p === "thinking" || p === "off") setClipped(false);
        },
        onTranscript: (text, wasClipped) => {
          setClipped(wasClipped);
          latest.current.onTranscript(text);
        },
        onSubmit: (text) => latest.current.onSubmit(text),
        onProblem: setProblem,
      },
    );
    return ctrl.current;
  }

  /** Switch voice mode on (must run inside a click, so the browser can ask for the microphone). */
  function begin() {
    setAsking(false);
    setAgreed(true);
    setProblem(null);
    setClipped(false);
    controller()?.start(latest.current.startContext());
  }

  return {
    supported,
    phase,
    asking,
    problem,
    clipped,
    halfDuplex: supported?.halfDuplex ?? false,
    on: phase !== "off",
    toggle() {
      if (ctrl.current && ctrl.current.state !== "off") ctrl.current.stop();
      else if (agreed) begin();
      else {
        setProblem(null);
        setAsking(true);
      }
    },
    begin,
    cancel: () => setAsking(false),
    pause: () => ctrl.current?.pause(),
    resume: (prefix: string) => ctrl.current?.resume(prefix),
    stopSpeaking: () => ctrl.current?.stopSpeaking(),
    // What the room tells voice mode about each turn.
    isOn: () => (ctrl.current?.state ?? "off") !== "off",
    userTyped: () => ctrl.current?.userTyped(),
    turnStarted: () => ctrl.current?.turnStarted(),
    replyDelta: (text: string) => ctrl.current?.replyDelta(text),
    replyEnded: () => ctrl.current?.replyEnded(),
    turnFailed: () => ctrl.current?.turnFailed(),
    stop: () => ctrl.current?.stop(),
  };
}

export type VoiceMode = ReturnType<typeof useVoiceMode>;

const STATE_LABEL: Record<Exclude<VoicePhase, "off">, string> = {
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  paused: "Paused",
};

// 40px tall: the tap-target minimum in docs/DESIGN.md.
const pill =
  "inline-flex h-10 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-3 disabled:pointer-events-none disabled:opacity-50";

/** The voice mode switch, its state and its buttons, shown above the reply box. */
export function VoiceControls({ voice, disabled, draft }: { voice: VoiceMode; disabled: boolean; draft: string }) {
  const switchRef = useRef<HTMLButtonElement>(null);
  if (voice.supported === null) return null; // not known until the page runs in the browser

  if (!voice.supported.supported) {
    return (
      <p className="mb-3 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted">
        <Mic size={14} className="mt-0.5 shrink-0" />
        <span>Voice mode works in Chrome, Edge and Safari. Typing always works.</span>
      </p>
    );
  }

  const { phase, on } = voice;
  const status = phase === "off" ? null : STATE_LABEL[phase];
  // One button whose job follows the state. Keeping it the same element means keyboard focus
  // stays on it when "Pause to edit" becomes "Resume listening" (a removed button drops focus).
  const action =
    phase === "listening"
      ? { label: "Pause to edit", icon: <Pause size={15} />, onClick: voice.pause, disabled: false }
      : phase === "paused"
        ? { label: "Resume listening", icon: <Play size={15} />, onClick: () => voice.resume(draft), disabled }
        : phase === "speaking"
          ? { label: "Stop speaking", icon: <StopCircle size={15} />, onClick: voice.stopSpeaking, disabled: false }
          : null;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          ref={switchRef}
          type="button"
          role="switch"
          aria-checked={on}
          aria-describedby="voice-hint"
          disabled={disabled && !on}
          onClick={voice.toggle}
          className={cn(pill, "gap-2 pl-2", on && "bg-brand-soft text-brand-ink ring-brand/40 hover:bg-brand-soft")}
        >
          <span aria-hidden="true" className={cn("relative h-5 w-9 shrink-0 rounded-full ring-1 ring-inset transition-colors", on ? "bg-brand ring-brand" : "bg-surface-3 ring-line-strong")}>
            <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-soft transition-transform", on && "translate-x-4")} />
          </span>
          <Mic size={15} />
          Voice mode
        </button>

        <span role="status" aria-live="polite" className="inline-flex">
          {status ? (
            <span
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium ring-1 ring-inset",
                phase === "listening" && "bg-mint text-ink ring-line",
                phase === "speaking" && "bg-lavender text-ink ring-line",
                phase === "thinking" && "bg-surface-2 text-muted ring-line",
                phase === "paused" && "bg-warning-soft text-ink ring-line",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  phase === "listening" && "bg-success motion-safe:animate-pulse",
                  phase === "speaking" && "bg-brand motion-safe:animate-pulse",
                  phase === "thinking" && "bg-subtle motion-safe:animate-pulse",
                  phase === "paused" && "bg-warning",
                )}
              />
              <span className="sr-only">Voice mode: </span>
              {status}
            </span>
          ) : null}
        </span>

        {action ? (
          <button type="button" disabled={action.disabled} onClick={action.onClick} className={pill}>
            {action.icon}
            {action.label}
          </button>
        ) : null}
      </div>

      {voice.asking ? (
        <div role="group" aria-labelledby="voice-consent-title" className="rounded-2xl bg-sky p-4 text-sm leading-relaxed text-ink">
          <p id="voice-consent-title" className="font-semibold">
            Talk to the interviewer out loud
          </p>
          <p className="mt-1">
            Your browser does the listening and the speaking. Some browsers, such as Chrome, use their maker&apos;s online speech service to turn
            what you say into text and to read replies aloud. Mock Partner never records or keeps audio: we only get the text of your answer, as
            when you type.{" "}
            <Link href="/legal/privacy#voice-mode" className="font-medium underline underline-offset-4">
              Privacy policy
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                voice.begin();
                // The note and its buttons go away: put keyboard focus back on the switch, not the page top.
                switchRef.current?.focus();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-ink-contrast shadow-soft transition-opacity hover:opacity-90"
            >
              <Mic size={15} />
              Start voice mode
            </button>
            <button
              type="button"
              onClick={() => {
                voice.cancel();
                switchRef.current?.focus();
              }}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface"
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}

      {voice.problem ? (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-ink">
          {PROBLEMS[voice.problem]} Typing always works.
        </p>
      ) : null}

      <p id="voice-hint" className={cn("px-1 text-xs leading-relaxed text-muted", !on && "sr-only")}>
        {phase === "paused"
          ? "Listening is paused. Edit your answer and press Send, or resume listening."
          : voice.halfDuplex
            ? "Speak your answer: it sends when you pause. Tap Stop speaking to interrupt. Typing in the box pauses listening."
            : "Speak your answer: it sends when you pause. Talk over the interviewer to interrupt. Typing in the box pauses listening."}
        {voice.clipped && phase === "listening" ? <span className="text-warning"> That is the longest answer the box takes; it sends when you pause.</span> : null}
      </p>
    </div>
  );
}
