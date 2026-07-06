import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { getItemSubtotal } from "@/features/cart/services/cart-service";
import type { CartItem as CartItemType } from "@/types/cart";
import { formatCurrency } from "@/utils/cn";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  compact?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onRemove, compact = false }: CartItemProps) {
  return (
    <article className={`flex gap-3 ${compact ? "" : "border-b border-neutral-200 py-4"}`}>
      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-brand-light sm:h-24 sm:w-20">
        {item.imagem && (
          <Image src={item.imagem} alt={item.nome} fill className="object-cover" sizes="80px" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-medium text-brand-black">{item.nome}</h3>
            <div className="mt-1 space-y-0.5 text-xs text-brand-gray">
              {item.cor && <p>Cor: {item.cor}</p>}
              {item.tamanho && <p>Tamanho: {item.tamanho}</p>}
              <p>SKU: {item.sku}</p>
            </div>
          </div>
          {!compact && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-brand-gray underline hover:text-brand-black"
            >
              Remover
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              className="px-2.5 py-1 text-sm hover:bg-brand-light"
              onClick={() => onUpdateQuantity(item.quantidade - 1)}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="min-w-[2rem] px-2 text-center text-sm">{item.quantidade}</span>
            <button
              type="button"
              className="px-2.5 py-1 text-sm hover:bg-brand-light"
              onClick={() => onUpdateQuantity(item.quantidade + 1)}
              aria-label="Aumentar quantidade"
              disabled={item.quantidade >= item.estoqueMax}
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs text-brand-gray">{formatCurrency(item.preco)}</p>
            <p className="text-sm font-semibold text-brand-black">
              {formatCurrency(getItemSubtotal(item))}
            </p>
          </div>
        </div>

        {compact && (
          <Button size="sm" variant="ghost" onClick={onRemove} className="self-start px-0">
            Remover
          </Button>
        )}
      </div>
    </article>
  );
}
