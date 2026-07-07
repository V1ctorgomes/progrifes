"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PurchaseOrderForm } from "@/features/admin/purchase-orders/PurchaseOrderForm";
import { PurchaseOrderStatusBadge } from "@/features/admin/purchase-orders/PurchaseOrderStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, purchaseOrdersAdminApi, suppliersAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  PURCHASE_ORDER_STATUS_OPTIONS,
  type PurchaseOrderInput,
  type PurchaseOrderStatus,
} from "@/types/purchase-order";

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

function canWritePurchases(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("purchases:write");
}

export function PurchaseOrdersAdminPage() {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canCreate = canWritePurchases(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, supplierId, dataInicio, dataFim]);

  const { data: dashboard } = useQuery({
    queryKey: ["admin", "purchase-orders", "dashboard"],
    queryFn: purchaseOrdersAdminApi.dashboard,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "filter"],
    queryFn: () => suppliersAdminApi.list({ limit: 200 }),
  });

  const suppliers = suppliersData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "purchase-orders",
      page,
      debouncedSearch,
      status,
      supplierId,
      dataInicio,
      dataFim,
    ],
    queryFn: () =>
      purchaseOrdersAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        supplierId: supplierId || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      }),
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "purchase-orders"] });

  const createMutation = useMutation({
    mutationFn: (payload: PurchaseOrderInput) => purchaseOrdersAdminApi.create(payload),
    onSuccess: async (order) => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
      window.location.href = `/admin/compras/${order.id}`;
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Ordens de Compra
          </h1>
          <p className="text-sm text-brand-gray">
            Gerencie solicitações de compra e acompanhe o status com fornecedores
          </p>
        </div>
        {canCreate && (
          <Button className="hidden md:inline-flex" onClick={() => setModalOpen(true)}>
            Nova ordem
          </Button>
        )}
        <Link href="/admin/compras/recebimentos">
          <Button variant="outline">Recebimentos</Button>
        </Link>
      </div>

      {dashboard && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardCard label="Rascunhos" value={dashboard.rascunho} accent="#6b7280" />
          <DashboardCard label="Aguardando" value={dashboard.aguardando} accent="#f59e0b" />
          <DashboardCard label="Aprovadas" value={dashboard.aprovadas} accent="#3b82f6" />
          <DashboardCard label="Enviadas" value={dashboard.enviadas} accent="#8b5cf6" />
          <DashboardCard label="Recebidas" value={dashboard.recebidas} accent="#22c55e" />
          <DashboardCard label="Canceladas" value={dashboard.canceladas} accent="#ef4444" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nº OC, fornecedor, produto, pedido..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | "")}
          >
            {PURCHASE_ORDER_STATUS_OPTIONS.map((option) => (
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

      {canCreate && (
        <Button className="md:hidden" onClick={() => setModalOpen(true)}>
          Nova ordem
        </Button>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando ordens...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhuma ordem encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Fornecedor</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Previsão</th>
                <th className="px-4 py-3 text-left">Itens</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-medium">{order.numeroFormatado}</td>
                  <td className="px-4 py-3">{order.fornecedorNome}</td>
                  <td className="px-4 py-3">
                    {new Date(order.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.previsaoEntrega).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{order.itensCount}</td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <PurchaseOrderStatusBadge
                      label={order.statusLabel}
                      color={order.statusCor}
                    />
                  </td>
                  <td className="px-4 py-3">{order.responsavel?.nome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/compras/${order.id}`}
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
            Página {meta.page} de {meta.totalPages} · {meta.total} ordens
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

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError("");
        }}
        title="Nova ordem de compra"
      >
        <PurchaseOrderForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
          error={formError}
        />
      </Modal>
    </div>
  );
}
