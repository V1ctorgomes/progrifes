"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

const navItems: Array<{ href: string; label: string; disabled?: boolean }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/atributos", label: "Atributos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/fornecedores", label: "Fornecedores" },
  { href: "/admin/compras", label: "Compras" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/entregas", label: "Entregas" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const sidebarContent = (
    <>
      <div className="border-b border-neutral-800 px-5 py-5">
        <p className="font-display text-lg font-semibold uppercase tracking-wider text-brand-white">
          Grifres ERP
        </p>
        <p className="mt-1 text-xs text-neutral-400">Painel administrativo</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);

            if (item.disabled) {
              return (
                <li key={item.href}>
                  <span className="flex items-center rounded-md px-3 py-2.5 text-sm text-neutral-500">
                    {item.label}
                    <span className="ml-auto text-[10px] uppercase tracking-wide">Em breve</span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-white text-brand-black"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-brand-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-800 px-4 py-4">
        <p className="truncate text-sm font-medium text-brand-white">{user?.nome}</p>
        <p className="truncate text-xs text-neutral-400">{user?.cargo}</p>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-3 w-full rounded border border-neutral-600 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-300 transition-colors hover:border-brand-white hover:text-brand-white"
        >
          Sair
        </button>
      </div>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-light">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-black transition-transform duration-200 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </aside>

        <div className="flex min-h-screen flex-col lg:pl-64">
          <div className="flex items-center gap-3 px-4 py-3 lg:hidden">
            <button
              type="button"
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
              className="rounded-md p-2 text-brand-black hover:bg-neutral-100"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <MenuIcon open={sidebarOpen} />
            </button>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-black">
              Grifres ERP
            </p>
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
