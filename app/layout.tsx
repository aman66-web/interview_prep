import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { UtmCapture } from "@/components/utm-capture";
import { siteUrl } from "@/lib/site-url";
import { siteConfig } from "@/site.config";
import "./globals.css";

// Fonts are downloaded at build time and served from our own site (next/font),
// so visitors' browsers never contact Google (rule 2.7).
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    // Kept to 60 characters or fewer so search results show it whole.
    default: `${siteConfig.brandName}: consulting case interview practice with AI`,
    template: `%s | ${siteConfig.brandName}`,
  },
  description: siteConfig.tagline,
  applicationName: siteConfig.brandName,
  openGraph: {
    type: "website",
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName}: consulting case interview practice`,
    description: siteConfig.tagline,
  },
  twitter: { card: "summary_large_image" },
};

// The whole site is always dark (founder's choice, 26 Oct 2026; see docs/DESIGN.md), so the
// browser's own bar is dark too, whatever the visitor's device is set to.
export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Every page shows the dark look (data-force-dark; see app/globals.css and docs/DESIGN.md). */}
        <span hidden data-force-dark="" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-contrast"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <UtmCapture />
        <Analytics />
      </body>
    </html>
  );
}
