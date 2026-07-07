"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { StockEntryPrintView } from "@/features/admin/stock/StockEntryPrintView";
import { inventoryAdminApi } from "@/lib/admin-api";
import { formatEntryDate } from "@/types/inventory-entry";

interface StockEntryDetailPageProps {
  entryId: string;
}

export function StockEntryDetailPage({ entryId }: StockEntryDetailPageProps) {
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ["admin", "inventory-entry", entryId],
    queryFn: () => inventoryAdminApi.getEntryById(entryId),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando entrada...</p>;
  }

  if (error || !entry) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Entrada não encontrada.</p>
        <Link href="/admin/estoque/entradas" className="text-sm underline">
          Voltar para entradas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
            <Link href="/admin/estoque" className="hover:text-brand-black">
              Estoque
            </Link>
            <span>/</span>
            <Link href="/admin/estoque/entradas" className="hover:text-brand-black">
              Entradas
            </Link>
            <span>/</span>
            <span>{entry.numeroFormatado}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {entry.numeroFormatado}
          </h1>
          <p className="text-sm text-brand-gray">{formatEntryDate(entry.dataEntrada)}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          Imprimir comprovante
        </Button>
      </div>

      <div className="grid gap-4 border border-neutral-200 bg-brand-white p-6 print:hidden md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Produto</p>
          <p className="font-medium">{entry.produtoNome}</p>
          <p className="text-sm text-brand-gray">{entry.categoriaNome}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Variante</p>
          <p>{entry.varianteLabel}</p>
          <p className="font-mono text-sm">{entry.sku}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Tipo</p>
          <p>{entry.tipoLabel}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Quantidade</p>
          <p className="text-lg font-semibold">{entry.quantidade}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Responsável</p>
          <p>{entry.responsavelNome ?? "—"}</p>
          {entry.responsavelEmail && (
            <p className="text-sm text-brand-gray">{entry.responsavelEmail}</p>
          )}
        </div>
        {entry.valorUnitario != null && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Valor unitário</p>
            <p>
              {entry.valorUnitario.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        )}
        {entry.documento && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Documento</p>
            <p>{entry.documento}</p>
          </div>
        )}
        {entry.notaFiscal && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Nota fiscal</p>
            <p>{entry.notaFiscal}</p>
          </div>
        )}
        {entry.fornecedor && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Fornecedor</p>
            <p>{entry.fornecedor}</p>
          </div>
        )}
        {entry.movimento && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Saldo</p>
            <p>
              {entry.movimento.saldoAnterior ?? "—"} → {entry.movimento.saldoAtual ?? "—"}
            </p>
          </div>
        )}
        {entry.observacoes && (
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Observações</p>
            <p className="whitespace-pre-wrap">{entry.observacoes}</p>
          </div>
        )}
      </div>

      <StockEntryPrintView entry={entry} />
    </div>
  );
}
