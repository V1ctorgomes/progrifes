import Link from "next/link";
import { CartItem } from "@/features/cart/components/CartItem";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/cn";

interface MiniCartProps {
  onClose?: () => void;
}

export function MiniCart({ onClose }: MiniCartProps) {
  const { items, totals, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-brand-gray">Seu carrinho está vazio.</p>
        {onClose && (
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Continuar comprando
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex max-h-[70vh] flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <p className="mb-3 text-sm text-brand-gray">
          {totals.itemCount} {totals.itemCount === 1 ? "item" : "itens"}
        </p>
        <div className="space-y-1">
          {items.map((item) => (
            <CartItem
              key={item.varianteId}
              item={item}
              compact
              onUpdateQuantity={(quantity) => updateQuantity(item.varianteId, quantity)}
              onRemove={() => removeItem(item.varianteId)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-200 p-4">
        <div className="mb-4 flex items-center justify-between text-sm font-semibold text-brand-black">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="grid gap-2">
          <Link href="/carrinho" onClick={onClose}>
            <Button fullWidth variant="outline">
              Ver carrinho
            </Button>
          </Link>
          <Link href="/carrinho" onClick={onClose}>
            <Button fullWidth variant="whatsapp" disabled>
              Finalizar pedido
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
