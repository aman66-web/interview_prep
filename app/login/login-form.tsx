"use client";

import { useActionState } from "react";
import { requestSignInEmail, verifySignInCode, type LoginState } from "./actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-base";
const buttonClass =
  "mt-4 w-full rounded-md bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-60";

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
        <p role="status" className="rounded-md border border-border p-4">
          We emailed a sign-in link to <strong>{email}</strong>. Open it on this
          device or any other. If your email shows a 6-digit code, you can enter
          it below instead.
        </p>
        <form action={codeAction} className="mt-6">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="code" className="block text-sm font-medium">
            Code from the email (optional)
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            required
            className={inputClass}
          />
          {codeState.error ? (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {codeState.error}
            </p>
          ) : null}
          <button type="submit" disabled={codePending} className={buttonClass}>
            {codePending ? "Checking…" : "Sign in with code"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Nothing arrived? Check your spam folder, or{" "}
          <a href="/login" className="underline">
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
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="block text-sm font-medium">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={emailState.email}
        className={inputClass}
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={emailPending} className={buttonClass}>
        {emailPending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
