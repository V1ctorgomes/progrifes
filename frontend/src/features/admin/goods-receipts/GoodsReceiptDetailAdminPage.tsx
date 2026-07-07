"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  GoodsReceiptPrintView,
  printGoodsReceipt,
} from "@/features/admin/goods-receipts/GoodsReceiptPrintView";
import { goodsReceiptsAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";

export function GoodsReceiptDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["admin", "goods-receipts", id],
    queryFn: () => goodsReceiptsAdminApi.getById(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando recebimento...</p>;
  }

  if (!receipt) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Recebimento não encontrado.</p>
        <Link href="/admin/compras/recebimentos" className="text-sm underline">
          Voltar para recebimentos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/compras/recebimentos"
            className="text-sm text-brand-gray hover:text-brand-black"
          >
            ← Recebimentos
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {receipt.numeroFormatado}
          </h1>
          <p className="text-sm text-brand-gray">
            Ordem{" "}
            <Link href={`/admin/compras/${receipt.purchaseOrderId}`} className="underline">
              {receipt.ordemNumeroFormatado}
            </Link>{" "}
            · {new Date(receipt.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={printGoodsReceipt}>
          Imprimir
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Fornecedor</p>
          <p className="mt-1 font-medium">{receipt.fornecedor.nomeFantasia}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Responsável</p>
          <p className="mt-1">{receipt.responsavel?.nome ?? "—"}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Valor</p>
          <p className="mt-1 font-medium">{formatCurrency(receipt.valorTotal)}</p>
        </div>
      </div>

      {receipt.contaPagar && (
        <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-900">Conta a pagar gerada</p>
          <p className="text-emerald-800">
            {receipt.contaPagar.numeroFormatado} — {formatCurrency(receipt.contaPagar.valor)} —{" "}
            {receipt.contaPagar.status}
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-medium text-brand-black">Itens recebidos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-right">Pedida</th>
                <th className="px-4 py-3 text-right">Recebida</th>
                <th className="px-4 py-3 text-right">Unit.</th>
              </tr>
            </thead>
            <tbody>
              {receipt.itens.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">{item.produtoNome}</td>
                  <td className="px-4 py-3">{item.sku}</td>
                  <td className="px-4 py-3 text-right">{item.quantidadePedida}</td>
                  <td className="px-4 py-3 text-right">{item.quantidadeRecebida}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.valorUnitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {receipt.observacoes && (
        <section>
          <h2 className="mb-2 font-medium text-brand-black">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-brand-gray">{receipt.observacoes}</p>
        </section>
      )}

      <GoodsReceiptPrintView receipt={receipt} />
    </div>
  );
}
