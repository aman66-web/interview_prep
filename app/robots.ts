import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/learn/seo";

// Search engines may read every public page, but not the logged-in app, the API,
// the sign-in links or the admin page.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/api", "/auth", "/admin"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
