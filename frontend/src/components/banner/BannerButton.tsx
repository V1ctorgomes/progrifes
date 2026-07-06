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
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]";

const variantStyles: Record<BannerButtonVariant, string> = {
  primary: "bg-brand-black text-brand-white hover:bg-brand-dark border border-brand-black",
  secondary: "bg-brand-white text-brand-black hover:bg-brand-light border border-brand-black",
  outline:
    "bg-transparent text-brand-black border border-brand-black hover:bg-brand-black hover:text-brand-white",
  "outline-light":
    "border border-brand-white bg-transparent text-brand-white hover:bg-brand-white hover:text-brand-black",
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
