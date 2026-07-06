import { formatCurrency, formatInstallment } from "@/utils/cn";
import { cn } from "@/utils/cn";

interface PriceProps {
  price: number;
  promotionalPrice?: number;
  installments?: number;
  className?: string;
}

export function Price({ price, promotionalPrice, installments, className }: PriceProps) {
  const displayPrice = promotionalPrice ?? price;
  const hasDiscount = promotionalPrice !== undefined && promotionalPrice < price;

  return (
    <div className={cn("space-y-0.5", className)}>
      {hasDiscount && (
        <p className="text-sm text-brand-gray line-through">{formatCurrency(price)}</p>
      )}
      <p className="text-base font-semibold text-brand-black">{formatCurrency(displayPrice)}</p>
      {installments && installments > 1 && (
        <p className="text-xs text-brand-gray">{formatInstallment(displayPrice, installments)}</p>
      )}
    </div>
  );
}
