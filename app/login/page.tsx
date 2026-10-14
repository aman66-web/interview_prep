import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { getUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in or sign up",
  robots: { index: false },
};

const notices: Record<string, string> = {
  link_invalid:
    "That sign-in link has expired or was already used. Enter your email to get a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  if (await getUser()) redirect(next);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Log in or sign up</h1>
      <p className="mt-2 text-muted">
        No password and no card. We email you a one-time sign-in link; new
        accounts are created automatically.
      </p>
      <div className="mt-8">
        <LoginForm next={next} notice={params.error ? notices[params.error] : undefined} />
      </div>
    </div>
  );
}
