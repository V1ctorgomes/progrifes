"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { inventoryAdminApi } from "@/lib/admin-api";
import { formatMovementDate } from "@/types/inventory-output";

interface StockMovementDetailPageProps {
  movementId: string;
}

export function StockMovementDetailPage({ movementId }: StockMovementDetailPageProps) {
  const { data: movement, isLoading, error } = useQuery({
    queryKey: ["admin", "inventory-movement", movementId],
    queryFn: () => inventoryAdminApi.getMovementById(movementId),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando movimentação...</p>;
  }

  if (error || !movement) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Movimentação não encontrada.</p>
        <Link href="/admin/estoque?tab=movimentacoes" className="text-sm underline">
          Voltar para movimentações
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
          <Link href="/admin/estoque" className="hover:text-brand-black">
            Estoque
          </Link>
          <span>/</span>
          <Link href="/admin/estoque?tab=movimentacoes" className="hover:text-brand-black">
            Movimentações
          </Link>
          <span>/</span>
          <span>{movement.id.slice(0, 8)}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Movimentação de estoque
        </h1>
        <p className="text-sm text-brand-gray">{formatMovementDate(movement.createdAt)}</p>
      </div>

      <div className="grid gap-4 border border-neutral-200 bg-brand-white p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Origem</p>
          <p>{movement.categoriaOrigemLabel}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Tipo</p>
          <p>{movement.origemLabel ?? movement.tipoLabel}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Produto</p>
          <p className="font-medium">{movement.produtoNome}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Variante</p>
          <p>{movement.varianteLabel}</p>
          <p className="font-mono text-sm">{movement.sku}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Quantidade</p>
          <p className="text-lg font-semibold">{movement.quantidade}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Saldo</p>
          <p>
            {movement.saldoAnterior != null
              ? `${movement.saldoAnterior} → ${movement.saldoAtual ?? "—"}`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-gray">Responsável</p>
          <p>{movement.responsavelNome ?? "Sistema"}</p>
        </div>
        {movement.motivo && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Motivo</p>
            <p>{movement.motivo}</p>
          </div>
        )}
        {movement.documento && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Documento</p>
            <p>{movement.documento}</p>
          </div>
        )}
        {movement.orderNumeroFormatado && movement.orderId && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Pedido</p>
            <Link href={`/admin/pedidos/${movement.orderId}`} className="text-sm underline">
              {movement.orderNumeroFormatado}
            </Link>
          </div>
        )}
        {movement.entryNumeroFormatado && movement.entryId && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Entrada</p>
            <Link href={`/admin/estoque/entradas/${movement.entryId}`} className="text-sm underline">
              {movement.entryNumeroFormatado}
            </Link>
          </div>
        )}
        {movement.observacoes && (
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Observações</p>
            <p className="whitespace-pre-wrap">{movement.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
