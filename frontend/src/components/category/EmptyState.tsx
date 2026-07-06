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
        "flex flex-col items-center justify-center rounded border border-dashed border-neutral-300 bg-brand-light px-6 py-16 text-center",
        className,
      )}
    >
      <h3 className="font-display text-lg font-bold uppercase tracking-wider text-brand-black">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-brand-gray">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
