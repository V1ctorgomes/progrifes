import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "sale" | "shipping" | "new";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-brand-black text-brand-white",
  sale: "bg-red-600 text-brand-white",
  shipping: "bg-emerald-600 text-brand-white",
  new: "bg-brand-accent text-brand-black",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
