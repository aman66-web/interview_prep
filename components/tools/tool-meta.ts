import { Clock, Coins, Target, TrendUp } from "@/components/ui/icons";

// How each free tool looks in lists: its icon and pastel tone (keyed by the slugs in lib/tools.ts).

export const TOOL_ICONS: Record<string, typeof Target> = {
  "market-sizing-calculator": Target,
  "break-even-calculator": Coins,
  "mental-maths-trainer": Clock,
  "growth-rate-calculator": TrendUp,
};

export const TOOL_TONES: Record<string, string> = {
  "market-sizing-calculator": "bg-butter",
  "break-even-calculator": "bg-mint",
  "mental-maths-trainer": "bg-lavender",
  "growth-rate-calculator": "bg-sky",
};
