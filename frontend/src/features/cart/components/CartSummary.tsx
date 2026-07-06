import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { CartTotals } from "@/types/cart";
import { formatCurrency } from "@/utils/cn";

interface CartSummaryProps {
  totals: CartTotals;
  showCheckout?: boolean;
  onCheckout?: () => void;
  checkoutHref?: string;
}

export function CartSummary({
  totals,
  showCheckout = true,
  onCheckout,
  checkoutHref = "/checkout",
}: CartSummaryProps) {
  return (
    <div className="space-y-3 border border-neutral-200 bg-brand-light p-4">
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
        Resumo do pedido
      </h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-brand-gray">
          <span>Subtotal</span>
          <span className="text-brand-black">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-brand-gray">
          <span>Taxa de entrega</span>
          <span>A calcular</span>
        </div>
        <div className="flex justify-between text-brand-gray">
          <span>Descontos</span>
          <span>—</span>
        </div>
        <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-semibold text-brand-black">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {showCheckout && (
        <div className="space-y-2 pt-2">
          {onCheckout ? (
            <Button fullWidth variant="whatsapp" onClick={onCheckout}>
              Finalizar pedido
            </Button>
          ) : (
            <Link href={checkoutHref}>
              <Button fullWidth variant="whatsapp" disabled>
                Finalizar pedido
              </Button>
            </Link>
          )}
          <p className="text-center text-xs text-brand-gray">
            Checkout via WhatsApp em breve
          </p>
        </div>
      )}
    </div>
  );
}
