"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { StockAdminPage } from "@/features/admin/stock/StockAdminPage";
import { StockAuditsAdminPage } from "@/features/admin/stock/StockAuditsAdminPage";
import { StockEntriesAdminPage } from "@/features/admin/stock/StockEntriesAdminPage";
import { StockMovementsAdminPage } from "@/features/admin/stock/StockMovementsAdminPage";
import { StockOutputsAdminPage } from "@/features/admin/stock/StockOutputsAdminPage";
import { cn } from "@/utils/cn";

const TABS = [
  { id: "estoque", label: "Estoque" },
  { id: "entradas", label: "Entradas" },
  { id: "saidas", label: "Saídas" },
  { id: "movimentacoes", label: "Movimentações" },
  { id: "inventarios", label: "Inventários" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseTab(tab: string | null): TabId {
  if (
    tab === "entradas" ||
    tab === "saidas" ||
    tab === "movimentacoes" ||
    tab === "inventarios"
  ) {
    return tab;
  }
  return "estoque";
}

export function StockHubAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "estoque") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      router.replace(query ? `/admin/estoque?${query}` : "/admin/estoque", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Controle de Estoque
        </h1>
        <p className="mt-1 text-sm text-brand-gray">
          Consulte saldos, registre entradas e saídas, acompanhe movimentações e faça inventários.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-brand-black text-brand-black"
                : "text-brand-gray hover:text-brand-black",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "estoque" && <StockAdminPage embedded />}
      {activeTab === "entradas" && <StockEntriesAdminPage embedded />}
      {activeTab === "saidas" && <StockOutputsAdminPage embedded />}
      {activeTab === "movimentacoes" && <StockMovementsAdminPage embedded />}
      {activeTab === "inventarios" && <StockAuditsAdminPage embedded />}
    </div>
  );
}
