import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm",
        className,
      )}
    >
      <h3 className="font-display text-lg font-bold tracking-tight text-brand-black">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-neutral-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
