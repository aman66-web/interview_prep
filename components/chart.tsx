import type { ChartSpec } from "@/lib/drills/types";

// A simple, accessible bar or line chart drawn as SVG (no chart library).
// Values are printed on the chart so a drill is about reading and thinking,
// not squinting at gridlines. A hidden table gives screen readers the same data.

// A compact viewBox so text stays readable when the chart shrinks on a phone.
const W = 400;
const H = 260;
const MARGIN = { left: 44, right: 12, top: 26, bottom: 44 };

/** Axis steps that read cleanly (10, 20, 25, 50...), never 37.5 or 112.5. */
function axis(max: number) {
  const target = Math.max(max, 1) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= target) ?? 10) * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 1e6; t += step) ticks.push(Math.round(t * 1e6) / 1e6);
  return { top, ticks };
}

const number = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function Chart({ spec }: { spec: ChartSpec }) {
  const { points } = spec;
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  const { top: max, ticks } = axis(Math.max(...points.map((p) => p.value)));
  const y = (v: number) => MARGIN.top + innerH - (v / max) * innerH;
  const band = innerW / points.length;

  return (
    <figure className="my-4 max-w-lg rounded-md border border-border p-3 text-foreground">
      <figcaption className="mb-2 text-sm font-medium">
        {spec.title} <span className="font-normal text-muted">({spec.unit})</span>
      </figcaption>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true" focusable="false">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={W - MARGIN.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(t) + 4.5} textAnchor="end" fontSize={13} fill="var(--muted)">
              {number(t)}
            </text>
          </g>
        ))}

        {spec.kind === "bar"
          ? points.map((p, i) => {
              const barW = band * 0.6;
              const x = MARGIN.left + band * i + (band - barW) / 2;
              return (
                <g key={p.label}>
                  <rect x={x} y={y(p.value)} width={barW} height={MARGIN.top + innerH - y(p.value)} fill="var(--accent)" rx={2} />
                  <text x={x + barW / 2} y={y(p.value) - 6} textAnchor="middle" fontSize={14} fontWeight={600} fill="currentColor">
                    {number(p.value)}
                  </text>
                  <text x={x + barW / 2} y={H - MARGIN.bottom + 20} textAnchor="middle" fontSize={13} fill="var(--muted)">
                    {p.label}
                  </text>
                </g>
              );
            })
          : (() => {
              const xs = points.map((_, i) => MARGIN.left + band * i + band / 2);
              return (
                <g>
                  <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    points={points.map((p, i) => `${xs[i]},${y(p.value)}`).join(" ")}
                  />
                  {points.map((p, i) => (
                    <g key={p.label}>
                      <circle cx={xs[i]} cy={y(p.value)} r={5} fill="var(--accent)" />
                      <text x={xs[i]} y={y(p.value) - 12} textAnchor="middle" fontSize={14} fontWeight={600} fill="currentColor">
                        {number(p.value)}
                      </text>
                      <text x={xs[i]} y={H - MARGIN.bottom + 20} textAnchor="middle" fontSize={13} fill="var(--muted)">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
      </svg>

      <table className="sr-only">
        <caption>
          {spec.title} ({spec.unit})
        </caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <th scope="row">{p.label}</th>
              <td>{number(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
