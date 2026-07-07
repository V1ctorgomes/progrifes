"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SupplierForm } from "@/features/admin/suppliers/SupplierForm";
import { getErrorMessage, suppliersAdminApi } from "@/lib/admin-api";
import { formatCnpj, formatPhone, type SupplierInput } from "@/types/supplier";

export function SuppliersAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, cidade, estado, statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "suppliers", page, debouncedSearch, cidade, estado, statusFilter],
    queryFn: () =>
      suppliersAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
        ativo: statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  const suppliers = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });

  const createMutation = useMutation({
    mutationFn: (payload: SupplierInput) => suppliersAdminApi.create(payload),
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? suppliersAdminApi.deactivate(id) : suppliersAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersAdminApi.remove,
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Fornecedores
          </h1>
          <p className="text-sm text-brand-gray">Cadastro de fornecedores para compras e estoque</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo fornecedor</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Razão social, fantasia, CNPJ, telefone..."
        />
        <Input
          label="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Filtrar por cidade"
        />
        <Input
          label="Estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          placeholder="UF"
          maxLength={2}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando fornecedores...</p>
      ) : suppliers.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum fornecedor encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Nome fantasia</th>
                <th className="px-4 py-3 text-left">Razão social</th>
                <th className="px-4 py-3 text-left">CNPJ</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Cidade</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Cadastro</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-medium">{supplier.nomeFantasia}</td>
                  <td className="px-4 py-3">{supplier.razaoSocial}</td>
                  <td className="px-4 py-3">{formatCnpj(supplier.cnpj)}</td>
                  <td className="px-4 py-3">{formatPhone(supplier.telefone)}</td>
                  <td className="px-4 py-3">{supplier.cidade ?? "—"}</td>
                  <td className="px-4 py-3">{supplier.estado ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        supplier.ativo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {supplier.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/fornecedores/${supplier.id}`}
                        className="text-sm font-medium underline hover:no-underline"
                      >
                        Ver
                      </Link>
                      <button
                        type="button"
                        className="text-sm underline hover:no-underline"
                        onClick={() =>
                          toggleMutation.mutate({ id: supplier.id, ativo: supplier.ativo })
                        }
                      >
                        {supplier.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => {
                          if (confirm("Remover este fornecedor?")) {
                            deleteMutation.mutate(supplier.id);
                          }
                        }}
                      >
                        Remover
                      </button>
                    </div>
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
            Página {meta.page} de {meta.totalPages} · {meta.total} fornecedores
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
        title="Novo fornecedor"
      >
        <SupplierForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
          error={formError}
        />
      </Modal>
    </div>
  );
}
