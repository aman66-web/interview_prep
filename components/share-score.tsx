"use client";

import { useActionState, useId, useRef, useState } from "react";
import { Tag } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { Check, Copy, ExternalLink, Share } from "@/components/ui/icons";
import { createShareLink, type ShareLinkState } from "@/lib/share/actions";
import { cn } from "@/lib/ui/cn";

// "Share your scores" for the debrief page. The person may type a first name; nothing
// else about them goes on the card. Sharing uses plain links to LinkedIn and X that
// open in a new tab: no scripts or trackers from those sites are loaded here.

// The same limit as lib/share/token.ts, which is server only. The server checks the
// name and explains any character the card cannot draw.
const FIRST_NAME_MAX = 30;

export function ShareScore({ sessionId, className }: { sessionId: string; className?: string }) {
  const [state, action, pending] = useActionState<ShareLinkState, FormData>(createShareLink, { status: "idle" });
  const [copied, setCopied] = useState<"idle" | "copied" | "manual">("idle");
  // Controlled, so the name stays in the box after the form is sent (React resets uncontrolled fields).
  const [firstName, setFirstName] = useState("");
  const linkRef = useRef<HTMLInputElement>(null);
  const ids = { name: useId(), help: useId(), link: useId(), heading: useId() };

  const ready = state.status === "ready" ? state : null;
  const url = ready && typeof window !== "undefined" ? new URL(ready.path, window.location.origin).toString() : "";
  const shareText = "My practice scores from a mock case interview";

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
    } catch {
      linkRef.current?.select();
      setCopied("manual");
    }
  }

  return (
    <section aria-labelledby={ids.heading} className={className}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBadge tone="ink">
              <Share size={20} />
            </IconBadge>
            <h2 id={ids.heading} className="text-xl font-medium tracking-tight text-ink sm:text-2xl">
              Share your scores
            </h2>
          </div>
          <Tag tone="brand">No personal details unless you add them</Tag>
        </div>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          Create a picture of your five scores to post on LinkedIn or X. It shows the case, the date and your scores. Your name appears only if you
          type it below.
        </p>

        <form
          action={(form) => {
            setCopied("idle");
            action(form);
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          <div className="flex-1">
            <label htmlFor={ids.name} className="text-sm font-medium text-ink">
              First name (optional)
            </label>
            <input
              id={ids.name}
              name="firstName"
              type="text"
              autoComplete="given-name"
              maxLength={FIRST_NAME_MAX}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-describedby={ids.help}
              className="mt-1.5 h-12 w-full rounded-2xl bg-surface px-4 text-ink outline-none ring-1 ring-inset ring-line focus:ring-2 focus:ring-brand"
            />
          </div>
          <Button type="submit" disabled={pending} arrow className="sm:mb-0">
            {pending ? "Creating…" : ready ? "Update the link" : "Create share link"}
          </Button>
        </form>
        <p id={ids.help} className="mt-2 text-sm text-muted">
          Letters A to Z (accents such as é or ł are fine) or Cyrillic letters, spaces, hyphens and apostrophes, up to {FIRST_NAME_MAX}{" "}
          characters. Leave it empty to stay anonymous.
        </p>

        {state.status === "error" ? (
          <p role="alert" className="mt-4 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
            {state.message}
          </p>
        ) : null}

        {ready ? (
          <div className="mt-6 grid gap-5 border-t border-line pt-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            {/* The card itself; the same picture LinkedIn and X will show. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- a generated image from our own route, not a static asset */}
            <img
              src={ready.imagePath}
              width={1200}
              height={630}
              alt={`Your share card${ready.firstName ? ` with the name ${ready.firstName}` : ""}: the case, the date, your overall score and the five skill scores.`}
              className="aspect-[1200/630] h-auto w-full rounded-2xl bg-night ring-1 ring-inset ring-line"
            />
            <div>
              <label htmlFor={ids.link} className="text-sm font-medium text-ink">
                Your share link
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id={ids.link}
                  ref={linkRef}
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-12 min-w-0 flex-1 rounded-2xl bg-surface-2 px-4 font-mono text-[13px] text-ink outline-none ring-1 ring-inset ring-line focus:ring-2 focus:ring-brand"
                />
                <Button variant="secondary" onClick={copy} className="h-12">
                  <span className="inline-flex items-center gap-2">
                    {copied === "copied" ? <Check size={16} strokeWidth={2.4} /> : <Copy size={16} />}
                    {copied === "copied" ? "Copied" : "Copy link"}
                  </span>
                </Button>
              </div>
              <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted">
                {copied === "copied" ? "Link copied." : copied === "manual" ? "Press Ctrl+C (or Cmd+C) to copy the selected link." : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClasses({ variant: "primary" }))}
                >
                  <span>Share on LinkedIn</span>
                  <ExternalLink size={16} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClasses({ variant: "secondary" }))}
                >
                  <span>Share on X</span>
                  <ExternalLink size={16} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-subtle">
                Anyone with the link can see this card. It is labelled as a practice score from an AI-scored mock interview. The link holds
                only what is on the card, so it keeps working even if you delete your account. To take it down, delete the post where you
                shared it.
              </p>
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
