"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileMenu } from "@/components/home/MobileMenu";
import { Input } from "@/components/ui/Input";
import { CartIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { Container } from "@/components/ui/Container";
import { navItems, storeInfo } from "@/lib/mock-data";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-brand-white/95 backdrop-blur-sm">
      <div className="hidden border-b border-neutral-100 bg-brand-black py-2 text-center text-xs text-brand-white sm:block">
        Frete grátis em compras acima de R$ 199,90
      </div>

      <Container className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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

            <Link
              href="/"
              className="font-display text-xl font-bold uppercase tracking-[0.3em] text-brand-black sm:text-2xl"
              aria-label={`${storeInfo.name} - Página inicial`}
            >
              {storeInfo.name}
            </Link>
          </div>

          <nav className="hidden lg:block" aria-label="Navegação principal">
            <ul className="flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs font-medium uppercase tracking-widest text-brand-black transition-colors hover:text-brand-gray"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden flex-1 justify-center px-8 md:flex lg:max-w-md">
            <Input
              type="search"
              placeholder="Buscar produtos..."
              aria-label="Buscar produtos"
              className="text-center"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="rounded p-2 hover:bg-brand-light md:hidden"
              aria-label="Buscar"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="rounded p-2 hover:bg-brand-light"
              aria-label="Favoritos"
            >
              <HeartIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="relative rounded p-2 hover:bg-brand-light"
              aria-label={`Carrinho com ${storeInfo.cartCount} itens`}
            >
              <CartIcon className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-black text-[10px] font-bold text-brand-white">
                {storeInfo.cartCount}
              </span>
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
