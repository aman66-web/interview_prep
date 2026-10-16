import Image from "next/image";
import type { CSSProperties } from "react";
import type { Photo as PhotoData } from "@/lib/images";
import { cn } from "@/lib/ui/cn";

// A photo from lib/images.ts in a frame that sets its size. The frame (className) gives the
// shape: an aspect ratio or a height, plus the radius. The picture fills it (next/image `fill`)
// and is cropped around the photo's focal point, so nothing shifts while it loads.
//
// - `sizes` must say how wide the frame is at each breakpoint, so phones get small files.
// - `preload` only for the one photo at the top of a page; everything else loads lazily.
// - `decorative` for photos inside a link or used as a backdrop: alt="" and hidden from
//   screen readers (the text nearby says it all). Otherwise the photo's alt text is used.
// - Bright photos are softened in dark mode (`darkDim` in the registry).

const DARK_DIM = {
  0.85: "dark:brightness-[0.85]",
  0.9: "dark:brightness-90",
} as const;

export function Photo({
  photo,
  sizes,
  className,
  imageClassName,
  preload = false,
  decorative = false,
  objectPosition,
  ring = true,
  backdrop = true,
  style,
}: {
  photo: PhotoData;
  sizes: string;
  className?: string;
  imageClassName?: string;
  preload?: boolean;
  decorative?: boolean;
  /** Overrides the photo's own focal point for this slot. */
  objectPosition?: string;
  /** A hairline edge, so pale photos don't melt into a pale page. */
  ring?: boolean;
  /** A soft grey behind the photo while it loads (off for photos that fade into the page). */
  backdrop?: boolean;
  style?: CSSProperties;
}) {
  const hidden = decorative || photo.decorative === true;
  // The frame is the positioned parent next/image needs; a frame placed with `absolute` already is one.
  const positioned = /(^|\s)(absolute|fixed)(\s|$)/.test(className ?? "");
  return (
    <div className={cn(!positioned && "relative", "overflow-hidden", backdrop && "bg-surface-3", className)} style={style} aria-hidden={hidden || undefined}>
      <Image
        src={photo.src}
        alt={hidden ? "" : photo.alt}
        fill
        sizes={sizes}
        preload={preload}
        className={cn("object-cover", photo.darkDim ? DARK_DIM[photo.darkDim] : null, imageClassName)}
        style={{ objectPosition: objectPosition ?? photo.objectPosition ?? "50% 50%" }}
      />
      {ring ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]" /> : null}
    </div>
  );
}
