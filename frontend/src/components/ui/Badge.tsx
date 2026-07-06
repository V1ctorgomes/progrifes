import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "sale" | "shipping";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-brand-black text-brand-white",
  sale: "bg-brand-black text-brand-white",
  shipping: "bg-brand-black text-brand-white",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
