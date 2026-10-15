// Supabase returns at most 1,000 rows per request, so the admin page reads a table in
// pages. `page(from, to)` runs one query for rows from..to (inclusive, both 0-based)
// and must use a stable order. Stops at `maxRows` and says so, so a very busy month
// can never make the page hang; the page then shows that the figures are partial.

export type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;

export async function fetchAllRows<T>(
  page: (from: number, to: number) => PageResult<T>,
  { pageSize = 1000, maxRows = 50_000 }: { pageSize?: number; maxRows?: number } = {},
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const to = Math.min(from + pageSize, maxRows) - 1;
    const { data, error } = await page(from, to);
    if (error) throw new Error(`Database error while reading the dashboard: ${error.code ?? error.message}`);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < to - from + 1) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}
