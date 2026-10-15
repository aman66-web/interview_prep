"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Form pieces shared by the free tools: labelled number fields with units, selects,
// result tiles and a polite screen-reader announcer. Client-safe, no server code.

/**
 * The global focus outline (globals.css) is unlayered, so a utility class can't turn it off.
 * Fields here show focus with a ring on their box instead, so the outline is switched off inline
 * (an inline style is the one thing that outranks it). Focus stays clearly visible.
 */
export const NO_OUTLINE = { outline: "none" } as const;

export const fieldShell =
  "flex h-12 items-center gap-2 rounded-2xl bg-surface px-4 ring-1 ring-inset ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand";
export const inputBase = "h-full w-full min-w-0 bg-transparent text-base text-ink tabular-nums outline-none placeholder:text-subtle focus-visible:outline-none";
export const selectClass =
  "h-12 w-full appearance-none rounded-2xl bg-surface bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pl-4 pr-10 text-base text-ink ring-1 ring-inset ring-line outline-none focus:ring-2 focus:ring-brand focus-visible:outline-none";
const chevron = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b8b94' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Label({ htmlFor, children, optional, className }: { htmlFor: string; children: ReactNode; optional?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink", className)}>
      <span>{children}</span>
      {optional ? <span className="text-xs font-normal text-muted">Optional</span> : null}
    </label>
  );
}

type NumberFieldProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  placeholder?: string;
  className?: string;
  /** Visually hide the label (it is still read out). */
  hideLabel?: boolean;
};

/**
 * Keyboard settings for a box that takes typed numbers. A full keyboard, not the decimal
 * keypad: on an iPhone the decimal keypad has no minus sign, no % and no letters (so -3,
 * 12% and 4.8bn couldn't be typed), and where the phone's region writes decimals with a
 * comma it offers only a comma. Autocorrect and capitals are off so 4m stays 4m.
 */
export const NUMBER_INPUT_PROPS = { type: "text", inputMode: "text", autoComplete: "off", autoCapitalize: "off", autoCorrect: "off", spellCheck: false } as const;

/**
 * A text box for numbers (1,200, -3, 4.8bn and 12% all work; see NUMBER_INPUT_PROPS).
 * The unit sits inside the box and is part of the label for screen readers.
 */
export function NumberField({ id, label, value, onChange, prefix, suffix, hint, error, optional, placeholder, className, hideLabel }: NumberFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <div className={cn(fieldShell, error && "ring-2 ring-danger focus-within:ring-danger")}>
        {prefix ? (
          <span aria-hidden="true" className="shrink-0 text-base text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          {...NUMBER_INPUT_PROPS}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputBase}
          style={NO_OUTLINE}
        />
        {suffix ? (
          <span aria-hidden="true" className="shrink-0 whitespace-nowrap text-sm text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  className,
  hideLabel,
  maxLength = 120,
  placeholder,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hideLabel?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <div className={fieldShell}>
        <input id={id} type="text" value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputBase} style={NO_OUTLINE} />
      </div>
    </div>
  );
}

export function SelectField<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
  className,
  hideLabel,
}: {
  id: string;
  label: ReactNode;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value);
          if (picked) onChange(picked.value);
        }}
        className={selectClass}
        style={{ backgroundImage: chevron, ...NO_OUTLINE }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export const CURRENCIES = [
  { value: "$", label: "US dollars ($)" },
  { value: "£", label: "Pounds (£)" },
  { value: "€", label: "Euros (€)" },
] as const;
export type CurrencySymbol = (typeof CURRENCIES)[number]["value"];

/** A big number with a label, for result panels. `onNight` for the dark panel. */
export function Stat({ label, value, detail, onNight, size = "md", className }: { label: ReactNode; value: ReactNode; detail?: ReactNode; onNight?: boolean; size?: "md" | "lg"; className?: string }) {
  return (
    <div className={className}>
      <dt className={cn("text-sm", onNight ? "text-on-night-muted" : "text-muted")}>{label}</dt>
      <dd
        className={cn(
          "mt-1 font-medium tracking-tight tabular-nums",
          size === "lg" ? "text-4xl leading-[1.05] sm:text-5xl" : "text-2xl leading-tight sm:text-[1.75rem]",
          onNight ? "text-white" : "text-ink",
        )}
      >
        {value}
      </dd>
      {detail ? <dd className={cn("mt-1 text-sm leading-snug", onNight ? "text-on-night-muted" : "text-muted")}>{detail}</dd> : null}
    </div>
  );
}

/** The value, once it has stopped changing for `ms`. Used so screen readers hear results after typing pauses, not on every key. */
export function useSettled<T>(value: T, ms = 900): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** A hidden live region that reads out a short summary of the results, politely, once typing pauses. */
export function Announcer({ text }: { text: string }) {
  const settled = useSettled(text);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {settled}
    </p>
  );
}

/**
 * The rounded frame for a wide table. When the table is wider than the space it has
 * (on a phone, say), the frame becomes a labelled region that keyboard users can tab to
 * and scroll with the arrow keys, a fade on the right edge shows there is more, and a
 * short line under it says so. When everything fits, it is just the frame.
 */
export function ScrollRegion({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ scrollable: false, atEnd: true });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const scrollable = el.scrollWidth > el.clientWidth + 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setState((s) => (s.scrollable === scrollable && s.atEnd === atEnd ? s : { scrollable, atEnd }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <div className={cn("min-w-0", className)}>
      <div className="relative">
        <div
          ref={ref}
          role={state.scrollable ? "region" : undefined}
          aria-label={state.scrollable ? label : undefined}
          tabIndex={state.scrollable ? 0 : undefined}
          className="overflow-x-auto rounded-[1.5rem] ring-1 ring-inset ring-line"
        >
          {children}
        </div>
        {state.scrollable && !state.atEnd ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-px right-px w-12 rounded-r-[1.5rem] bg-gradient-to-l from-surface to-transparent" />
        ) : null}
      </div>
      {state.scrollable ? <p className="mt-2 text-xs text-muted">Scroll sideways to see every column.</p> : null}
    </div>
  );
}

/** A notice in a status tone. */
export function Notice({ tone = "warning", children, className, role = "status" }: { tone?: "warning" | "danger" | "success" | "info"; children: ReactNode; className?: string; role?: "status" | "alert" | "note" }) {
  const tones = {
    warning: "bg-warning-soft text-ink [&_strong]:text-warning",
    danger: "bg-danger-soft text-ink [&_strong]:text-danger",
    success: "bg-success-soft text-ink [&_strong]:text-success",
    info: "bg-brand-soft text-ink [&_strong]:text-brand-ink",
  }[tone];
  return (
    <div role={role === "note" ? undefined : role} className={cn("rounded-2xl p-4 text-sm leading-relaxed", tones, className)}>
      {children}
    </div>
  );
}
