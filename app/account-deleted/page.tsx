import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account deleted",
  robots: { index: false },
};

export default function AccountDeletedPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Your account has been deleted</h1>
      <p className="mt-2 text-muted">
        Your account and your data have been removed. You are welcome back any
        time.
      </p>
      <Link href="/" className="mt-6 inline-block underline">
        Back to the home page
      </Link>
    </div>
  );
}
