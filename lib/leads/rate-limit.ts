// A small fixed-window rate limit for the enquiry form, kept in memory.
// Each server instance counts on its own, so this only slows down someone hammering
// one instance; it is not a security boundary. Addresses are held in memory for the
// window only: never stored, never logged (rule 2.7).

export type RateLimiter = {
  /** Records one attempt and says whether it is allowed. */
  take(key: string): boolean;
  /** For tests. */
  size(): number;
};

export function createRateLimiter({ limit, windowMs, now = Date.now, maxKeys = 5000 }: { limit: number; windowMs: number; now?: () => number; maxKeys?: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  function prune(at: number) {
    for (const [key, w] of windows) if (at - w.start >= windowMs) windows.delete(key);
    // Still too many (a flood of different addresses): forget the oldest.
    while (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest === undefined) break;
      windows.delete(oldest);
    }
  }

  return {
    take(key) {
      const at = now();
      const current = windows.get(key);
      if (!current || at - current.start >= windowMs) {
        if (!current && windows.size >= maxKeys) prune(at);
        windows.delete(key);
        windows.set(key, { start: at, count: 1 });
        return true;
      }
      if (current.count >= limit) return false;
      current.count += 1;
      return true;
    },
    size: () => windows.size,
  };
}

/** The caller's address as the hosting platform reports it, or null if there is none. */
export function clientAddress(headers: { get(name: string): string | null }): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}
