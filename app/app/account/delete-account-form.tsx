"use client";

import { useActionState } from "react";
import { bareField, fieldShell, noOutline } from "@/components/app/field";
import { Alert, Trash } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});

  return (
    <form action={action} className="mt-6">
      <label htmlFor="confirm" className="block text-sm font-medium text-ink">
        To confirm, type your email address ({email})
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={cn(fieldShell, "flex-1 focus-within:ring-danger")}>
          <input
            id="confirm"
            name="confirm"
            type="email"
            autoComplete="off"
            required
            aria-describedby={state.error ? "confirm-error" : undefined}
            style={noOutline}
            className={cn(bareField, "h-12 px-4 text-base")}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-center text-[15px] font-medium leading-snug text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#0b0b0d]"
        >
          <Trash size={17} />
          {pending ? "Deleting…" : "Permanently delete my account and data"}
        </button>
      </div>
      {state.error ? (
        <p id="confirm-error" role="alert" className="mt-3 flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-ink">
          <Alert size={16} className="mt-0.5 shrink-0 text-danger" />
          <span>{state.error}</span>
        </p>
      ) : null}
    </form>
  );
}
