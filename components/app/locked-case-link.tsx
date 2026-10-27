"use client";

import Link from "next/link";
import { useId, useRef, type ReactNode } from "react";
import { notePaywallSeen } from "@/app/app/funnel-actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Lock } from "@/components/ui/icons";
import { siteConfig } from "@/site.config";

// A case link for a free account that cannot run the case. Pressing it opens a small
// "upgrade" window instead of leaving the page. Without JavaScript the link still goes to the
// case's start page, which says the same thing. The window is the browser's own <dialog>, so
// Escape closes it, the keyboard stays inside it and focus returns to the link afterwards.

export function LockedCaseLink({
  href,
  slug,
  className,
  children,
}: {
  href: string;
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          dialog.current?.showModal();
          notePaywallSeen("start", slug).catch(() => {});
        }}
      >
        {children}
      </Link>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(event) => {
          // A press on the dimmed area behind the window (the dialog element itself) closes it.
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-[1.75rem] bg-surface p-6 text-ink shadow-float ring-1 ring-inset ring-line backdrop:bg-black/70 sm:p-8"
      >
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-lavender text-ink">
          <Lock size={20} />
        </span>
        <h2 id={titleId} className="mt-5 text-2xl font-medium tracking-tight">
          Upgrade to open this case
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          This case is part of the paid plans. Your free AI interview is the free starter case. A paid plan opens every case, from $
          {siteConfig.prices.monthly} a month or ${siteConfig.prices.pass90} for 90 days.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <ButtonLink href="/pricing" full arrow size="lg">
            See plans
          </ButtonLink>
          <Button type="button" variant="ghost" full onClick={() => dialog.current?.close()}>
            Not now
          </Button>
        </div>
      </dialog>
    </>
  );
}
