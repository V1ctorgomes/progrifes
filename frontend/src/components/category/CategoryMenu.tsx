"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category } from "@/types/category";
import { getRootCategories, getSubcategories } from "@/lib/categories";
import { cn } from "@/utils/cn";
import { ChevronRightIcon } from "@/components/ui/Icons";

interface CategoryMenuProps {
  categories: Category[];
  className?: string;
  triggerClassName?: string;
}

export function CategoryMenu({ categories, className, triggerClassName }: CategoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const rootCategories = getRootCategories(categories);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setActiveParent(null);
      }}
    >
      <Link
        href="/categorias"
        className={
          triggerClassName ??
          "text-xs font-medium uppercase tracking-widest text-brand-black transition-colors hover:text-brand-gray"
        }
      >
        Categorias
      </Link>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 flex min-w-[320px] border border-neutral-200 bg-brand-white shadow-lg">
          <ul className="w-44 border-r border-neutral-100 py-2">
            {rootCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categorias/${category.slug}`}
                  onMouseEnter={() => setActiveParent(category.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm text-brand-black transition-colors hover:bg-brand-light",
                    activeParent === category.id && "bg-brand-light",
                  )}
                >
                  {category.nome}
                  {getSubcategories(categories, category.id).length > 0 && (
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {activeParent && getSubcategories(categories, activeParent).length > 0 && (
            <ul className="w-44 py-2">
              {getSubcategories(categories, activeParent).map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/categorias/${sub.slug}`}
                    className="block px-4 py-2.5 text-sm text-brand-gray transition-colors hover:bg-brand-light hover:text-brand-black"
                  >
                    {sub.nome}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
