import { ImageResponse } from "next/og";
import { BrandImage, IMAGE_SIZE } from "@/lib/share/images";
import { siteConfig } from "@/site.config";

// The default picture shown when any page of the site is shared (pages with their
// own picture, such as share cards, override it). Drawn at build time.

export const alt = `${siteConfig.brandName}: ${siteConfig.tagline}`;
export const size = IMAGE_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<BrandImage />, { ...size });
}
