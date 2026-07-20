import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { CartTotals } from "@/types/cart";
import { formatCurrency } from "@/utils/cn";

interface CartSummaryProps {
  totals: CartTotals;
  showCheckout?: boolean;
  onCheckout?: () => void;
  checkoutHref?: string;
  canCheckout?: boolean;
  checkoutDisabledReason?: string;
  deliveryMessage?: string;
  minimumOrderValue?: number;
  shippingFee?: number | null;
  deliveryTimeMinutes?: number | null;
}

export function CartSummary({
  totals,
  showCheckout = true,
  onCheckout,
  checkoutHref = "/checkout",
  canCheckout = true,
  checkoutDisabledReason,
  deliveryMessage,
  minimumOrderValue = 0,
  shippingFee = null,
  deliveryTimeMinutes = null,
}: CartSummaryProps) {
  const belowMinimum =
    minimumOrderValue > 0 && totals.subtotal < minimumOrderValue;
  const checkoutBlocked = !canCheckout || belowMinimum;
  const displayShipping = shippingFee ?? totals.shipping;
  const displayTotal =
    displayShipping !== null && displayShipping !== undefined
      ? totals.subtotal + displayShipping
      : totals.total;
  const disabledMessage =
    checkoutDisabledReason ??
    (belowMinimum
      ? `Pedido mínimo para entrega: ${formatCurrency(minimumOrderValue)}`
      : undefined);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold tracking-tight text-brand-black">
        Resumo do pedido
      </h2>

      {deliveryMessage ? (
        <p className="whitespace-pre-line text-xs font-medium text-neutral-500">{deliveryMessage}</p>
      ) : null}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="font-medium text-brand-black">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Taxa de entrega</span>
          <span className="font-medium text-brand-black">
            {displayShipping === null || displayShipping === undefined
              ? "A calcular"
              : formatCurrency(displayShipping)}
          </span>
        </div>
        {deliveryTimeMinutes ? (
          <div className="flex justify-between text-neutral-500">
            <span>Prazo estimado</span>
            <span className="font-medium text-brand-black">{deliveryTimeMinutes} min</span>
          </div>
        ) : null}
        <div className="flex justify-between text-neutral-500">
          <span>Descontos</span>
          <span>—</span>
        </div>
        <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-bold text-brand-black">
          <span>Total</span>
          <span>{formatCurrency(displayTotal)}</span>
        </div>
      </div>

      {showCheckout && (
        <div className="space-y-2 pt-2">
          {checkoutBlocked ? (
            <p className="text-sm text-red-600">{disabledMessage}</p>
          ) : onCheckout ? (
            <Button fullWidth variant="whatsapp" onClick={onCheckout}>
              Finalizar pedido
            </Button>
          ) : (
            <Link href={checkoutHref}>
              <Button fullWidth variant="whatsapp">
                Finalizar pedido
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
