"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { StockOutputPrintView } from "@/features/admin/stock/StockOutputPrintView";
import { inventoryAdminApi } from "@/lib/admin-api";
import { formatMovementDate } from "@/types/inventory-output";

interface StockOutputDetailPageProps {
  outputId: string;
}

export function StockOutputDetailPage({ outputId }: StockOutputDetailPageProps) {
  const { data: output, isLoading, error } = useQuery({
    queryKey: ["admin", "inventory-output", outputId],
    queryFn: () => inventoryAdminApi.getOutputById(outputId),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando saída...</p>;
  }

  if (error || !output) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Saída não encontrada.</p>
        <Link href="/admin/estoque?tab=saidas" className="text-sm underline">
          Voltar para saídas
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
            <Link href="/admin/estoque?tab=saidas" className="hover:text-brand-black">
              Saídas
            </Link>
            <span>/</span>
            <span>{output.numeroFormatado ?? output.id.slice(0, 8)}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {output.numeroFormatado ?? "Saída de estoque"}
          </h1>
          <p className="text-sm text-brand-gray">{formatMovementDate(output.createdAt)}</p>
        </div>
        {!output.automatica && (
          <Button variant="outline" onClick={() => window.print()}>
            Imprimir comprovante
          </Button>
        )}
      </div>

      <div className="grid gap-4 border border-neutral-200 bg-brand-white p-6 print:hidden md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Produto</p>
          <p className="font-medium">{output.produtoNome}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Variante</p>
          <p>{output.varianteLabel}</p>
          <p className="font-mono text-sm">{output.sku}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Tipo</p>
          <p>{output.tipoSaidaLabel}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Quantidade</p>
          <p className="text-lg font-semibold">{output.quantidade}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Motivo</p>
          <p>{output.motivo ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Responsável</p>
          <p>{output.responsavelNome ?? "—"}</p>
        </div>
        {output.orderNumeroFormatado && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Pedido</p>
            <Link
              href={`/admin/pedidos/${output.orderId}`}
              className="text-sm underline"
            >
              {output.orderNumeroFormatado}
            </Link>
          </div>
        )}
        {output.saldoAnterior != null && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Saldo</p>
            <p>
              {output.saldoAnterior} → {output.saldoAtual ?? "—"}
            </p>
          </div>
        )}
        {output.documento && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Documento</p>
            <p>{output.documento}</p>
          </div>
        )}
        {output.observacoes && (
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Observações</p>
            <p className="whitespace-pre-wrap">{output.observacoes}</p>
          </div>
        )}
      </div>

      {!output.automatica && <StockOutputPrintView output={output} />}
    </div>
  );
}
