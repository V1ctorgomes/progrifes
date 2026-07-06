import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface BannerCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export function BannerCard({ children, className, id, ariaLabel }: BannerCardProps) {
  return (
    <section id={id} className={cn("relative overflow-hidden", className)} aria-label={ariaLabel}>
      {children}
    </section>
  );
}
