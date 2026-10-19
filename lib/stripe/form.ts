// Stripe's API takes form-encoded bodies, with nested values written as
// a[b][0][c]=value. This turns a plain object into that format.

export type FormValue = string | number | boolean | null | undefined | FormValue[] | { [key: string]: FormValue };

function append(parts: string[], key: string, value: FormValue) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => append(parts, `${key}[${i}]`, item));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) append(parts, `${key}[${k}]`, v);
    return;
  }
  parts.push(`${encodeURIComponent(key).replace(/%5B/g, "[").replace(/%5D/g, "]")}=${encodeURIComponent(String(value))}`);
}

export function encodeForm(params: { [key: string]: FormValue }): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) append(parts, key, value);
  return parts.join("&");
}
