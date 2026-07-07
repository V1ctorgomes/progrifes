"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomerForm } from "@/features/admin/customers/CustomerForm";
import { customersAdminApi, getErrorMessage } from "@/lib/admin-api";
import { formatCpf, formatPhone } from "@/types/customer";
import type { CustomerInput } from "@/types/customer";

export function CustomersAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
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
  }, [debouncedSearch, cidade, bairro, statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", page, debouncedSearch, cidade, bairro, statusFilter],
    queryFn: () =>
      customersAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        cidade: cidade || undefined,
        bairro: bairro || undefined,
        ativo:
          statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });

  const createMutation = useMutation({
    mutationFn: (payload: CustomerInput) => customersAdminApi.create(payload),
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? customersAdminApi.deactivate(id) : customersAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: customersAdminApi.remove,
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Clientes
          </h1>
          <p className="text-sm text-brand-gray">Cadastro unificado de clientes da loja</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo cliente</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, telefone, CPF, e-mail..."
        />
        <Input
          label="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Filtrar por cidade"
        />
        <Input
          label="Bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Filtrar por bairro"
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
        <p className="text-sm text-brand-gray">Carregando clientes...</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum cliente encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">CPF</th>
                <th className="px-4 py-3 text-left">Cidade</th>
                <th className="px-4 py-3 text-left">Pedidos</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Cliente desde</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-medium">{customer.nome}</td>
                  <td className="px-4 py-3">{formatPhone(customer.telefone)}</td>
                  <td className="px-4 py-3">{customer.email ?? "—"}</td>
                  <td className="px-4 py-3">{formatCpf(customer.cpf)}</td>
                  <td className="px-4 py-3">{customer.cidade ?? "—"}</td>
                  <td className="px-4 py-3">{customer.pedidosCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        customer.ativo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {customer.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="text-sm font-medium underline hover:no-underline"
                      >
                        Ver
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-brand-gray hover:text-brand-black"
                        onClick={() =>
                          toggleMutation.mutate({ id: customer.id, ativo: customer.ativo })
                        }
                      >
                        {customer.ativo ? "Desativar" : "Ativar"}
                      </button>
                      {customer.pedidosCount === 0 && (
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => {
                            if (confirm("Excluir este cliente permanentemente?")) {
                              deleteMutation.mutate(customer.id);
                            }
                          }}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
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
            Página {meta.page} de {meta.totalPages} — {meta.total} cliente(s)
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

      <Modal open={modalOpen} title="Novo cliente" onClose={() => setModalOpen(false)}>
        <CustomerForm
          onSubmit={(payload) => createMutation.mutate(payload)}
          loading={createMutation.isPending}
          error={formError}
        />
      </Modal>
    </div>
  );
}
