"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage, neighborhoodsAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  NEIGHBORHOOD_TIME_PRESETS,
  type CreateNeighborhoodInput,
  type DeliveryNeighborhood,
} from "@/types/neighborhood";

const emptyForm: CreateNeighborhoodInput = {
  name: "",
  city: "",
  state: "",
  deliveryFee: 0,
  averageDeliveryTime: 45,
  isActive: true,
  notes: "",
};

export function NeighborhoodsAdminPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [city, setCity] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryNeighborhood | null>(null);
  const [form, setForm] = useState<CreateNeighborhoodInput>(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, city, statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "neighborhoods",
      page,
      debouncedSearch,
      city,
      statusFilter,
    ],
    queryFn: () =>
      neighborhoodsAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        city: city || undefined,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
        sort: "name",
      }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "neighborhoods"] });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (neighborhood: DeliveryNeighborhood) => {
    setEditing(neighborhood);
    setForm({
      name: neighborhood.name,
      city: neighborhood.city,
      state: neighborhood.state,
      deliveryFee: neighborhood.deliveryFee,
      averageDeliveryTime: neighborhood.averageDeliveryTime,
      isActive: neighborhood.isActive,
      notes: neighborhood.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return neighborhoodsAdminApi.update(editing.id, form);
      }
      return neighborhoodsAdminApi.create(form);
    },
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      neighborhoodsAdminApi.updateStatus(id, isActive),
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: neighborhoodsAdminApi.duplicate,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: neighborhoodsAdminApi.remove,
    onSuccess: invalidate,
  });

  const neighborhoods = data?.data ?? [];
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
              Bairros e Taxas
            </h1>
            <p className="text-sm text-brand-gray">
              Cadastre bairros atendidos, taxas fixas e prazos de entrega.
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
          Novo bairro
        </Button>
      </div>

      <div className="grid gap-3 border border-neutral-200 bg-brand-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome, cidade, observações..."
        />
        <Input label="Cidade" value={city} onChange={(event) => setCity(event.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | "active" | "inactive")
            }
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-4 py-3">Bairro</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">UF</th>
              <th className="px-4 py-3">Taxa</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-brand-gray">
                  Carregando bairros...
                </td>
              </tr>
            ) : neighborhoods.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-brand-gray">
                  Nenhum bairro cadastrado.
                </td>
              </tr>
            ) : (
              neighborhoods.map((neighborhood) => (
                <tr key={neighborhood.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-medium text-brand-black">{neighborhood.name}</td>
                  <td className="px-4 py-3 text-brand-gray">{neighborhood.city}</td>
                  <td className="px-4 py-3 text-brand-gray">{neighborhood.state}</td>
                  <td className="px-4 py-3 text-brand-black">
                    {formatCurrency(neighborhood.deliveryFee)}
                  </td>
                  <td className="px-4 py-3 text-brand-gray">
                    {neighborhood.averageDeliveryTime} min
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs uppercase ${
                        neighborhood.isActive ? "text-emerald-700" : "text-brand-gray"
                      }`}
                    >
                      {neighborhood.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(neighborhood)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          statusMutation.mutate({
                            id: neighborhood.id,
                            isActive: !neighborhood.isActive,
                          })
                        }
                      >
                        {neighborhood.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateMutation.mutate(neighborhood.id)}
                      >
                        Duplicar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Excluir o bairro ${neighborhood.name}?`)) {
                            deleteMutation.mutate(neighborhood.id);
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
            Página {meta.page} de {meta.totalPages} · {meta.total} bairro(s)
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
        title={editing ? "Editar bairro" : "Novo bairro"}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <Input
            label="Nome do bairro *"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Cidade *"
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              required
            />
            <Input
              label="Estado *"
              value={form.state}
              maxLength={2}
              onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
              required
            />
          </div>
          <Input
            label="Taxa de entrega (R$) *"
            type="number"
            min={0}
            step="0.01"
            value={form.deliveryFee}
            onChange={(event) =>
              setForm((current) => ({ ...current, deliveryFee: Number(event.target.value) }))
            }
            required
          />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-brand-gray">Prazo médio</p>
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOOD_TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, averageDeliveryTime: preset }))
                  }
                  className={`border px-3 py-2 text-sm ${
                    form.averageDeliveryTime === preset
                      ? "border-brand-black bg-brand-black text-brand-white"
                      : "border-neutral-300"
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
            <Input
              label="Prazo manual (minutos)"
              type="number"
              min={1}
              value={form.averageDeliveryTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  averageDeliveryTime: Number(event.target.value),
                }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(event) =>
                setForm((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Bairro ativo
          </label>
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
    </div>
  );
}
