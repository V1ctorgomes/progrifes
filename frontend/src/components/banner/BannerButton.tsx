import Link from "next/link";
import { cn } from "@/utils/cn";

type BannerButtonVariant = "primary" | "secondary" | "outline" | "outline-light";

interface BannerButtonProps {
  href?: string;
  children: string;
  variant?: BannerButtonVariant;
  className?: string;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02]";

const variantStyles: Record<BannerButtonVariant, string> = {
  primary: "bg-brand-black text-brand-white hover:bg-neutral-800 border border-brand-black shadow-sm",
  secondary: "bg-white text-brand-black hover:bg-neutral-50 border border-neutral-200 shadow-sm",
  outline:
    "bg-white text-brand-black border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-sm",
  "outline-light":
    "border border-white/80 bg-transparent text-white hover:bg-white hover:text-brand-black",
};

export function BannerButton({
  href = "#",
  children,
  variant = "primary",
  className,
}: BannerButtonProps) {
  const classNames = cn(baseStyles, variantStyles[variant], className);

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classNames}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classNames}>
      {children}
    </Link>
  );
}
