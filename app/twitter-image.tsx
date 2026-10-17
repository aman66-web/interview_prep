import { ImageResponse } from "next/og";
import { BrandImage, IMAGE_SIZE } from "@/lib/share/images";
import { siteConfig } from "@/site.config";

// The same default picture for X (Twitter) cards. Drawn at build time.

export const alt = `${siteConfig.brandName}: ${siteConfig.tagline}`;
export const size = IMAGE_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<BrandImage />, { ...size });
}
