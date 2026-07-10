"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  deliveriesAdminApi,
  deliveryPersonsAdminApi,
  getErrorMessage,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  DELIVERY_STATUS_COLORS,
  DELIVERY_STATUS_OPTIONS,
  type DeliveryListItem,
  type DeliveryStatus,
} from "@/types/delivery-tracking";

function formatDateTime(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DashboardCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 text-xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export function DeliveriesAdminPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [deliveryPersonId, setDeliveryPersonId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, deliveryPersonId, dataInicio]);

  const { data: dashboard } = useQuery({
    queryKey: ["admin", "deliveries", "dashboard"],
    queryFn: () => deliveriesAdminApi.dashboard(),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "deliveries",
      page,
      debouncedSearch,
      status,
      deliveryPersonId,
      dataInicio,
    ],
    queryFn: () =>
      deliveriesAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        deliveryPersonId: deliveryPersonId || undefined,
        dataInicio: dataInicio || undefined,
      }),
  });

  const { data: deliveryPersons } = useQuery({
    queryKey: ["admin", "delivery-persons", "filter"],
    queryFn: () => deliveryPersonsAdminApi.list({ limit: 100 }),
  });

  const { data: availablePersons = [] } = useQuery({
    queryKey: ["admin", "delivery-persons", "available"],
    queryFn: () => deliveryPersonsAdminApi.listAvailable(),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin", "deliveries", detailId],
    queryFn: () => deliveriesAdminApi.getById(detailId!),
    enabled: Boolean(detailId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "deliveries"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: DeliveryStatus }) =>
      deliveriesAdminApi.updateStatus(id, nextStatus, statusNotes || undefined),
    onSuccess: async () => {
      setActionError("");
      setStatusNotes("");
      await invalidate();
      if (detailId) {
        await queryClient.invalidateQueries({ queryKey: ["admin", "deliveries", detailId] });
      }
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, personId }: { id: string; personId: string | null }) =>
      deliveriesAdminApi.assignDeliveryPerson(id, personId),
    onSuccess: async () => {
      setActionError("");
      setSelectedPersonId("");
      await invalidate();
      if (detailId) {
        await queryClient.invalidateQueries({ queryKey: ["admin", "deliveries", detailId] });
      }
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const deliveries = data?.data ?? [];
  const meta = data?.meta;
  const persons = deliveryPersons?.data ?? [];

  const openDetail = (delivery: DeliveryListItem) => {
    setActionError("");
    setStatusNotes("");
    setSelectedPersonId("");
    setDetailId(delivery.id);
  };

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              Acompanhamento de Entregas
            </h1>
            <p className="text-sm text-brand-gray">
              Painel operacional para acompanhar o fluxo logístico diário.
            </p>
          </div>
        </div>
      ) : null}

      {dashboard ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <DashboardCard label="Entregas hoje" value={dashboard.entregasHoje} />
          <DashboardCard label="Em aberto" value={dashboard.entregasEmAberto} accent="#f59e0b" />
          <DashboardCard label="Em andamento" value={dashboard.entregasEmAndamento} accent="#f97316" />
          <DashboardCard label="Concluídas" value={dashboard.entregasConcluidas} accent="#22c55e" />
          <DashboardCard label="Canceladas" value={dashboard.entregasCanceladas} accent="#ef4444" />
          <DashboardCard
            label="Tempo médio"
            value={`${dashboard.tempoMedioEntregaMinutos} min`}
          />
          <DashboardCard
            label="Top entregador"
            value={
              dashboard.entregadorComMaisEntregas
                ? `${dashboard.entregadorComMaisEntregas.name} (${dashboard.entregadorComMaisEntregas.total})`
                : "—"
            }
          />
        </div>
      ) : null}

      <div className="grid gap-3 border border-neutral-200 bg-brand-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pedido, cliente, telefone, entregador..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm text-brand-black focus:border-brand-black focus:outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value as DeliveryStatus | "")}
          >
            <option value="">Todos</option>
            {DELIVERY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Entregador</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm text-brand-black focus:border-brand-black focus:outline-none"
            value={deliveryPersonId}
            onChange={(event) => setDeliveryPersonId(event.target.value)}
          >
            <option value="">Todos</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="A partir de"
          type="date"
          value={dataInicio}
          onChange={(event) => setDataInicio(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Bairro</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Taxa</th>
              <th className="px-4 py-3">Entregador</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Previsão</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-brand-gray">
                  Carregando entregas...
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-brand-gray">
                  Nenhuma entrega encontrada.
                </td>
              </tr>
            ) : (
              deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-medium">
                    {delivery.order?.numeroFormatado ?? "—"}
                  </td>
                  <td className="px-4 py-3">{delivery.order?.clienteNome ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-gray">
                    {delivery.order?.clienteTelefone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-gray">{delivery.order?.bairro ?? "—"}</td>
                  <td className="px-4 py-3">
                    {delivery.order ? formatCurrency(delivery.order.total) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {delivery.order ? formatCurrency(delivery.order.taxaEntrega) : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-gray">
                    {delivery.deliveryPerson?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs uppercase ${DELIVERY_STATUS_COLORS[delivery.status]}`}
                    >
                      {delivery.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-gray">
                    {formatDateTime(delivery.order?.createdAt ?? null)}
                  </td>
                  <td className="px-4 py-3 text-brand-gray">
                    {formatDateTime(delivery.estimatedDeliveryAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(delivery)}
                      >
                        Gerenciar
                      </Button>
                      {delivery.order ? (
                        <Link href={`/admin/pedidos/${delivery.order.id}`}>
                          <Button type="button" variant="ghost" size="sm">
                            Pedido
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-brand-gray">
            Página {meta.page} de {meta.totalPages} · {meta.total} entrega(s)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={
          detail?.order
            ? `Entrega ${detail.order.numeroFormatado}`
            : "Detalhes da entrega"
        }
      >
        {detail ? (
          <div className="space-y-6">
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-brand-gray">Cliente</p>
                <p className="font-medium">{detail.order?.clienteNome}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-brand-gray">Status</p>
                <p className={`font-medium uppercase ${DELIVERY_STATUS_COLORS[detail.status]}`}>
                  {detail.statusLabel}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-brand-gray">Entregador</p>
                <p>{detail.deliveryPerson?.name ?? "Não atribuído"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-brand-gray">Previsão</p>
                <p>{formatDateTime(detail.estimatedDeliveryAt)}</p>
              </div>
            </div>

            {detail.nextStatuses.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
                  Alterar status
                </p>
                <textarea
                  className="mb-3 min-h-20 w-full border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Observações (opcional)"
                  value={statusNotes}
                  onChange={(event) => setStatusNotes(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {detail.nextStatuses.map((next) => (
                    <Button
                      key={next.value}
                      type="button"
                      size="sm"
                      variant={next.value === "CANCELADO" ? "outline" : "primary"}
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({ id: detail.id, nextStatus: next.value })
                      }
                      style={
                        next.value !== "CANCELADO"
                          ? { backgroundColor: next.cor, borderColor: next.cor }
                          : { color: next.cor, borderColor: next.cor }
                      }
                    >
                      {next.nome}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.status !== "ENTREGUE" && detail.status !== "CANCELADO" ? (
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
                  Atribuir entregador
                </p>
                <select
                  className="mb-2 w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
                  value={selectedPersonId}
                  onChange={(event) => setSelectedPersonId(event.target.value)}
                >
                  <option value="">Selecionar entregador disponível...</option>
                  {availablePersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!selectedPersonId || assignMutation.isPending}
                    onClick={() =>
                      assignMutation.mutate({ id: detail.id, personId: selectedPersonId })
                    }
                  >
                    Atribuir
                  </Button>
                  {detail.deliveryPersonId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={assignMutation.isPending}
                      onClick={() => assignMutation.mutate({ id: detail.id, personId: null })}
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide">Timeline</p>
              {detail.history.length === 0 ? (
                <p className="text-sm text-brand-gray">Nenhum registro no histórico.</p>
              ) : (
                <ol className="max-h-64 space-y-3 overflow-y-auto">
                  {detail.history.map((entry) => (
                    <li key={entry.id} className="border-b border-neutral-100 pb-3 last:border-0">
                      <p className="text-sm font-medium">
                        {entry.statusLabel}
                        {entry.notes ? ` — ${entry.notes}` : ""}
                      </p>
                      <p className="text-xs text-brand-gray">
                        {formatDateTime(entry.createdAt)}
                        {entry.usuario ? ` · ${entry.usuario.nome}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-gray">Carregando detalhes...</p>
        )}
      </Modal>
    </div>
  );
}
