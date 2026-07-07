"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { StockAuditPrintView } from "@/features/admin/stock/StockAuditPrintView";
import { getErrorMessage, inventoryAdminApi } from "@/lib/admin-api";
import { useAuth } from "@/hooks/useAuth";
import {
  AUDIT_STATUS_COLORS,
  formatAuditDate,
} from "@/types/inventory-audit";

interface StockAuditDetailPageProps {
  auditId: string;
}

function canWriteStock(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("stock:write");
}

export function StockAuditDetailPage({ auditId }: StockAuditDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWriteStock(permissions);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");

  const { data: audit, isLoading, error } = useQuery({
    queryKey: ["admin", "inventory-audit", auditId],
    queryFn: () => inventoryAdminApi.getAuditById(auditId),
  });

  useEffect(() => {
    if (audit) {
      const initial: Record<string, string> = {};
      for (const item of audit.itens) {
        initial[item.id] =
          item.quantidadeFisica != null ? String(item.quantidadeFisica) : "";
      }
      setCounts(initial);
    }
  }, [audit]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-audit", auditId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-audits"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-movements"] });
  };

  const startMutation = useMutation({
    mutationFn: () => inventoryAdminApi.startAudit(auditId),
    onSuccess: invalidate,
    onError: (e) => setActionError(getErrorMessage(e)),
  });

  const pauseMutation = useMutation({
    mutationFn: () => inventoryAdminApi.pauseAudit(auditId),
    onSuccess: invalidate,
    onError: (e) => setActionError(getErrorMessage(e)),
  });

  const recountMutation = useMutation({
    mutationFn: (itemIds?: string[]) => inventoryAdminApi.recountAudit(auditId, itemIds),
    onSuccess: async () => {
      setActionError("");
      await invalidate();
    },
    onError: (e) => setActionError(getErrorMessage(e)),
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const items = audit!.itens.map((item) => {
        const value = counts[item.id];
        if (value === "" || Number.isNaN(Number(value))) {
          throw new Error("Preencha a quantidade física de todos os itens");
        }
        return { itemId: item.id, quantidadeFisica: Number(value) };
      });
      await inventoryAdminApi.updateAuditCounts(auditId, items);
      return inventoryAdminApi.finishAudit(auditId);
    },
    onSuccess: invalidate,
    onError: (e) => setActionError(getErrorMessage(e)),
  });

  const saveCountsMutation = useMutation({
    mutationFn: (items: Array<{ itemId: string; quantidadeFisica: number }>) =>
      inventoryAdminApi.updateAuditCounts(auditId, items),
    onSuccess: async () => {
      setActionError("");
      await invalidate();
    },
    onError: (e) => setActionError(getErrorMessage(e)),
  });

  const isCounting = audit?.status === "EM_ANDAMENTO";
  const canEditCounts = isCounting && canWrite;
  const previewDivergencias = useMemo(() => {
    if (!audit) return 0;
    return audit.itens.filter((item) => {
      const value = counts[item.id];
      if (value === "") return false;
      return Number(value) !== item.quantidadeSistema;
    }).length;
  }, [audit, counts]);

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando inventário...</p>;
  }

  if (error || !audit) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Inventário não encontrado.</p>
        <Link href="/admin/estoque/inventarios" className="text-sm underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
            <Link href="/admin/estoque" className="hover:text-brand-black">
              Estoque
            </Link>
            <span>/</span>
            <Link href="/admin/estoque/inventarios" className="hover:text-brand-black">
              Inventários
            </Link>
            <span>/</span>
            <span>{audit.numeroFormatado}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {audit.nome}
          </h1>
          <p className="text-sm text-brand-gray">
            {audit.numeroFormatado} — {formatAuditDate(audit.dataInventario)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {audit.status === "FINALIZADO" && (
            <Button variant="outline" onClick={() => window.print()}>
              Imprimir relatório
            </Button>
          )}
          {canWrite && audit.status === "RASCUNHO" && (
            <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              Iniciar contagem
            </Button>
          )}
          {canWrite && audit.status === "PAUSADO" && (
            <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              Continuar
            </Button>
          )}
          {canWrite && audit.status === "EM_ANDAMENTO" && (
            <>
              <Button
                variant="outline"
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
              >
                Pausar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Limpar todas as contagens para recontagem?")) {
                    recountMutation.mutate(undefined);
                  }
                }}
                disabled={recountMutation.isPending}
              >
                Recontar tudo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const items = Object.entries(counts)
                    .filter(([, value]) => value !== "")
                    .map(([itemId, value]) => ({
                      itemId,
                      quantidadeFisica: Number(value),
                    }));
                  if (!items.length) {
                    setActionError("Informe ao menos uma quantidade física");
                    return;
                  }
                  saveCountsMutation.mutate(items);
                }}
                disabled={saveCountsMutation.isPending}
              >
                Salvar contagens
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    confirm(
                      "Confirmar inventário e aplicar ajustes? Esta ação não pode ser desfeita.",
                    )
                  ) {
                    finalizeMutation.mutate();
                  }
                }}
                disabled={finalizeMutation.isPending}
              >
                Finalizar e ajustar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <SummaryCard label="Status" value={audit.statusLabel} color={AUDIT_STATUS_COLORS[audit.status]} />
        <SummaryCard label="Tipo" value={audit.tipoLabel} />
        <SummaryCard
          label="Conferidos"
          value={`${audit.resumo.itensConferidos} / ${audit.resumo.totalItens}`}
        />
        <SummaryCard label="Divergências" value={String(audit.resumo.divergencias)} />
        <SummaryCard label="Total ajustado" value={String(audit.resumo.totalAjustado)} />
        <SummaryCard label="Responsável" value={audit.responsavelNome} />
        {isCounting && (
          <SummaryCard label="Divergências (rascunho)" value={String(previewDivergencias)} />
        )}
      </div>

      {actionError && <p className="text-sm text-red-600 print:hidden">{actionError}</p>}

      <div className="overflow-x-auto print:hidden">
        <table className="min-w-full border border-neutral-200 text-sm">
          <thead className="bg-brand-light">
            <tr>
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="px-4 py-3 text-left">Variante</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Sistema</th>
              <th className="px-4 py-3 text-left">Físico</th>
              <th className="px-4 py-3 text-left">Diferença</th>
              <th className="px-4 py-3 text-left">Ajuste</th>
              {canEditCounts && <th className="px-4 py-3 text-left">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {audit.itens.map((item) => {
              const draftValue = counts[item.id] ?? "";
              const draftDiff =
                draftValue !== "" ? Number(draftValue) - item.quantidadeSistema : null;

              return (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">{item.produtoNome}</td>
                  <td className="px-4 py-3">{item.varianteLabel}</td>
                  <td className="px-4 py-3 font-mono">{item.sku}</td>
                  <td className="px-4 py-3 font-medium">{item.quantidadeSistema}</td>
                  <td className="px-4 py-3">
                    {canEditCounts ? (
                      <input
                        type="number"
                        min={0}
                        className="w-24 border border-neutral-300 px-2 py-1"
                        value={draftValue}
                        onChange={(e) =>
                          setCounts((current) => ({ ...current, [item.id]: e.target.value }))
                        }
                      />
                    ) : (
                      (item.quantidadeFisica ?? "—")
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEditCounts && draftDiff != null
                      ? draftDiff
                      : (item.diferenca ?? "—")}
                  </td>
                  <td className="px-4 py-3">{item.tipoAjusteLabel ?? "—"}</td>
                  {canEditCounts && (
                    <td className="px-4 py-3">
                      {item.contado && (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => recountMutation.mutate([item.id])}
                        >
                          Recontar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {audit.status === "FINALIZADO" && <StockAuditPrintView audit={audit} />}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      {color ? (
        <span
          className="mt-1 inline-block rounded px-2 py-0.5 text-sm text-white"
          style={{ backgroundColor: color }}
        >
          {value}
        </span>
      ) : (
        <p className="mt-1 font-medium">{value}</p>
      )}
    </div>
  );
}
