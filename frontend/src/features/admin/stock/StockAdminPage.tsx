"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { categoriesAdminApi, inventoryAdminApi } from "@/lib/admin-api";
import {
  formatVariantLabel,
  STOCK_STATUS_FILTER_OPTIONS,
} from "@/types/inventory";

function AlertCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export function StockAdminPage({ embedded = false }: { embedded?: boolean }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [produtoAtivo, setProdutoAtivo] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, categoriaId, produtoAtivo]);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesAdminApi.list,
  });

  const { data: alerts } = useQuery({
    queryKey: ["admin", "inventory", "alerts"],
    queryFn: inventoryAdminApi.getAlerts,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory", page, debouncedSearch, status, categoriaId, produtoAtivo],
    queryFn: () =>
      inventoryAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        categoriaId: categoriaId || undefined,
        produtoAtivo:
          produtoAtivo === "all" ? undefined : produtoAtivo === "active",
        sort: "disponivel_asc",
      }),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              Estoque
            </h1>
            <p className="text-sm text-brand-gray">
              Controle centralizado de saldo, reservas e disponibilidade por variante
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/estoque?tab=entradas">
              <Button variant="outline">Entradas</Button>
            </Link>
            <Link href="/admin/estoque?tab=saidas">
              <Button variant="outline">Saídas</Button>
            </Link>
            <Link href="/admin/estoque?tab=movimentacoes">
              <Button variant="outline">Movimentações</Button>
            </Link>
            <Link href="/admin/estoque?tab=inventarios">
              <Button variant="outline">Inventários</Button>
            </Link>
          </div>
        </div>
      ) : null}

      {alerts && (
        <div className="grid gap-3 sm:grid-cols-3">
          <AlertCard label="Estoque baixo" value={alerts.estoqueBaixo} accent="#f59e0b" />
          <AlertCard label="Sem estoque" value={alerts.semEstoque} accent="#ef4444" />
          <AlertCard label="Com reserva" value={alerts.comReserva} accent="#2563eb" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Produto, SKU, categoria..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STOCK_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={produtoAtivo}
            onChange={(e) => setProdutoAtivo(e.target.value as typeof produtoAtivo)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando estoque...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum item encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">Variante</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Reservado</th>
                <th className="px-4 py-3 text-left">Disponível</th>
                <th className="px-4 py-3 text-left">Mínimo</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-medium">{item.produtoNome}</td>
                  <td className="px-4 py-3">{formatVariantLabel(item)}</td>
                  <td className="px-4 py-3 font-mono">{item.sku}</td>
                  <td className="px-4 py-3">{item.categoriaNome}</td>
                  <td className="px-4 py-3">{item.quantidadeTotal}</td>
                  <td className="px-4 py-3">{item.quantidadeReservada}</td>
                  <td className="px-4 py-3 font-medium">{item.quantidadeDisponivel}</td>
                  <td className="px-4 py-3">{item.estoqueMinimo}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: item.statusCor }}
                    >
                      {item.statusLabel}
                    </span>
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
            Página {meta.page} de {meta.totalPages} — {meta.total} variante(s)
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
