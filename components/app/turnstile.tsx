"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile, the bot check on the email sign-in box. This is the one place the site
// loads a script from another company, and only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set
// (lib/auth/captcha.ts). The widget adds a hidden "cf-turnstile-response" field to the
// surrounding form; the server action passes it to Supabase. Change `resetKey` to get a fresh
// check, because a token works once.

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    script.onerror = () => {
      loading = null; // allow another try after a refresh of the form
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function Turnstile({ siteKey, resetKey }: { siteKey: string; resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !box.current) return;
        widget.current = api.render(box.current, {
          sitekey: siteKey,
          theme: "auto",
          "error-callback": () => {
            setFailed(true);
            return true;
          },
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (widget.current && window.turnstile) {
      window.turnstile.reset(widget.current);
      setFailed(false);
    }
  }, [resetKey]);

  return (
    <div className="mt-4">
      <div ref={box} className="min-h-[65px]" />
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-ink">
          The check could not load. Turn off any ad or script blocker for this page, then refresh it.
        </p>
      ) : null}
    </div>
  );
}
