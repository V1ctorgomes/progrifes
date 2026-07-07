"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/fornecedores", label: "Fornecedores" },
  { href: "/admin/compras", label: "Compras" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/financeiro", label: "Financeiro" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-light">
        <header className="border-b border-neutral-200 bg-brand-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <p className="font-display text-xl font-semibold uppercase tracking-wider text-brand-black">
                Grifres ERP
              </p>
              <p className="text-sm text-brand-gray">
                {user?.nome} · {user?.cargo}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-brand-gray hover:text-brand-black">
                Ver loja
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded border border-brand-black px-4 py-2 text-xs font-medium uppercase tracking-wide hover:bg-brand-black hover:text-brand-white"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
          <aside className="lg:w-56">
            <nav className="flex flex-wrap gap-2 lg:flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded px-4 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-brand-black text-brand-white"
                      : "bg-brand-white text-brand-black hover:bg-neutral-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 rounded border border-neutral-200 bg-brand-white p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
