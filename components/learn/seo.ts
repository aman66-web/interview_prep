import { absoluteUrl, siteUrl } from "@/lib/site-url";
import { siteConfig } from "@/site.config";

export { absoluteUrl, siteUrl };

// Absolute URLs and structured data for the learn pages, the sitemap and robots.txt.
// The base URL comes from lib/site-url.ts. Structured data names only the site itself
// as author and publisher: no invented people, logos or ratings (rule 2.4).

const organization = () => ({ "@type": "Organization", name: siteConfig.brandName, url: siteUrl() });

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export function articleJsonLd({ headline, description, path, dateModified }: { headline: string; description: string; path: string; dateModified: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    dateModified,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: "en",
    isAccessibleForFree: true,
    author: organization(),
    publisher: organization(),
  };
}

/**
 * Open Graph for one page. A page's openGraph replaces the layout's whole object,
 * so the site name and type are repeated here.
 */
export function pageOpenGraph({ title, description, path, type = "website", modifiedTime }: { title: string; description: string; path: string; type?: "website" | "article"; modifiedTime?: string }) {
  return type === "article"
    ? { type, siteName: siteConfig.brandName, title, description, url: path, ...(modifiedTime ? { modifiedTime } : {}) }
    : { type, siteName: siteConfig.brandName, title, description, url: path };
}
