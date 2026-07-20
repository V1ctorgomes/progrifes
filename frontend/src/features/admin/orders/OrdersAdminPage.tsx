"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ordersAdminApi } from "@/lib/admin-api";
import { cn, formatCurrency } from "@/utils/cn";
import { PAYMENT_METHOD_LABELS, type OrderStatus } from "@/types/order";
import { ORDER_STATUS_OPTIONS, OrderStatusBadge } from "./OrderStatusBadge";

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-black hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
          <ShoppingCart className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-brand-black">{value}</p>
      {hint ? <p className="mt-2 text-xs font-medium text-neutral-400">{hint}</p> : null}
    </div>
  );
}

export function OrdersAdminPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dataInicio, dataFim]);

  const {
    data: dashboard,
    isFetching: isDashboardFetching,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["admin", "orders", "dashboard"],
    queryFn: ordersAdminApi.dashboard,
  });

  const { data, isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ["admin", "orders", page, debouncedSearch, status, dataInicio, dataFim],
    queryFn: () =>
      ordersAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        sort: "recent",
      }),
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const refreshing = isFetching || isDashboardFetching;

  const handleRefresh = () => {
    void refetch();
    void refetchDashboard();
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando pedidos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">
          Não foi possível carregar os pedidos.
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-4 rounded-xl bg-brand-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Pedidos
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Gestão operacional dos pedidos da loja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4 text-neutral-500", refreshing && "animate-spin")} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {dashboard ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard label="Pedidos Hoje" value={dashboard.pedidosHoje} />
          <SummaryCard label="Aguardando" value={dashboard.aguardando} />
          <SummaryCard label="Em Separação" value={dashboard.separando} />
          <SummaryCard label="Saiu para Entrega" value={dashboard.saiuEntrega} />
          <SummaryCard label="Entregues" value={dashboard.entregues} />
          <SummaryCard label="Cancelados" value={dashboard.cancelados} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-black">Filtros</h2>
            <p className="text-xs font-medium text-neutral-400">
              Busque por número, cliente, status ou período
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Pesquisar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nº, nome ou telefone..."
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
            <select
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
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
      </section>

      {orders.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-16 text-center shadow-sm">
          <Package className="h-10 w-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">Nenhum pedido encontrado.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-brand-black">Listagem</h2>
                <p className="text-xs font-medium text-neutral-400">
                  {meta?.total ?? orders.length} pedido
                  {(meta?.total ?? orders.length) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50/80">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Pedido
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Cliente
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Telefone
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Itens
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Pagamento
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Total
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Data
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-neutral-50/80">
                    <td className="px-5 py-4 font-mono font-semibold text-brand-black">
                      {order.numeroFormatado}
                    </td>
                    <td className="px-5 py-4 font-medium text-neutral-700">{order.clienteNome}</td>
                    <td className="px-5 py-4 text-neutral-500">{order.clienteTelefone}</td>
                    <td className="px-5 py-4 text-neutral-500">{order.itemCount}</td>
                    <td className="px-5 py-4 text-neutral-500">
                      {PAYMENT_METHOD_LABELS[order.formaPagamento]}
                    </td>
                    <td className="px-5 py-4 font-bold text-brand-black">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge label={order.statusLabel} color={order.statusCor} />
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-neutral-500">
                      {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="inline-flex h-9 items-center rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-neutral-500">
            Página {meta.page} de {meta.totalPages} — {meta.total} pedido(s)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
