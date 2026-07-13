"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Tags,
  PackageSearch,
  Settings2,
  ShoppingCart,
  Users,
  Building2,
  Receipt,
  Boxes,
  LineChart,
  Truck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/produtos", label: "Produtos", icon: PackageSearch },
  { href: "/admin/atributos", label: "Atributos", icon: Settings2 },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/fornecedores", label: "Fornecedores", icon: Building2 },
  { href: "/admin/compras", label: "Compras", icon: Receipt },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/financeiro", label: "Financeiro", icon: LineChart },
  { href: "/admin/entregas", label: "Entregas", icon: Truck },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
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
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-white text-brand-black">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-brand-white">
              Grifres ERP
            </p>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400">Administração</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-brand-white text-brand-black shadow-sm"
                      : "text-neutral-400 hover:bg-white/5 hover:text-brand-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      active ? "text-brand-black" : "text-neutral-400 group-hover:text-brand-white"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-brand-white">
            <span className="text-sm font-medium uppercase">
              {user?.nome?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-brand-white">{user?.nome || "Usuário"}</p>
            <p className="truncate text-xs text-neutral-400">{user?.cargo || "Administrador"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-neutral-300 transition-colors hover:bg-white/10 hover:text-brand-white"
        >
          <LogOut className="h-4 w-4" />
          Sair do sistema
        </button>
      </div>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-brand-black/40 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#0A0A0A] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <div className="flex min-h-screen flex-col lg:pl-[280px]">
          {/* Mobile Header */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 shadow-sm lg:hidden">
            <button
              type="button"
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-black transition-colors hover:bg-neutral-100"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-brand-black" />
              <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-black">
                Grifres ERP
              </p>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
