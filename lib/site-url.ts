// The site's public address: NEXT_PUBLIC_SITE_URL, then Vercel's deployment address,
// then localhost. One helper so metadata, the sitemap and structured data always agree.

export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
