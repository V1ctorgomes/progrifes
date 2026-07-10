"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  inventoryAdminApi,
  productsAdminApi,
} from "@/lib/admin-api";
import {
  formatMovementDate,
  MOVEMENT_TYPE_OPTIONS,
} from "@/types/inventory-output";

export function StockMovementsAdminPage({ embedded = false }: { embedded?: boolean }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tipo, produtoId, dataInicio]);

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products", "movements-filter"],
    queryFn: () => productsAdminApi.list({ limit: 200, ativo: true }),
  });

  const products = productsData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "inventory-movements",
      page,
      debouncedSearch,
      tipo,
      produtoId,
      dataInicio,
    ],
    queryFn: () =>
      inventoryAdminApi.listMovements({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        tipo: tipo || undefined,
        produtoId: produtoId || undefined,
        dataInicio: dataInicio || undefined,
      }),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
              <Link href="/admin/estoque" className="hover:text-brand-black">
                Estoque
              </Link>
              <span>/</span>
              <span>Movimentações</span>
            </div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              Central de Movimentações
            </h1>
            <p className="text-sm text-brand-gray">
              Histórico unificado de entradas, saídas e movimentações de pedidos
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Produto, SKU, documento, responsável..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {MOVEMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
          >
            <option value="">Todos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.nome}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="A partir de"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando movimentações...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhuma movimentação encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Origem</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Qtd</th>
                <th className="px-4 py-3 text-left">Saldo</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">{formatMovementDate(item.createdAt)}</td>
                  <td className="px-4 py-3">{item.categoriaOrigemLabel}</td>
                  <td className="px-4 py-3">
                    {item.origemLabel ?? item.tipoLabel}
                  </td>
                  <td className="px-4 py-3 font-medium">{item.produtoNome}</td>
                  <td className="px-4 py-3 font-mono">{item.sku}</td>
                  <td className="px-4 py-3 font-medium">{item.quantidade}</td>
                  <td className="px-4 py-3">
                    {item.saldoAnterior != null
                      ? `${item.saldoAnterior} → ${item.saldoAtual ?? "—"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{item.responsavelNome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/estoque/movimentacoes/${item.id}`}
                      className="text-sm underline"
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
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-brand-gray">
            Página {meta.page} de {meta.totalPages} — {meta.total} movimentação(ões)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
