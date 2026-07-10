"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DeliveriesAdminPage } from "@/features/admin/delivery/DeliveriesAdminPage";
import { DeliveryPersonsAdminPage } from "@/features/admin/delivery/DeliveryPersonsAdminPage";
import { NeighborhoodsAdminPage } from "@/features/admin/delivery/NeighborhoodsAdminPage";
import { cn } from "@/utils/cn";

const TABS = [
  { id: "entregas", label: "Entregas" },
  { id: "entregadores", label: "Entregadores" },
  { id: "bairros", label: "Bairros" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseTab(tab: string | null): TabId {
  if (tab === "entregadores" || tab === "bairros") return tab;
  return "entregas";
}

export function DeliveryHubAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "entregas") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      router.replace(query ? `/admin/entregas?${query}` : "/admin/entregas", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Operação de Entregas
        </h1>
        <p className="mt-1 text-sm text-brand-gray">
          Acompanhe entregas, cadastre entregadores e gerencie bairros e taxas em um só lugar.
        </p>
        <Link
          href="/admin/configuracoes/entrega"
          className="mt-2 inline-block text-sm underline"
        >
          Configurações de entrega
        </Link>
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

      {activeTab === "entregas" && <DeliveriesAdminPage embedded />}
      {activeTab === "entregadores" && <DeliveryPersonsAdminPage embedded />}
      {activeTab === "bairros" && <NeighborhoodsAdminPage embedded />}
    </div>
  );
}
