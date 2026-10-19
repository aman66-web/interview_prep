import { ChevronDown } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

// A labelled native <select> in the design's form style (label above, pill-ish field,
// our own chevron). Native, so it works with the keyboard and screen readers as is.

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "block h-12 w-full cursor-pointer appearance-none rounded-2xl bg-surface pl-4 pr-11 text-[15px] text-ink outline-none ring-1 ring-inset ring-line transition-shadow",
            "hover:ring-line-strong focus:ring-2 focus:ring-brand",
            value ? "font-medium" : "",
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
