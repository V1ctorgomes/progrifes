"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileMenu } from "@/components/home/MobileMenu";
import { CartIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { Container } from "@/components/ui/Container";
import { navItems, storeInfo } from "@/lib/mock-data";
import { cn } from "@/utils/cn";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-30 bg-brand-white">
      <div className="border-b border-neutral-100 bg-brand-black py-2 text-center text-[11px] text-brand-white">
        Frete grátis a partir de R$ 199,90
      </div>

      <Container>
        <div className="relative flex h-14 items-center justify-between sm:h-16">
          <button
            type="button"
            className="rounded p-2 hover:bg-brand-light lg:hidden"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  href={item.href}
                  className="text-xs font-medium uppercase tracking-widest text-brand-black transition-colors hover:opacity-70"
                >
                  {item.label}
                </Link>
                {item.children && activeMenu === item.label && (
                  <div className="absolute left-0 top-full z-50 min-w-[180px] border border-neutral-200 bg-brand-white py-2 shadow-lg">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2 text-xs text-brand-black hover:bg-brand-light"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <Link
            href="/"
            className={cn(
              "font-display text-lg font-bold uppercase tracking-[0.35em] text-brand-black sm:text-xl",
              "absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0",
            )}
            aria-label={`${storeInfo.name} - Página inicial`}
          >
            {storeInfo.name}
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded p-2 hover:bg-brand-light"
              aria-label="Buscar produtos"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="relative rounded p-2 hover:bg-brand-light"
              aria-label={`Carrinho com ${storeInfo.cartCount} itens`}
            >
              <CartIcon className="h-5 w-5" />
              {storeInfo.cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-black text-[10px] font-bold text-brand-white">
                  {storeInfo.cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Container>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={navItems}
      />
    </header>
  );
}
