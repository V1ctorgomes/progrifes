"use client";

import { MiniCart } from "@/features/cart/components/MiniCart";
import { useCart } from "@/features/cart/hooks/useCart";

export function CartDrawer() {
  const { isOpen, closeCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-brand-black/40"
        onClick={closeCart}
        aria-label="Fechar carrinho"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-brand-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
            Carrinho
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded p-2 text-brand-gray hover:bg-brand-light hover:text-brand-black"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <MiniCart onClose={closeCart} />
      </aside>
    </div>
  );
}
