import type { ChartSpec } from "@/lib/drills/types";

// A simple, accessible bar or line chart drawn as SVG (no chart library).
// Values are printed on the chart so a drill is about reading and thinking,
// not squinting at gridlines. A hidden table gives screen readers the same data.
// Colours come from the design tokens, so it follows light and dark mode.

// A compact viewBox so text stays readable when the chart shrinks on a phone.
const W = 400;
const H = 260;
const MARGIN = { left: 44, right: 12, top: 28, bottom: 42 };

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

/** A short, stable id for the gradients, so two charts on one page never share one by accident. */
function chartId(spec: ChartSpec) {
  const text = `${spec.kind}|${spec.title}|${spec.points.map((p) => `${p.label}:${p.value}`).join(",")}`;
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `chart-${(h >>> 0).toString(36)}`;
}

/** A bar with rounded top corners only. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(7, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function Chart({ spec }: { spec: ChartSpec }) {
  const { points } = spec;
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  const { top: max, ticks } = axis(Math.max(...points.map((p) => p.value)));
  const y = (v: number) => MARGIN.top + innerH - (v / max) * innerH;
  const base = MARGIN.top + innerH;
  const band = innerW / points.length;
  const id = chartId(spec);

  return (
    <figure className="my-5 w-full max-w-lg rounded-[1.5rem] bg-surface p-4 text-ink ring-1 ring-inset ring-line sm:p-5">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium leading-snug text-ink">{spec.title}</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted ring-1 ring-inset ring-line">{spec.unit}</span>
      </figcaption>

      <div className="-mx-1 overflow-x-auto px-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[17rem]"
          style={{ fontVariantNumeric: "tabular-nums" }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={`${id}-bar`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--brand-2)" }} />
              <stop offset="100%" style={{ stopColor: "var(--brand)" }} />
            </linearGradient>
            <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--brand)", stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: "var(--brand)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={W - MARGIN.right}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? "var(--line-strong)" : "var(--line)"}
                strokeWidth={1}
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
              <text x={MARGIN.left - 8} y={y(t) + 4.5} textAnchor="end" fontSize={12.5} fill="var(--subtle)">
                {number(t)}
              </text>
            </g>
          ))}

          {spec.kind === "bar"
            ? points.map((p, i) => {
                const barW = Math.min(band * 0.58, 46);
                const x = MARGIN.left + band * i + (band - barW) / 2;
                return (
                  <g key={p.label}>
                    {p.value > 0 ? <path d={barPath(x, y(p.value), barW, base - y(p.value))} fill={`url(#${id}-bar)`} /> : null}
                    <text x={x + barW / 2} y={y(p.value) - 8} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">
                      {number(p.value)}
                    </text>
                    <text x={x + barW / 2} y={H - MARGIN.bottom + 21} textAnchor="middle" fontSize={13} fill="var(--muted)">
                      {p.label}
                    </text>
                  </g>
                );
              })
            : (() => {
                const xs = points.map((_, i) => MARGIN.left + band * i + band / 2);
                const line = points.map((p, i) => `${xs[i]},${y(p.value)}`).join(" ");
                const area = `M${xs[0]},${base} L${points.map((p, i) => `${xs[i]},${y(p.value)}`).join(" L")} L${xs[xs.length - 1]},${base} Z`;
                return (
                  <g>
                    <path d={area} fill={`url(#${id}-area)`} />
                    <polyline fill="none" stroke="var(--brand)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={line} />
                    {points.map((p, i) => (
                      <g key={p.label}>
                        <circle cx={xs[i]} cy={y(p.value)} r={5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.5} />
                        <text x={xs[i]} y={y(p.value) - 13} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">
                          {number(p.value)}
                        </text>
                        <text x={xs[i]} y={H - MARGIN.bottom + 21} textAnchor="middle" fontSize={13} fill="var(--muted)">
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
        </svg>
      </div>

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
