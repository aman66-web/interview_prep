import Link from "next/link";
import { siteConfig } from "@/site.config";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          {siteConfig.brandName}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          <Link href="/login" className="underline">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
