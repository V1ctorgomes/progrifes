"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import type { Category } from "@/types/category";
import type { NavItem } from "@/types/home";
import { CloseIcon, ChevronRightIcon } from "@/components/ui/Icons";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  categories: Category[];
  rootCategories: Category[];
}

export function MobileMenu({
  isOpen,
  onClose,
  items,
  categories,
  rootCategories,
}: MobileMenuProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getChildren = (parentId: string) =>
    categories.filter((c) => c.categoriaPai === parentId && c.ativo);

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

        <ul className="flex-1 overflow-y-auto p-4">
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

          <li className="mt-4 border-t border-neutral-200 pt-4">
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-brand-gray">
              Categorias
            </p>
            {rootCategories.map((category) => {
              const children = getChildren(category.id);
              const isExpanded = expandedCategory === category.id;

              return (
                <div key={category.id}>
                  {children.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCategory(isExpanded ? null : category.id)
                        }
                        className="flex w-full items-center justify-between rounded px-4 py-3 text-sm font-medium uppercase tracking-wide text-brand-black"
                      >
                        {category.nome}
                        <ChevronRightIcon
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <ul className="pb-2 pl-4">
                          <li>
                            <Link
                              href={`/categorias/${category.slug}`}
                              onClick={onClose}
                              className="block rounded px-4 py-2 text-sm text-brand-gray hover:text-brand-black"
                            >
                              Ver tudo
                            </Link>
                          </li>
                          {children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/categorias/${child.slug}`}
                                onClick={onClose}
                                className="block rounded px-4 py-2 text-sm text-brand-gray hover:text-brand-black"
                              >
                                {child.nome}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/categorias/${category.slug}`}
                      onClick={onClose}
                      className="block rounded px-4 py-3 text-sm font-medium uppercase tracking-wide text-brand-black hover:bg-brand-light"
                    >
                      {category.nome}
                    </Link>
                  )}
                </div>
              );
            })}
            <Link
              href="/categorias"
              onClick={onClose}
              className="mt-2 block rounded px-4 py-2 text-sm text-brand-accent hover:underline"
            >
              Ver todas as categorias
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
