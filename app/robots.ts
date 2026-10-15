import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/learn/seo";

// Search engines may read every public page, but not the logged-in app, the API,
// the sign-in links or the admin page. The one exception inside /api is /api/og/, the
// share-card pictures: X and LinkedIn obey robots.txt for card images. The longest
// matching rule wins, so "Allow: /api/og/" beats "Disallow: /api" for those paths only.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/api/og/"], disallow: ["/app", "/api", "/auth", "/admin"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
