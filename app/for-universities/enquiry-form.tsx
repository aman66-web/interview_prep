"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { ArrowUpRight, Check } from "@/components/ui/icons";
import { knownLeadErrorMessage, LEAD_ERROR_MESSAGES, LEAD_FIELD_HINTS } from "@/lib/leads/messages";
import { GROUP_SIZES, LEAD_FIELDS, LEAD_LIMITS, type LeadField } from "@/lib/leads/fields";
import { cn } from "@/lib/ui/cn";

// The group enquiry form. It is a normal HTML form that posts to /api/leads, so it works
// without JavaScript (the server redirects back with ?sent=1 or ?error=...). With
// JavaScript it sends the same form with fetch and shows the result in place.

// The global focus outline can't be turned off with a utility class (it is unlayered CSS),
// so fields here turn it off inline and show focus with their own brand-coloured ring.
const NO_OUTLINE = { outline: "none" } as const;

const field =
  "w-full rounded-2xl bg-surface px-4 text-base text-ink ring-1 ring-inset ring-line outline-none placeholder:text-subtle focus:ring-2 focus:ring-brand aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string; fields: Partial<Record<LeadField, string>> };

export function EnquiryForm({ initialSent, initialError, initialFields }: { initialSent: boolean; initialError: string | null; initialFields: LeadField[] }) {
  const id = useId();
  const [status, setStatus] = useState<Status>(() => {
    if (initialSent) return { kind: "sent" };
    if (initialError) return { kind: "error", message: initialError, fields: Object.fromEntries(initialFields.map((f) => [f, LEAD_FIELD_HINTS[f]])) };
    return { kind: "idle" };
  });
  const [messageLength, setMessageLength] = useState(0);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;
    const form = event.currentTarget;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { accept: "application/json" } });
      const body: { ok?: boolean; error?: string; fields?: Partial<Record<LeadField, string>> } = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setStatus({ kind: "sent" });
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      const message = knownLeadErrorMessage(body.error) ?? LEAD_ERROR_MESSAGES.server;
      setStatus({ kind: "error", message, fields: body.fields ?? {} });
      const first = body.fields ? (Object.keys(body.fields)[0] as LeadField | undefined) : undefined;
      if (first) requestAnimationFrame(() => (formRef.current?.elements.namedItem(LEAD_FIELDS[first]) as HTMLElement | null)?.focus());
    } catch {
      setStatus({ kind: "error", message: "We couldn't reach the server. Check your connection and try again.", fields: {} });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-8" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-lime text-lime-ink">
          <Check size={22} strokeWidth={2.6} />
        </span>
        <h3 ref={doneRef} tabIndex={-1} className="mt-6 text-2xl font-medium tracking-tight text-ink focus:outline-none">
          Thanks, your enquiry is on its way
        </h3>
        <p className="mt-3 leading-relaxed text-muted">
          We&rsquo;ll reply by email to the address you gave. You don&rsquo;t need to do anything else for now.
        </p>
        <Link href="/for-universities#enquiry" onClick={() => setStatus({ kind: "idle" })} className="mt-6 inline-flex text-sm font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
          Send another enquiry
        </Link>
      </div>
    );
  }

  const errors = status.kind === "error" ? status.fields : {};
  const describe = (name: LeadField, hint?: boolean) => [hint ? `${id}-${name}-hint` : null, errors[name] ? `${id}-${name}-error` : null].filter(Boolean).join(" ") || undefined;
  const errorText = (name: LeadField) =>
    errors[name] ? (
      <p id={`${id}-${name}-error`} className="mt-1.5 text-sm text-danger">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form
      ref={formRef}
      method="post"
      action="/api/leads"
      onSubmit={onSubmit}
      className="relative rounded-[1.75rem] bg-surface p-6 shadow-soft ring-1 ring-inset ring-line sm:p-8"
      aria-labelledby={`${id}-title`}
    >
      <h3 id={`${id}-title`} className="text-xl font-medium tracking-tight text-ink">
        Group enquiry
      </h3>
      <p className="mt-1 text-sm text-muted">Two fields are needed; the rest helps us reply with the right options.</p>

      {status.kind === "error" ? (
        <div role="alert" className="mt-5 rounded-2xl bg-danger-soft p-4 text-sm leading-relaxed text-ink">
          <strong className="font-medium text-danger">That didn&rsquo;t send.</strong> {status.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5">
        <div>
          <label htmlFor={`${id}-org`} className="mb-1.5 block text-sm font-medium text-ink">
            Organisation
          </label>
          <input
            id={`${id}-org`}
            name={LEAD_FIELDS.org}
            type="text"
            required
            maxLength={LEAD_LIMITS.org}
            autoComplete="organization"
            placeholder="University, consulting club or careers service"
            aria-invalid={errors.org ? true : undefined}
            aria-describedby={describe("org")}
            className={cn(field, "h-12")}
            style={NO_OUTLINE}
          />
          {errorText("org")}
        </div>
        <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <label htmlFor={`${id}-email`} className="mb-1.5 block text-sm font-medium text-ink">
              Work email
            </label>
            <input
              id={`${id}-email`}
              name={LEAD_FIELDS.email}
              type="email"
              required
              maxLength={LEAD_LIMITS.email}
              autoComplete="email"
              inputMode="email"
              placeholder="name@university.ac.uk"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describe("email")}
              className={cn(field, "h-12")}
              style={NO_OUTLINE}
            />
            {errorText("email")}
          </div>
          <div>
            <label htmlFor={`${id}-size`} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
              Group size <span className="text-xs font-normal text-muted">Optional</span>
            </label>
            <select
              id={`${id}-size`}
              name={LEAD_FIELDS.size}
              defaultValue=""
              aria-invalid={errors.size ? true : undefined}
              aria-describedby={describe("size")}
              className={cn(field, "h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10")}
              style={{
                ...NO_OUTLINE,
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b8b94' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="">Choose…</option>
              {GROUP_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size === "Not sure yet" ? size : `${size} members`}
                </option>
              ))}
            </select>
            {errorText("size")}
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-message`} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
            Message <span className="text-xs font-normal text-muted">Optional</span>
          </label>
          <textarea
            id={`${id}-message`}
            name={LEAD_FIELDS.message}
            rows={4}
            maxLength={LEAD_LIMITS.message}
            onChange={(e) => setMessageLength(e.target.value.length)}
            placeholder="When you need access, how you'd like to use it, anything else."
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describe("message", true)}
            className={cn(field, "min-h-28 resize-y py-3 leading-relaxed")}
            style={NO_OUTLINE}
          />
          <p id={`${id}-message-hint`} className="mt-1.5 text-right text-xs text-muted tabular-nums">
            {messageLength.toLocaleString("en-US")} / {LEAD_LIMITS.message.toLocaleString("en-US")}
          </p>
          {errorText("message")}
        </div>
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in and are quietly ignored. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input id={`${id}-website`} name={LEAD_FIELDS.honeypot} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        We use these details only to reply to this enquiry. See our{" "}
        <Link href="/legal/privacy" className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
          privacy notice
        </Link>
        .
      </p>

      <button type="submit" disabled={status.kind === "sending"} aria-disabled={status.kind === "sending" || undefined} className={cn(buttonClasses({ size: "lg", arrow: true, full: true }), "mt-6")}>
        <span>{status.kind === "sending" ? "Sending…" : "Send enquiry"}</span>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-ink-contrast text-ink transition-transform duration-200 group-hover/btn:rotate-45">
          <ArrowUpRight size={18} strokeWidth={2} />
        </span>
      </button>
      <p className="sr-only" aria-live="polite">
        {status.kind === "sending" ? "Sending your enquiry." : ""}
      </p>
    </form>
  );
}
