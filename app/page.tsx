import Link from "next/link";
import { siteConfig } from "@/site.config";

// Placeholder home page. The real home page (how it works, debrief
// screenshot, pricing teaser, FAQ) is built later, once the product exists.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
        {siteConfig.tagline}
      </h1>
      <p className="mt-6 text-lg text-muted">
        Work through a realistic mock case with an AI interviewer, then get a
        scored debrief that shows exactly what to fix.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-block rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground"
      >
        Start free, no card needed
      </Link>
    </div>
  );
}
