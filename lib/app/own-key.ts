/**
 * Looks up a value from a query string (?notice=..., ?error=...) in a fixed map of
 * messages. Only the map's own keys count: a plain `map[key]` would also find
 * inherited members such as "__proto__", "constructor" or "toString" and crash the
 * page that renders them. Anything else, including a repeated query value (an array),
 * gives undefined.
 */
export function ownValue<T>(map: Readonly<Record<string, T>>, key: unknown): T | undefined {
  return typeof key === "string" && Object.hasOwn(map, key) ? map[key] : undefined;
}
