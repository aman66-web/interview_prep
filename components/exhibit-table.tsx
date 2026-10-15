import { cn } from "@/lib/ui/cn";

// A data table for an exhibit: real <table> markup, so it works with screen readers.
// The rounded wrapper scrolls sideways on a phone, so the page itself never does.
// Number columns are right-aligned in the mono font, so digits line up.

export function ExhibitTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  const numeric = columns.map((_, i) => i > 0 && rows.length > 0 && rows.every((row) => typeof row[i] === "number"));

  return (
    <figure className="my-4 overflow-hidden rounded-[1.5rem] bg-surface text-ink ring-1 ring-inset ring-line">
      <figcaption className="flex items-start gap-2.5 border-b border-line px-4 py-3.5 text-sm font-medium leading-snug text-ink sm:px-5">
        <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-brand" />
        {title}
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-2">
            <tr>
              {columns.map((column, i) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "px-3 py-2.5 text-[11px] font-medium uppercase leading-snug tracking-wide text-muted first:pl-4 last:pr-4 sm:px-5",
                    numeric[i] ? "min-w-[4.75rem] text-right sm:min-w-[6.5rem]" : "min-w-[7.5rem] sm:min-w-[9rem]",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {rows.map((row) => (
              <tr key={String(row[0])} className="transition-colors hover:bg-surface-2">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-3 pl-4 pr-3 font-medium leading-snug text-ink sm:px-5">
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={i}
                      className={cn(
                        "whitespace-nowrap px-3 py-3 tabular-nums text-ink last:pr-4 sm:px-5",
                        numeric[i] ? "text-right font-mono text-[13px]" : "",
                      )}
                    >
                      {typeof cell === "number" ? cell.toLocaleString("en-US") : cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
