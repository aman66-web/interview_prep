// A data table for an exhibit: real <table> markup, so it works with screen readers and scrolls sideways on a phone.

export function ExhibitTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <figure className="my-3">
      <figcaption className="mb-2 text-sm font-medium">{title}</figcaption>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="border-b border-border px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])}>
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="border-b border-border px-3 py-2 font-medium">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="border-b border-border px-3 py-2 tabular-nums">
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
