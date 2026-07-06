"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  buildCartItemInput,
  calculateTotals,
  clearCartItems,
  loadCartItems,
  mergeCartItem,
  removeCartItem,
  saveCartItems,
  updateCartItemQuantity,
} from "@/features/cart/services/cart-service";
import type { CartActionResult, CartItem, CartItemInput, CartTotals } from "@/types/cart";
import type { Product } from "@/types/product";
import type { ProductVariant } from "@/types/variant";

interface CartContextValue {
  items: CartItem[];
  totals: CartTotals;
  isOpen: boolean;
  isHydrated: boolean;
  lastMessage: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: CartItemInput, quantity?: number) => CartActionResult;
  addProduct: (
    product: Product,
    variant?: ProductVariant | null,
    quantity?: number,
  ) => CartActionResult;
  updateQuantity: (varianteId: string, quantity: number) => CartActionResult;
  removeItem: (varianteId: string) => void;
  clearCart: () => void;
  clearMessage: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadCartItems());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveCartItems(items);
  }, [items, isHydrated]);

  const totals = useMemo(() => calculateTotals(items), [items]);

  const persistItems = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
  }, []);

  const addItem = useCallback(
    (input: CartItemInput, quantity = 1): CartActionResult => {
      const result = addCartItem(items, input, quantity);
      if (!result.success) {
        setLastMessage(result.message ?? null);
        return result;
      }

      const nextItems = mergeCartItem(items, input, quantity);
      persistItems(nextItems);
      setLastMessage(result.message ?? null);
      return result;
    },
    [items, persistItems],
  );

  const addProduct = useCallback(
    (product: Product, variant?: ProductVariant | null, quantity = 1): CartActionResult => {
      if (product.variantes?.length && !variant) {
        const message = "Selecione as opções do produto";
        setLastMessage(message);
        return { success: false, message };
      }

      if (variant && !variant.ativo) {
        const message = "Esta variante não está disponível";
        setLastMessage(message);
        return { success: false, message };
      }

      if (variant && variant.estoque <= 0) {
        const message = "Produto sem estoque";
        setLastMessage(message);
        return { success: false, message };
      }

      return addItem(buildCartItemInput(product, variant), quantity);
    },
    [addItem],
  );

  const updateQuantity = useCallback(
    (varianteId: string, quantity: number): CartActionResult => {
      const result = updateCartItemQuantity(items, varianteId, quantity);
      if (!result.success) {
        setLastMessage(result.message ?? null);
        return result;
      }

      persistItems(result.items);
      return { success: true };
    },
    [items, persistItems],
  );

  const removeItem = useCallback(
    (varianteId: string) => {
      persistItems(removeCartItem(items, varianteId));
    },
    [items, persistItems],
  );

  const clearCart = useCallback(() => {
    persistItems(clearCartItems());
  }, [persistItems]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totals,
      isOpen,
      isHydrated,
      lastMessage,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((current) => !current),
      addItem,
      addProduct,
      updateQuantity,
      removeItem,
      clearCart,
      clearMessage: () => setLastMessage(null),
    }),
    [
      items,
      totals,
      isOpen,
      isHydrated,
      lastMessage,
      addItem,
      addProduct,
      updateQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
}
