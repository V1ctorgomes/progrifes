"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/utils/cn";
import type { NavItem } from "@/types/home";
import { CloseIcon } from "@/components/ui/Icons";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        id="mobile-menu"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-brand-white shadow-xl transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Menu mobile"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <span className="font-display text-lg font-bold uppercase tracking-widest">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-brand-light"
            aria-label="Fechar menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <ul className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className="block rounded px-4 py-3 text-sm font-medium uppercase tracking-wide text-brand-black transition-colors hover:bg-brand-light"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
