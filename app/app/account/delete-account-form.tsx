"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});

  return (
    <form action={action} className="mt-4">
      <label htmlFor="confirm" className="block text-sm font-medium">
        To confirm, type your email address ({email})
      </label>
      <input
        id="confirm"
        name="confirm"
        type="email"
        autoComplete="off"
        required
        className="mt-1 block w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-base"
      />
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Permanently delete my account and data"}
      </button>
    </form>
  );
}
