"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { goodsReceiptsAdminApi, suppliersAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import { GOODS_RECEIPT_SITUACAO_OPTIONS, type GoodsReceiptSituacao } from "@/types/goods-receipt";

export function GoodsReceiptsAdminPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [situacao, setSituacao] = useState<GoodsReceiptSituacao | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, situacao, supplierId, dataInicio, dataFim]);

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "receipts-filter"],
    queryFn: () => suppliersAdminApi.list({ limit: 200 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "goods-receipts",
      page,
      debouncedSearch,
      situacao,
      supplierId,
      dataInicio,
      dataFim,
    ],
    queryFn: () =>
      goodsReceiptsAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        situacao: situacao || undefined,
        supplierId: supplierId || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      }),
  });

  const receipts = data?.data ?? [];
  const meta = data?.meta;
  const suppliers = suppliersData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
            <Link href="/admin/compras" className="hover:text-brand-black">
              Compras
            </Link>
            <span>/</span>
            <span>Recebimentos</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Recebimentos
          </h1>
          <p className="text-sm text-brand-gray">
            Histórico de mercadorias recebidas e conferidas
          </p>
        </div>
        <Link href="/admin/compras">
          <Button variant="outline">Ordens de compra</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="OC, fornecedor, produto, SKU..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Situação</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as GoodsReceiptSituacao | "")}
          >
            {GOODS_RECEIPT_SITUACAO_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Fornecedor</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Todos</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nomeFantasia}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Data início"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <Input
          label="Data fim"
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando recebimentos...</p>
      ) : receipts.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum recebimento encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Recebimento</th>
                <th className="px-4 py-3 text-left">Ordem</th>
                <th className="px-4 py-3 text-left">Fornecedor</th>
                <th className="px-4 py-3 text-left">Itens</th>
                <th className="px-4 py-3 text-left">Valor</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-medium">{receipt.numeroFormatado}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/compras/${receipt.purchaseOrderId}`}
                      className="underline hover:no-underline"
                    >
                      {receipt.ordemNumeroFormatado}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{receipt.fornecedorNome}</td>
                  <td className="px-4 py-3">{receipt.itensCount}</td>
                  <td className="px-4 py-3">{formatCurrency(receipt.valorTotal)}</td>
                  <td className="px-4 py-3">{receipt.responsavel?.nome ?? "—"}</td>
                  <td className="px-4 py-3">
                    {new Date(receipt.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/compras/recebimentos/${receipt.id}`}
                      className="text-sm font-medium underline hover:no-underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-brand-gray">
            Página {meta.page} de {meta.totalPages} · {meta.total} recebimentos
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
