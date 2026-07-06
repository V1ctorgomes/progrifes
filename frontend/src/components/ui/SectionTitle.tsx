import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}

export function SectionTitle({
  title,
  subtitle,
  align = "center",
  className,
  action,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-2 sm:mb-10",
        align === "center" && "items-center text-center",
        align === "left" && "items-start text-left",
        action != null && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-brand-black sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-brand-gray sm:text-base">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
