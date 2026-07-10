"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DeliveriesAdminPage } from "@/features/admin/delivery/DeliveriesAdminPage";
import { DeliveryPersonsAdminPage } from "@/features/admin/delivery/DeliveryPersonsAdminPage";
import { DeliverySettingsAdminPage } from "@/features/admin/delivery/DeliverySettingsAdminPage";
import { NeighborhoodsAdminPage } from "@/features/admin/delivery/NeighborhoodsAdminPage";
import { cn } from "@/utils/cn";

const TABS = [
  { id: "entregas", label: "Entregas" },
  { id: "entregadores", label: "Entregadores" },
  { id: "bairros", label: "Bairros" },
  { id: "configuracoes", label: "Configurações" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseTab(tab: string | null): TabId {
  if (tab === "entregadores" || tab === "bairros" || tab === "configuracoes") return tab;
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
          Acompanhe entregas, cadastre entregadores, gerencie bairros e configure a operação em um só lugar.
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

      {activeTab === "entregas" && <DeliveriesAdminPage embedded />}
      {activeTab === "entregadores" && <DeliveryPersonsAdminPage embedded />}
      {activeTab === "bairros" && <NeighborhoodsAdminPage embedded />}
      {activeTab === "configuracoes" && <DeliverySettingsAdminPage embedded />}
    </div>
  );
}
