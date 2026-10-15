import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { ArrowUpRight } from "./icons";

// Pill buttons in the reference style: a solid pill with an optional round arrow
// "bubble" at the end. Use ButtonLink for navigation and Button for forms.
//
//   primary    near-black pill (light) / near-white pill (dark): the one main action
//   secondary  white pill with a hairline border
//   lime       the accent pill, for a single highlight on a page
//   ghost      text-only, for low-priority actions
//   inverse    white pill for dark ("night") sections

export type ButtonVariant = "primary" | "secondary" | "lime" | "ghost" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

type StyleOptions = { variant?: ButtonVariant; size?: ButtonSize; arrow?: boolean; full?: boolean };

const sizes: Record<ButtonSize, { plain: string; withArrow: string; bubble: string; icon: number }> = {
  sm: { plain: "h-9 px-4 text-sm", withArrow: "h-9 pl-4 pr-1.5 text-sm", bubble: "size-6", icon: 14 },
  md: { plain: "h-11 px-5 text-[15px]", withArrow: "h-11 pl-5 pr-1.5 text-[15px]", bubble: "size-8", icon: 16 },
  lg: { plain: "h-13 px-6 text-base", withArrow: "h-13 pl-6 pr-2 text-base", bubble: "size-9", icon: 18 },
};

const variants: Record<ButtonVariant, { pill: string; bubble: string }> = {
  primary: { pill: "bg-ink text-ink-contrast shadow-soft hover:opacity-90", bubble: "bg-ink-contrast text-ink" },
  secondary: {
    pill: "bg-surface text-ink ring-1 ring-inset ring-line hover:bg-surface-2 hover:ring-line-strong",
    bubble: "bg-ink text-ink-contrast",
  },
  lime: { pill: "bg-lime text-lime-ink hover:brightness-[0.97]", bubble: "bg-lime-ink text-lime" },
  ghost: { pill: "text-ink hover:bg-surface-2", bubble: "bg-surface-3 text-ink" },
  inverse: { pill: "bg-white text-[#0b1020] hover:bg-white/90", bubble: "bg-[#0b1020] text-white" },
};

export function buttonClasses({ variant = "primary", size = "md", arrow = false, full = false }: StyleOptions = {}) {
  return cn(
    "group/btn inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-medium",
    "transition-[background-color,box-shadow,opacity,filter] duration-200 active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    arrow ? sizes[size].withArrow : sizes[size].plain,
    variants[variant].pill,
    full && "w-full",
  );
}

function Bubble({ variant, size }: { variant: ButtonVariant; size: ButtonSize }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid place-items-center rounded-full transition-transform duration-200 group-hover/btn:rotate-45",
        sizes[size].bubble,
        variants[variant].bubble,
      )}
    >
      <ArrowUpRight size={sizes[size].icon} strokeWidth={2} />
    </span>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & StyleOptions & { children: ReactNode };

export function ButtonLink({ variant = "primary", size = "md", arrow = false, full, className, children, ...props }: LinkButtonProps) {
  return (
    <Link {...props} className={cn(buttonClasses({ variant, size, arrow, full }), className)}>
      <span>{children}</span>
      {arrow ? <Bubble variant={variant} size={size} /> : null}
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleOptions & { children: ReactNode };

export function Button({ variant = "primary", size = "md", arrow = false, full, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} {...props} className={cn(buttonClasses({ variant, size, arrow, full }), className)}>
      <span>{children}</span>
      {arrow ? <Bubble variant={variant} size={size} /> : null}
    </button>
  );
}
