"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { CartItem } from "@/features/cart/components/CartItem";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/hooks/useCart";
import { StoreLayout } from "@/layouts/StoreLayout";
import { getDeliverySettings } from "@/lib/delivery-api";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Category } from "@/types/category";

interface CartPageProps {
  categories: Category[];
}

export function CartPage({ categories }: CartPageProps) {
  return (
    <StoreLayout categories={categories}>
      <CartPageContent />
    </StoreLayout>
  );
}

function CartPageContent() {
  const { items, totals, updateQuantity, removeItem, clearCart } = useCart();
  const { data: deliverySettings } = useQuery({
    queryKey: ["delivery", "settings"],
    queryFn: getDeliverySettings,
    staleTime: 60_000,
  });

  const canCheckout = deliverySettings?.availability.canAcceptOrders ?? true;
  const checkoutDisabledReason = !deliverySettings?.enabled
    ? "As entregas estão temporariamente indisponíveis."
    : !deliverySettings?.availability.isOpenNow
      ? deliverySettings?.closedMessage
      : undefined;

  return (
    <main className="animate-fade-in py-8 sm:py-12">
      <Container>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
              Carrinho
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {totals.itemCount} {totals.itemCount === 1 ? "item" : "itens"}
            </p>
          </div>
          {items.length > 0 ? (
            <Button variant="ghost" onClick={clearCart}>
              Esvaziar carrinho
            </Button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-16 text-center shadow-sm">
            <ShoppingBag className="h-10 w-10 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-500">Seu carrinho está vazio.</p>
            <Link href="/" className="mt-2 inline-block">
              <Button variant="outline">Continuar comprando</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-100 bg-white px-4 shadow-sm sm:px-5">
              {items.map((item) => (
                <CartItem
                  key={item.varianteId}
                  item={item}
                  onUpdateQuantity={(quantity) => updateQuantity(item.varianteId, quantity)}
                  onRemove={() => removeItem(item.varianteId)}
                />
              ))}
            </div>

            <CartSummary
              totals={totals}
              canCheckout={canCheckout}
              checkoutDisabledReason={checkoutDisabledReason}
              deliveryMessage={deliverySettings?.message}
              minimumOrderValue={deliverySettings?.minimumOrderValue ?? 0}
            />
          </div>
        )}
      </Container>
    </main>
  );
}
