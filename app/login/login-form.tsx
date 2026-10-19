"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { bareField, fieldShell, noOutline } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { Alert, Mail } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";
import { PROVIDER_LABELS, type OAuthProvider } from "@/lib/auth/providers";
import { requestSignInEmail, signInWithProvider, verifySignInCode, type LoginState } from "./actions";
import { UtmFields } from "@/components/utm-fields";
import { Turnstile } from "@/components/app/turnstile";

// A message about the sign-in as a whole (a cancelled or failed Google or Apple sign-in, an expired
// link). It sits above the buttons so it is seen, and takes keyboard focus once so a screen reader
// reads it: a message that is already on the page when it loads is not announced by itself.
function PageNotice({ children }: { children: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <p ref={ref} tabIndex={-1} role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-ink outline-none">
      <Alert size={16} className="mt-0.5 shrink-0 text-danger" />
      <span>{children}</span>
    </p>
  );
}

function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="mt-3 flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-ink">
      <Alert size={16} className="mt-0.5 shrink-0 text-danger" />
      <span>{children}</span>
    </p>
  );
}

// The two logos follow Google's and Apple's own button rules: the full-colour "G" and the plain
// Apple mark, each with the provider's name in the wording ("Continue with ...").
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function ProviderButton({ provider }: { provider: OAuthProvider }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-surface px-5 text-[15px] font-medium text-ink ring-1 ring-inset ring-line-strong transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-60"
    >
      {provider === "google" ? <GoogleMark /> : <AppleMark />}
      {pending ? "Opening…" : `Continue with ${PROVIDER_LABELS[provider]}`}
    </button>
  );
}

function Providers({ providers, next }: { providers: OAuthProvider[]; next: string }) {
  if (providers.length === 0) return null;
  return (
    <div>
      <div className="grid gap-2.5">
        {providers.map((provider) => (
          <form key={provider} action={signInWithProvider}>
            <UtmFields />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="provider" value={provider} />
            <ProviderButton provider={provider} />
          </form>
        ))}
      </div>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        We use only your email address. {providers.includes("google") ? "Google" : "Apple"}
        {providers.length > 1 ? " or Apple" : ""} may also share your name, which we keep with your account but do not use. Sign in the same way each time: a different method or email address makes a separate account.
        {providers.includes("apple") ? " If you choose Apple\u2019s \u201CHide My Email\u201D, we only get a private address." : ""}
      </p>
      <div role="separator" aria-label="or" className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-subtle">
        <span className="h-px flex-1 bg-line" />
        or use your email
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

export function LoginForm({ next, notice, providers = [], captchaSiteKey = "" }: { next: string; notice?: string; providers?: OAuthProvider[]; captchaSiteKey?: string }) {
  const [emailState, emailAction, emailPending] = useActionState<LoginState, FormData>(
    requestSignInEmail,
    { step: "email" },
  );
  const [codeState, codeAction, codePending] = useActionState<LoginState, FormData>(
    verifySignInCode,
    { step: "code" },
  );

  if (emailState.step === "code") {
    const email = emailState.email ?? "";
    return (
      <div>
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-mint p-4">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink">
            <Mail size={18} />
          </span>
          <p className="text-[15px] leading-relaxed text-ink">
            We emailed a sign-in code to <strong className="font-semibold">{email}</strong>. Type it below. You can read
            the email on your phone and type the code here.
          </p>
        </div>
        <form action={codeAction} className="mt-6">
          <UtmFields />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="code" className="block text-sm font-medium text-ink">
            Code from the email
          </label>
          <div className={cn(fieldShell, "mt-2")}>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={10}
              required
              aria-describedby={codeState.error ? "code-error" : undefined}
              placeholder="123456"
              style={noOutline}
              className={cn(bareField, "h-14 px-4 font-mono text-2xl tracking-[0.3em] placeholder:tracking-[0.3em] placeholder:text-line-strong")}
            />
          </div>
          {codeState.error ? <ErrorText id="code-error">{codeState.error}</ErrorText> : null}
          <Button type="submit" disabled={codePending} size="lg" full arrow className="mt-4">
            {codePending ? "Checking…" : "Sign in with code"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-muted">
          If the email has a sign-in link instead of a code, open the link in this browser.
        </p>
        <p className="mt-2 text-sm text-muted">
          Nothing arrived? Check your spam folder, or{" "}
          <a href="/login" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            use a different email
          </a>
          .
        </p>
      </div>
    );
  }

  const error = emailState.error;
  return (
    <>
      {notice ? <PageNotice>{notice}</PageNotice> : null}
      <Providers providers={providers} next={next} />
      <form action={emailAction}>
        <UtmFields />
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Email address
        </label>
        <div className={cn(fieldShell, "mt-2 flex items-center gap-3 pl-4")}>
          <Mail size={18} className="shrink-0 text-subtle" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={emailState.email}
            aria-describedby={error ? "email-error" : undefined}
            placeholder="you@example.com"
            style={noOutline}
            className={cn(bareField, "h-12 min-w-0 pr-4 text-base")}
          />
        </div>
        {error ? <ErrorText id="email-error">{error}</ErrorText> : null}
        {captchaSiteKey ? <Turnstile siteKey={captchaSiteKey} resetKey={emailState} /> : null}
        <Button type="submit" disabled={emailPending} size="lg" full arrow className="mt-4">
          {emailPending ? "Sending…" : "Email me a sign-in code"}
        </Button>
      </form>
    </>
  );
}
