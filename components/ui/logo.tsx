import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

/** The brand mark: a dark rounded square with a lime upward arrow (progress, momentum). */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#0d0d10" stroke="rgb(255 255 255 / 0.14)" />
      <path d="M10.5 21.5 21 11" stroke="#d6f55c" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 10.5h8.5V19" stroke="#d6f55c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({ className, onNight = false }: { className?: string; onNight?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-[1.05rem] font-semibold tracking-tight", onNight ? "text-white" : "text-ink")}>{siteConfig.brandName}</span>
    </span>
  );
}
