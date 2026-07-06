import { cn } from "@/utils/cn";

interface BannerIndicatorsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  variant?: "light" | "dark";
}

export function BannerIndicators({
  total,
  current,
  onSelect,
  variant = "light",
}: BannerIndicatorsProps) {
  if (total <= 1) return null;

  return (
    <div className="flex gap-2" role="tablist" aria-label="Indicadores do carrossel">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          onClick={() => onSelect(index)}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index === current
              ? "w-8"
              : "w-4 opacity-40 hover:opacity-70",
            variant === "light" ? "bg-brand-white" : "bg-brand-black",
          )}
          aria-label={`Ir para slide ${index + 1}`}
          aria-selected={index === current}
        />
      ))}
    </div>
  );
}
