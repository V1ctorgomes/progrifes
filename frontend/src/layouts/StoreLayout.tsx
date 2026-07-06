"use client";

import type { ReactNode } from "react";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import { CartProvider } from "@/features/cart/contexts/CartContext";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import type { Category } from "@/types/category";

interface StoreLayoutProps {
  children: ReactNode;
  categories: Category[];
}

export function StoreLayout({ children, categories }: StoreLayoutProps) {
  return (
    <CartProvider>
      <Navbar categories={categories} />
      {children}
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
