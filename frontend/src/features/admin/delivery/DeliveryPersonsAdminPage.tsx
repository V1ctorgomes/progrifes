"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deliveryPersonsAdminApi, getErrorMessage } from "@/lib/admin-api";
import {
  DELIVERY_PERSON_STATUS_COLORS,
  DELIVERY_PERSON_STATUS_OPTIONS,
  type CreateDeliveryPersonInput,
  type DeliveryPerson,
  type DeliveryPersonStatus,
} from "@/types/delivery-person";

const emptyForm: CreateDeliveryPersonInput = {
  name: "",
  phone: "",
  cpf: "",
  document: "",
  status: "DISPONIVEL",
  notes: "",
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatDateTime(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeliveryPersonsAdminPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryPersonStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DeliveryPerson | null>(null);
  const [form, setForm] = useState<CreateDeliveryPersonInput>(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: dashboard } = useQuery({
    queryKey: ["admin", "delivery-persons", "dashboard"],
    queryFn: () => deliveryPersonsAdminApi.dashboard(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "delivery-persons", page, debouncedSearch, statusFilter],
    queryFn: () =>
      deliveryPersonsAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin", "delivery-persons", detailId],
    queryFn: () => deliveryPersonsAdminApi.getById(detailId!),
    enabled: Boolean(detailId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "delivery-persons"] });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (person: DeliveryPerson) => {
    setEditing(person);
    setForm({
      name: person.name,
      phone: person.phone,
      cpf: person.cpf ?? "",
      document: person.document ?? "",
      status: person.status,
      notes: person.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        cpf: form.cpf?.trim() || undefined,
        document: form.document?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
      if (editing) {
        return deliveryPersonsAdminApi.update(editing.id, payload);
      }
      return deliveryPersonsAdminApi.create(payload);
    },
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeliveryPersonStatus }) =>
      deliveryPersonsAdminApi.updateStatus(id, status),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deliveryPersonsAdminApi.remove,
    onSuccess: invalidate,
  });

  const persons = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div
        className={
          embedded
            ? "flex flex-wrap items-center justify-end gap-3"
            : "flex flex-wrap items-center justify-between gap-3"
        }
      >
        {!embedded ? (
          <div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              Entregadores
            </h1>
            <p className="text-sm text-brand-gray">
              Cadastre entregadores, controle disponibilidade e acompanhe desempenho.
            </p>
            <Link
              href="/admin/entregas?tab=configuracoes"
              className="mt-2 inline-block text-sm underline"
            >
              ← Configurações de entrega
            </Link>
          </div>
        ) : null}
        <Button type="button" onClick={openCreate}>
          Novo entregador
        </Button>
      </div>

      {dashboard ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="border border-neutral-200 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Ativos</p>
            <p className="mt-1 text-2xl font-semibold text-brand-black">
              {dashboard.entregadoresAtivos}
            </p>
          </div>
          <div className="border border-neutral-200 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Disponíveis</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {dashboard.entregadoresDisponiveis}
            </p>
          </div>
          <div className="border border-neutral-200 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Em rota</p>
            <p className="mt-1 text-2xl font-semibold text-blue-700">
              {dashboard.entregadoresEmRota}
            </p>
          </div>
          <div className="border border-neutral-200 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Total entregas</p>
            <p className="mt-1 text-2xl font-semibold text-brand-black">
              {dashboard.totalEntregas}
            </p>
          </div>
          <div className="border border-neutral-200 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Mais entregas</p>
            <p className="mt-1 text-sm font-semibold text-brand-black">
              {dashboard.entregadorComMaisEntregas
                ? `${dashboard.entregadorComMaisEntregas.name} (${dashboard.entregadorComMaisEntregas.total})`
                : "—"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 border border-neutral-200 bg-brand-white p-4 md:grid-cols-2">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome, telefone, CPF..."
        />
        <div>
          <label className="mb-1 block text-xs text-brand-gray">Status</label>
          <select
            className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as DeliveryPersonStatus | "all")
            }
          >
            <option value="all">Todos</option>
            {DELIVERY_PERSON_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entregas</th>
              <th className="px-4 py-3">Última entrega</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-brand-gray">
                  Carregando entregadores...
                </td>
              </tr>
            ) : persons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-brand-gray">
                  Nenhum entregador cadastrado.
                </td>
              </tr>
            ) : (
              persons.map((person) => (
                <tr key={person.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-medium text-brand-black">{person.name}</td>
                  <td className="px-4 py-3 text-brand-gray">{formatPhone(person.phone)}</td>
                  <td className="px-4 py-3 text-brand-gray">{person.cpf ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs uppercase ${DELIVERY_PERSON_STATUS_COLORS[person.status]}`}
                    >
                      {person.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-gray">
                    {person.stats?.totalDeliveries ?? 0}
                  </td>
                  <td className="px-4 py-3 text-brand-gray">
                    {formatDateTime(person.stats?.lastDeliveryAt ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailId(person.id)}
                      >
                        Histórico
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(person)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Excluir o entregador ${person.name}?`)) {
                            deleteMutation.mutate(person.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
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
            Página {meta.page} de {meta.totalPages} · {meta.total} entregador(es)
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar entregador" : "Novo entregador"}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <Input
            label="Nome *"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label="Telefone *"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="(00) 00000-0000"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="CPF"
              value={form.cpf ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, cpf: event.target.value }))}
            />
            <Input
              label="Documento"
              value={form.document ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, document: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Status</label>
            <select
              className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={form.status ?? "DISPONIVEL"}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as DeliveryPersonStatus,
                }))
              }
            >
              {DELIVERY_PERSON_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Observações</label>
            <textarea
              className="min-h-[80px] w-full border border-neutral-300 px-4 py-2.5 text-sm"
              value={form.notes ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={detail ? `Histórico — ${detail.name}` : "Histórico do entregador"}
      >
        {detail ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-neutral-200 p-3">
                <p className="text-xs uppercase text-brand-gray">Total de entregas</p>
                <p className="text-lg font-semibold">{detail.stats.totalDeliveries}</p>
              </div>
              <div className="border border-neutral-200 p-3">
                <p className="text-xs uppercase text-brand-gray">Pedidos entregues</p>
                <p className="text-lg font-semibold">{detail.stats.deliveredOrders}</p>
              </div>
              <div className="border border-neutral-200 p-3">
                <p className="text-xs uppercase text-brand-gray">Pedidos cancelados</p>
                <p className="text-lg font-semibold">{detail.stats.cancelledOrders}</p>
              </div>
              <div className="border border-neutral-200 p-3">
                <p className="text-xs uppercase text-brand-gray">Última entrega</p>
                <p className="text-sm font-medium">
                  {formatDateTime(detail.stats.lastDeliveryAt)}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-brand-gray">Alterar status</label>
              <select
                className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
                value={detail.status}
                onChange={(event) =>
                  statusMutation.mutate({
                    id: detail.id,
                    status: event.target.value as DeliveryPersonStatus,
                  })
                }
              >
                {DELIVERY_PERSON_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                Registros recentes
              </h3>
              {detail.history.length === 0 ? (
                <p className="text-sm text-brand-gray">Nenhum registro no histórico.</p>
              ) : (
                <ol className="max-h-64 space-y-3 overflow-y-auto">
                  {detail.history.map((entry) => (
                    <li key={entry.id} className="border-b border-neutral-100 pb-3 last:border-0">
                      <p className="text-sm font-medium">{entry.descricao}</p>
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
          <p className="text-sm text-brand-gray">Carregando histórico...</p>
        )}
      </Modal>
    </div>
  );
}
