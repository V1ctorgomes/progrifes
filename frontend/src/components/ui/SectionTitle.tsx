import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface SectionTitleProps {
  title: string;
  className?: string;
  id?: string;
}

export function SectionTitle({ title, className, id }: SectionTitleProps) {
  return (
    <h2
      id={id}
      className={cn(
        "mb-6 text-center font-display text-xl font-bold uppercase tracking-[0.2em] text-brand-black sm:mb-8 sm:text-2xl",
        className,
      )}
    >
      {title}
    </h2>
  );
}

interface ProductSectionProps {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function ProductSection({ id, title, children, className }: ProductSectionProps) {
  return (
    <section id={id} className={cn("py-10 sm:py-14", className)} aria-label={title}>
      <SectionTitle title={title} id={id ? `${id}-title` : undefined} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5">
        {children}
      </div>
    </section>
  );
}
