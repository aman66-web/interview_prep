// The image loader for next/image (next.config.ts `images.loaderFile`). Our photos are
// static files made ahead of time in two widths: the original (up to 1600 px, 2400 for
// 21:9) and an 800 px copy beside it ("<name>-800.webp"). Frames up to 800 px wide get
// the small copy, larger ones the original. Nothing is resized on the fly, so there is no
// image-optimisation service to pay for (rule 2.6). tests/images.test.ts checks every
// photo has its small copy.

export const SMALL_WIDTH = 800;

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith("/images/") || !src.endsWith(".webp")) return src;
  return width <= SMALL_WIDTH ? src.replace(/\.webp$/, `-${SMALL_WIDTH}.webp`) : src;
}
