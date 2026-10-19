import { Chart } from "@/components/chart";
import { ExhibitTable } from "@/components/exhibit-table";
import type { PublicExhibit } from "@/lib/content/public";
import { exhibitChartSpec, splitUnit } from "./exhibit-chart";

// One exhibit from the public view of a case: a chart when the data is a simple
// series marked "bar" or "line", otherwise a table. Never shows an insight.

export function ExhibitView({ exhibit, caption }: { exhibit: PublicExhibit; caption: string }) {
  const spec = exhibitChartSpec(exhibit);
  if (!spec) return <ExhibitTable title={caption} columns={exhibit.columns} rows={exhibit.rows} />;
  const across = splitUnit(exhibit.columns[0]);
  return (
    <div>
      <Chart spec={spec} />
      <p className="-mt-2 text-sm text-muted">
        Along the bottom: {across.name.toLowerCase()}
        {across.unit ? ` (${across.unit})` : ""}.
      </p>
    </div>
  );
}
