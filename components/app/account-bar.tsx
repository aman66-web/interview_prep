"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * The signed-in area's top bar (Dashboard and Account tabs, plan badge, Log out).
 * In the interview room it is left out on laptop and desktop screens, so the room can
 * fill the screen with the reply box in view; the room has its own "Leave for now"
 * link and the site header keeps its Dashboard button. Phones still show it.
 */
export function AccountBar({ children, className }: { children: ReactNode; className?: string }) {
  const inRoom = usePathname().startsWith("/app/interview/");
  return <div className={cn(className, inRoom && "lg:hidden")}>{children}</div>;
}
