"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import type { NavItem } from "@/types/home";
import { ChevronRightIcon, CloseIcon } from "@/components/ui/Icons";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

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
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        id="mobile-menu"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-brand-white shadow-xl transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menu mobile"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <span className="font-display text-base font-bold uppercase tracking-[0.3em]">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-brand-light"
            aria-label="Fechar menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto p-2">
          {items.map((item) => (
            <li key={item.label} className="border-b border-neutral-100">
              {item.children ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === item.label ? null : item.label)
                    }
                    className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium uppercase tracking-wide text-brand-black"
                  >
                    {item.label}
                    <ChevronRightIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expanded === item.label && "rotate-90",
                      )}
                    />
                  </button>
                  {expanded === item.label && (
                    <ul className="bg-brand-light pb-2">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className="block px-8 py-2.5 text-sm text-brand-gray hover:text-brand-black"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block px-4 py-4 text-sm font-medium uppercase tracking-wide text-brand-black"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
