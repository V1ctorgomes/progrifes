"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ordersAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import { PAYMENT_METHOD_LABELS, type OrderStatus } from "@/types/order";
import {
  ORDER_STATUS_OPTIONS,
  OrderStatusBadge,
} from "./OrderStatusBadge";

function DashboardCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
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

  const { data: dashboard } = useQuery({
    queryKey: ["admin", "orders", "dashboard"],
    queryFn: ordersAdminApi.dashboard,
  });

  const { data, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Pedidos
        </h1>
        <p className="text-sm text-brand-gray">Gestão operacional dos pedidos da loja</p>
      </div>

      {dashboard && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardCard label="Pedidos Hoje" value={dashboard.pedidosHoje} accent="#111" />
          <DashboardCard label="Aguardando" value={dashboard.aguardando} accent="#f59e0b" />
          <DashboardCard label="Em Separação" value={dashboard.separando} accent="#8b5cf6" />
          <DashboardCard
            label="Saiu para Entrega"
            value={dashboard.saiuEntrega}
            accent="#f97316"
          />
          <DashboardCard label="Entregues" value={dashboard.entregues} accent="#22c55e" />
          <DashboardCard label="Cancelados" value={dashboard.cancelados} accent="#ef4444" />
        </div>
      )}

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
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
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

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Pedido</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Itens</th>
                <th className="px-4 py-3 text-left">Pagamento</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-mono font-medium">{order.numeroFormatado}</td>
                  <td className="px-4 py-3">{order.clienteNome}</td>
                  <td className="px-4 py-3">{order.clienteTelefone}</td>
                  <td className="px-4 py-3">{order.itemCount}</td>
                  <td className="px-4 py-3">
                    {PAYMENT_METHOD_LABELS[order.formaPagamento]}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge label={order.statusLabel} color={order.statusCor} />
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-sm font-medium text-brand-black underline hover:no-underline"
                    >
                      Ver detalhes
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
            Página {meta.page} de {meta.totalPages} — {meta.total} pedido(s)
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
