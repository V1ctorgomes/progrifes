"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryMenu } from "@/components/category/CategoryMenu";
import { MobileMenu } from "@/components/home/MobileMenu";
import { Input } from "@/components/ui/Input";
import { CartIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/features/cart/hooks/useCart";
import { getRootCategories } from "@/lib/categories";
import { navItems, storeInfo } from "@/lib/mock-data";
import type { Category } from "@/types/category";

interface NavbarProps {
  categories: Category[];
}

const navLinkClassName =
  "inline-flex h-10 items-center text-xs font-medium uppercase tracking-widest text-brand-black transition-colors hover:text-brand-gray";

export function Navbar({ categories }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totals, openCart, isHydrated } = useCart();
  const cartCount = isHydrated ? totals.itemCount : 0;
  const rootCategories = getRootCategories(categories);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-brand-white/95 backdrop-blur-sm">
      <div className="hidden border-b border-neutral-100 bg-brand-black py-2 text-center text-xs text-brand-white sm:block">
        Frete grátis em compras acima de R$ 199,90
      </div>

      <Container className="py-3">
        <div className="flex min-h-14 items-center gap-4 lg:gap-6">
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded hover:bg-brand-light lg:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="inline-flex h-10 items-center font-display text-xl font-bold uppercase leading-none tracking-[0.3em] text-brand-black sm:text-2xl"
              aria-label={`${storeInfo.name} - Página inicial`}
            >
              {storeInfo.name}
            </Link>
          </div>

          <nav
            className="hidden shrink-0 items-center gap-6 xl:gap-8 lg:flex"
            aria-label="Navegação principal"
          >
            {navItems
              .filter((item) => item.label !== "Categorias")
              .map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClassName}>
                  {item.label}
                </Link>
              ))}
            <CategoryMenu categories={categories} triggerClassName={navLinkClassName} />
          </nav>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
            <div className="hidden w-full max-w-[220px] items-center md:flex lg:max-w-xs xl:max-w-sm">
              <Input
                type="search"
                placeholder="Buscar produtos..."
                aria-label="Buscar produtos"
                wrapperClassName="flex items-center"
                className="h-10 py-2 normal-case"
              />
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded hover:bg-brand-light md:hidden"
                aria-label="Buscar"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded hover:bg-brand-light"
                aria-label="Favoritos"
              >
                <HeartIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded hover:bg-brand-light"
                aria-label={`Carrinho com ${cartCount} itens`}
                onClick={openCart}
              >
                <CartIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-black text-[10px] font-bold text-brand-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </Container>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={navItems}
        categories={categories}
        rootCategories={rootCategories}
      />
    </header>
  );
}
