import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

interface BannerNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  variant?: "light" | "dark";
  className?: string;
}

export function BannerNavigation({
  onPrev,
  onNext,
  variant = "light",
  className,
}: BannerNavigationProps) {
  const buttonStyles =
    variant === "light"
      ? "bg-brand-white/20 text-brand-white backdrop-blur hover:bg-brand-white/40"
      : "bg-brand-black/10 text-brand-black backdrop-blur hover:bg-brand-black/20";

  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        className={cn(
          "absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 transition sm:block",
          buttonStyles,
          className,
        )}
        aria-label="Slide anterior"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className={cn(
          "absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 transition sm:block",
          buttonStyles,
          className,
        )}
        aria-label="Próximo slide"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
    </>
  );
}
