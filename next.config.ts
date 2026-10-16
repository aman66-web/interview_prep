import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only the site's own photos (public/images, listed in lib/images.ts) are resized, at one quality.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    qualities: [75],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Sign-in links carry a one-time token; never leak it in a Referer header.
        source: "/auth/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
