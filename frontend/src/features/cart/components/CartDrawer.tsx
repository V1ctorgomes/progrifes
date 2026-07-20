"use client";

import { X } from "lucide-react";
import { MiniCart } from "@/features/cart/components/MiniCart";
import { useCart } from "@/features/cart/hooks/useCart";

export function CartDrawer() {
  const { isOpen, closeCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-brand-black/40 backdrop-blur-sm"
        onClick={closeCart}
        aria-label="Fechar carrinho"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-neutral-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold tracking-tight text-brand-black">
            Carrinho
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-black"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <MiniCart onClose={closeCart} />
      </aside>
    </div>
  );
}
