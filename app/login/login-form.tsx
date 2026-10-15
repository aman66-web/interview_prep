"use client";

import { useActionState } from "react";
import { bareField, fieldShell, noOutline } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { Alert, Mail } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";
import { requestSignInEmail, verifySignInCode, type LoginState } from "./actions";
import { UtmFields } from "@/components/utm-fields";

function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="mt-3 flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-ink">
      <Alert size={16} className="mt-0.5 shrink-0 text-danger" />
      <span>{children}</span>
    </p>
  );
}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
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
            We emailed a sign-in link to <strong className="font-semibold">{email}</strong>. Open it on this device or any
            other. If your email shows a 6-digit code, you can enter it below instead.
          </p>
        </div>
        <form action={codeAction} className="mt-6">
          <UtmFields />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="code" className="block text-sm font-medium text-ink">
            Code from the email (optional)
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
          Nothing arrived? Check your spam folder, or{" "}
          <a href="/login" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            use a different email
          </a>
          .
        </p>
      </div>
    );
  }

  const error = emailState.error ?? notice;
  return (
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
      <Button type="submit" disabled={emailPending} size="lg" full arrow className="mt-4">
        {emailPending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
